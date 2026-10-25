// The official JSON Resume validator ships without type definitions.
declare module '@jsonresume/schema' {
  export function validate(
    resume: unknown,
    callback: (errors: unknown, valid?: boolean) => void,
  ): void;
}
