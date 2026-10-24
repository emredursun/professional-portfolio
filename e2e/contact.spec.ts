import type { Page } from '@playwright/test';
import { copy, expect, test } from './fixtures';

const WEB3FORMS = 'https://api.web3forms.com/submit';
const contact = copy('en', 'contact');
const common = copy('en', 'common');

async function fillValidForm(page: Page) {
  await page.getByRole('textbox', { name: contact.form.name.label }).fill('Ada Lovelace');
  await page.getByRole('textbox', { name: contact.form.email.label }).fill('ada@example.com');
  await page
    .getByRole('textbox', { name: contact.form.message.label })
    .fill('I would like to talk about a Tosca assignment in a Pega programme.');
}

const sendButton = (page: Page) => page.getByRole('button', { name: common.buttons.sendMessage });

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('a valid message is sent and confirmed', async ({ page }) => {
    let body = '';
    await page.route(WEB3FORMS, async (route) => {
      body = route.request().postData() ?? '';
      await route.fulfill({ json: { success: true } });
    });

    await fillValidForm(page);
    await sendButton(page).click();

    await expect(page.getByRole('heading', { name: contact.messages.success.title })).toBeVisible();
    expect(body).toContain('Ada Lovelace');
    expect(body).toContain('access_key');
  });

  test('a server failure shows the error state and allows a retry', async ({ page, problems }) => {
    await page.route(WEB3FORMS, (route) => route.fulfill({ status: 500, body: 'upstream down' }));

    await fillValidForm(page);
    await sendButton(page).click();

    await expect(page.getByRole('alert')).toContainText(contact.messages.error.title);
    // What the visitor typed is still there, so a retry is one click.
    await expect(page.getByRole('textbox', { name: contact.form.name.label })).toHaveValue('Ada Lovelace');
    await expect(page.getByRole('textbox', { name: contact.form.message.label })).toHaveValue(/Tosca assignment/);

    await page.unroute(WEB3FORMS);
    await page.route(WEB3FORMS, (route) => route.fulfill({ json: { success: true } }));
    await sendButton(page).click();
    await expect(page.getByRole('heading', { name: contact.messages.success.title })).toBeVisible();

    // The browser logs the deliberate 500 itself; that line is expected here.
    problems.splice(0, problems.length, ...problems.filter((p) => !p.includes('status of 500')));
  });

  test('a rejected message reports a fixed code, never the provider text', async ({ page }) => {
    await page.route(WEB3FORMS, (route) =>
      route.fulfill({ json: { success: false, message: 'Blocked sender ada@example.com token=abc123' } }),
    );

    await fillValidForm(page);
    await sendButton(page).click();
    await expect(page.getByRole('alert')).toContainText(contact.messages.error.title);

    // The empty test stub of Plausible leaves every call on its queue.
    const errors = await page.evaluate(() =>
      (window.plausible?.q ?? [])
        .filter((call) => Array.isArray(call) && call[0] === 'JS Error')
        .map((call) => JSON.stringify(call)),
    );
    expect(errors).toEqual([
      JSON.stringify(['JS Error', { props: { message: 'ContactSubmitError: rejected', source: 'promise' } }]),
    ]);
  });

  test('a request that never answers times out and keeps the message', async ({ page }) => {
    // Never fulfilled: only the form's own timeout can end it.
    await page.route(WEB3FORMS, () => {});
    await page.clock.install();
    await fillValidForm(page);
    await sendButton(page).click();
    await page.clock.fastForward(16000);

    await expect(page.getByRole('alert')).toContainText(contact.messages.error.title);
    await expect(page.getByRole('textbox', { name: contact.form.message.label })).toHaveValue(/Tosca assignment/);
  });

  test('a short message is blocked before any request is made', async ({ page }) => {
    let requests = 0;
    await page.route(WEB3FORMS, (route) => {
      requests += 1;
      return route.fulfill({ json: { success: true } });
    });

    await fillValidForm(page);
    const message = page.getByRole('textbox', { name: contact.form.message.label });
    await message.fill('Too short');
    await sendButton(page).click();

    expect(await message.evaluate((el: HTMLTextAreaElement) => el.validity.tooShort)).toBe(true);
    expect(requests).toBe(0);
  });

  test('a bot that ticks the honeypot gets a fake success and no email is sent', async ({ page }) => {
    let requests = 0;
    await page.route(WEB3FORMS, (route) => {
      requests += 1;
      return route.fulfill({ json: { success: true } });
    });

    await fillValidForm(page);
    // A bot fills every field programmatically, including the hidden one.
    await page.locator('input[name="botcheck"]').evaluate((el: HTMLInputElement) => (el.checked = true));
    await sendButton(page).click();

    await expect(page.getByRole('heading', { name: contact.messages.success.title })).toBeVisible();
    expect(requests).toBe(0);
  });
});

test.describe('map consent', () => {
  test('Google Maps loads only after the visitor asks for it', async ({ page }) => {
    const googleRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('google.com')) googleRequests.push(req.url());
    });
    await page.route('https://www.google.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<p>map</p>' }),
    );

    await page.goto('/contact');
    await expect(page.locator('iframe[title="Location Map"]')).toHaveCount(0);
    expect(googleRequests).toEqual([]);

    await page.getByRole('button', { name: contact.map.load }).click();

    // The work city, never the home town (tests/privacy.test.ts).
    await expect(page.locator('iframe[title="Location Map"]')).toHaveAttribute('src', /google\.com\/maps\?q=Nieuwegein.*output=embed/);
    await expect(page.locator('iframe[title="Location Map"]')).toHaveAttribute(
      'referrerpolicy',
      'strict-origin-when-cross-origin',
    );
  });
});
