/**
 * Premium Animated Favicon Controller
 * Dynamically changes favicon based on page state and user interactions
 */

type FaviconState = 'default' | 'pulse' | 'notification';

class FaviconController {
  private currentState: FaviconState = 'default';
  private faviconLink: HTMLLinkElement | null = null;
  private originalTitle: string = '';
  private blinkInterval: number | null = null;
  private badgeCount: number = 0;

  private icons = {
    default: '/favicon-96x96.png',
    pulse: '/favicon-pulse-96x96.png',
    notification: '/favicon-notification-96x96.png',
  };

  constructor() {
    this.init();
  }

  /**
   * Initialize the favicon controller
   */
  private init(): void {
    // Get or create favicon link element
    this.faviconLink = document.querySelector("link[rel~='icon']");
    
    if (!this.faviconLink) {
      this.faviconLink = document.createElement('link');
      this.faviconLink.rel = 'icon';
      document.head.appendChild(this.faviconLink);
    }

    // Store original title
    this.originalTitle = document.title;

    // Set default favicon
    this.setState('default');

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for automatic state changes
   */
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // When tab becomes inactive, show pulsing favicon
        this.setState('pulse');
        this.startTitleBlink('👋 Come back!');
      } else {
        // When tab becomes active, return to default
        this.setState('default');
        this.stopTitleBlink();
      }
    });

    // Handle focus events (additional layer)
    window.addEventListener('blur', () => {
      if (this.currentState === 'default') {
        this.setState('pulse');
      }
    });

    window.addEventListener('focus', () => {
      this.setState('default');
      this.stopTitleBlink();
    });
  }

  /**
   * Set favicon state
   */
  setState(state: FaviconState): void {
    if (!this.faviconLink) return;

    this.currentState = state;
    this.faviconLink.href = this.icons[state];
  }

  /**
   * Show notification favicon with optional custom message
   */
  showNotification(message?: string): void {
    this.setState('notification');
    
    if (message) {
      this.startTitleBlink(message);
    }
  }

  /**
   * Clear notification and return to default state
   */
  clearNotification(): void {
    this.setState('default');
    this.stopTitleBlink();
  }

  /**
   * Start blinking title (for when tab is inactive)
   */
  private startTitleBlink(message: string): void {
    if (this.blinkInterval) return; // Already blinking

    let toggle = false;
    this.blinkInterval = window.setInterval(() => {
      document.title = toggle ? this.originalTitle : message;
      toggle = !toggle;
    }, 1500);
  }

  /**
   * Stop title blinking and restore original
   */
  private stopTitleBlink(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    document.title = this.originalTitle;
  }

  /**
   * Manually update the favicon with a data URL or path
   */
  setCustomFavicon(iconPath: string): void {
    if (!this.faviconLink) return;
    this.faviconLink.href = iconPath;
  }

  /**
   * Get current state
   */
  getCurrentState(): FaviconState {
    return this.currentState;
  }

  /**
   * Set badge count on favicon (e.g., unread messages)
   */
  setBadgeCount(count: number): void {
    this.badgeCount = Math.max(0, count);
    this.updateFaviconWithBadge();
  }

  /**
   * Update favicon with badge overlay
   */
  private async updateFaviconWithBadge(): Promise<void> {
    if (this.badgeCount === 0) {
      // No badge, show normal favicon
      this.setState(this.currentState);
      return;
    }

    try {
      // Load current favicon image
      const currentIcon = this.icons[this.currentState];
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Draw original favicon
        ctx.drawImage(img, 0, 0, size, size);
        
        // Draw badge
        const badgeSize = 32;
        const badgeX = size - badgeSize;
        const badgeY = 0;
        
        // Badge background
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.beginPath();
        ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Badge border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Badge text
        const badgeText = this.badgeCount > 9 ? '9+' : this.badgeCount.toString();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + badgeSize/2, badgeY + badgeSize/2 + 1);
        
        // Update favicon
        if (this.faviconLink) {
          this.faviconLink.href = canvas.toDataURL();
        }
      };
      
      img.src = currentIcon;
    } catch (error) {
      console.error('Failed to create badge favicon:', error);
      // Fallback to normal favicon
      this.setState(this.currentState);
    }
  }

  /**
   * Cleanup (remove event listeners)
   */
  destroy(): void {
    this.stopTitleBlink();
    // Note: In a real app, you'd remove event listeners here
  }
}

// Create and export singleton instance
export const faviconController = new FaviconController();

// Export class for testing or custom instances
export default FaviconController;
