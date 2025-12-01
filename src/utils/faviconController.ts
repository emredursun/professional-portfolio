/**
 * Premium Animated Favicon Controller
 * Dynamically changes favicon based on page state and user interactions
 * Features: Animations, Badge Count, Loading States, Analytics, User Preferences
 */

type FaviconState = 'default' | 'pulse' | 'notification' | 'loading';
type PageContext = 'About' | 'Resume' | 'Projects' | 'Contact';

interface FaviconAnalytics {
  pulseActivations: number;
  userReturns: number;
  averageReturnTime: number;
  badgeCounts: { total: number; max: number };
  pageChanges: Record<PageContext, number>;
  loadingStates: number;
}

class FaviconController {
  private currentState: FaviconState = 'default';
  private faviconLink: HTMLLinkElement | null = null;
  private originalTitle: string = '';
  private blinkInterval: number | null = null;
  private badgeCount: number = 0;
  private currentPage: PageContext = 'About';
  private animationsEnabled: boolean = true;
  private loadingTimeout: number | null = null;

  // Analytics tracking
  private analytics: FaviconAnalytics = {
    pulseActivations: 0,
    userReturns: 0,
    averageReturnTime: 0,
    badgeCounts: { total: 0, max: 0 },
    pageChanges: { About: 0, Resume: 0, Projects: 0, Contact: 0 },
    loadingStates: 0,
  };
  private pulseStartTime: number = 0;
  private returnTimes: number[] = [];

  private icons = {
    default: '/favicon-96x96.png',
    pulse: '/favicon-pulse-96x96.png',
    notification: '/favicon-notification-96x96.png',
  };

  // Page-specific colors
  private pageColors: Record<PageContext, string> = {
    About: '#fbbf24', // yellow
    Resume: '#3b82f6', // blue
    Projects: '#a855f7', // purple
    Contact: '#10b981', // green
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

    // Load preferences and analytics from localStorage
    this.loadPreferences();
    this.loadAnalytics();

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animationsEnabled = false;
    }

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
        if (this.animationsEnabled && this.currentState !== 'loading') {
          this.pulseStartTime = Date.now();
          this.setState('pulse');
          this.startTitleBlink('👋 Come back!');
          this.analytics.pulseActivations++;
          this.saveAnalytics();
        }
      } else {
        // When tab becomes active, return to default
        if (this.currentState === 'pulse') {
          const returnTime = Date.now() - this.pulseStartTime;
          this.returnTimes.push(returnTime);
          this.analytics.userReturns++;
          this.calculateAverageReturnTime();
          this.saveAnalytics();
        }
        this.setState('default');
        this.stopTitleBlink();
      }
    });

    // Handle focus events (additional layer)
    window.addEventListener('blur', () => {
      if (this.currentState === 'default' && this.animationsEnabled) {
        this.setState('pulse');
      }
    });

    window.addEventListener('focus', () => {
      if (this.currentState !== 'loading') {
        this.setState('default');
        this.stopTitleBlink();
      }
    });
  }

  /**
   * Set favicon state
   */
  setState(state: FaviconState): void {
    if (state === 'loading') {
      this.currentState = state;
      this.showLoadingFavicon();
      return;
    }

    this.currentState = state;
    
    if (this.badgeCount > 0) {
      this.updateFaviconWithBadge();
    } else if (this.currentPage !== 'About') {
      this.updateFaviconWithPageContext();
    } else {
      this.updateFavicon();
    }
  }

  /**
   * Update favicon based on current state
   */
  private updateFavicon(): void {
    if (!this.faviconLink) return;
    
    const iconPath = this.icons[this.currentState as keyof typeof this.icons] || this.icons.default;
    this.faviconLink.href = iconPath + '?v=' + Date.now(); // Cache busting
  }

  /**
   * Start title blinking animation
   */
  private startTitleBlink(message: string): void {
    if (!this.animationsEnabled) return;
    
    this.stopTitleBlink();
    
    let isOriginal = true;
    this.blinkInterval = window.setInterval(() => {
      document.title = isOriginal ? message : this.originalTitle;
      isOriginal = !isOriginal;
    }, 1000);
  }

  /**
   * Stop title blinking animation
   */
  private stopTitleBlink(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    document.title = this.originalTitle;
  }

  /**
   * Show notification with custom message
   */
  showNotification(message: string, duration: number = 5000): void {
    this.setState('notification');
    this.startTitleBlink(message);

    // Auto-clear after duration
    setTimeout(() => {
      this.clearNotification();
    }, duration);
  }

  /**
   * Clear notification state
   */
  clearNotification(): void {
    this.setState('default');
    this.stopTitleBlink();
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
    
    // Update analytics
    this.analytics.badgeCounts.total++;
    this.analytics.badgeCounts.max = Math.max(this.analytics.badgeCounts.max, this.badgeCount);
    this.saveAnalytics();
    
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
      const currentIcon = this.icons[this.currentState as keyof typeof this.icons] || this.icons.default;
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
      this.updateFavicon();
    }
  }

  /**
   * Set page context for page-specific favicon
   */
  setPageContext(page: PageContext): void {
    this.currentPage = page;
    this.analytics.pageChanges[page]++;
    this.saveAnalytics();
    
    if (this.badgeCount > 0) {
      this.updateFaviconWithBadge();
    } else {
      this.updateFaviconWithPageContext();
    }
  }

  /**
   * Update favicon with page-specific color accent
   */
  private async updateFaviconWithPageContext(): Promise<void> {
    if (this.currentPage === 'About') {
      this.updateFavicon();
      return;
    }

    try {
      const currentIcon = this.icons[this.currentState as keyof typeof this.icons] || this.icons.default;
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
        
        // Draw page indicator dot
        const dotSize = 12;
        const dotX = size - dotSize - 4;
        const dotY = size - dotSize - 4;
        
        ctx.fillStyle = this.pageColors[this.currentPage];
        ctx.beginPath();
        ctx.arc(dotX + dotSize/2, dotY + dotSize/2, dotSize/2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Dot border
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Update favicon
        if (this.faviconLink) {
          this.faviconLink.href = canvas.toDataURL();
        }
      };
      
      img.src = currentIcon;
    } catch (error) {
      console.error('Failed to create page context favicon:', error);
      this.updateFavicon();
    }
  }

  /**
   * Show loading spinner favicon
   */
  showLoading(): void {
    this.analytics.loadingStates++;
    this.saveAnalytics();
    
    this.setState('loading');
    
    // Auto-clear loading after 30 seconds (safety)
    this.loadingTimeout = window.setTimeout(() => {
      this.hideLoading();
    }, 30000);
  }

  /**
   * Hide loading spinner favicon
   */
  hideLoading(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    this.setState('default');
  }

  /**
   * Show loading favicon with rotating arc
   */
  private showLoadingFavicon(): void {
    let angle = 0;
    
    const drawSpinner = () => {
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || !this.faviconLink) return;
      
      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, size, size);
      
      // Spinner arc
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(size/2, size/2, 32, angle, angle + Math.PI * 1.5);
      ctx.stroke();
      
      this.faviconLink.href = canvas.toDataURL();
      
      angle += 0.15;
      
      if (this.currentState === 'loading') {
        requestAnimationFrame(drawSpinner);
      }
    };
    
    drawSpinner();
  }

  /**
   * Enable/disable animations
   */
  setAnimationsEnabled(enabled: boolean): void {
    this.animationsEnabled = enabled;
    this.savePreferences();
    
    if (!enabled && this.currentState === 'pulse') {
      this.setState('default');
      this.stopTitleBlink();
    }
  }

  /**
   * Get animations enabled status
   */
  getAnimationsEnabled(): boolean {
    return this.animationsEnabled;
  }

  /**
   * Get analytics data
   */
  getAnalytics(): FaviconAnalytics {
    return { ...this.analytics };
  }

  /**
   * Reset analytics
   */
  resetAnalytics(): void {
    this.analytics = {
      pulseActivations: 0,
      userReturns: 0,
      averageReturnTime: 0,
      badgeCounts: { total: 0, max: 0 },
      pageChanges: { About: 0, Resume: 0, Projects: 0, Contact: 0 },
      loadingStates: 0,
    };
    this.returnTimes = [];
    this.saveAnalytics();
  }

  /**
   * Calculate average return time
   */
  private calculateAverageReturnTime(): void {
    if (this.returnTimes.length === 0) return;
    
    const sum = this.returnTimes.reduce((a, b) => a + b, 0);
    this.analytics.averageReturnTime = Math.round(sum / this.returnTimes.length);
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('faviconPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.animationsEnabled = prefs.animationsEnabled ?? true;
      }
    } catch (error) {
      console.error('Failed to load favicon preferences:', error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('faviconPreferences', JSON.stringify({
        animationsEnabled: this.animationsEnabled,
      }));
    } catch (error) {
      console.error('Failed to save favicon preferences:', error);
    }
  }

  /**
   * Load analytics from localStorage
   */
  private loadAnalytics(): void {
    try {
      const saved = localStorage.getItem('faviconAnalytics');
      if (saved) {
        this.analytics = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load favicon analytics:', error);
    }
  }

  /**
   * Save analytics to localStorage
   */
  private saveAnalytics(): void {
    try {
      localStorage.setItem('faviconAnalytics', JSON.stringify(this.analytics));
    } catch (error) {
      console.error('Failed to save favicon analytics:', error);
    }
  }

  /**
   * Cleanup (remove event listeners)
   */
  destroy(): void {
    this.stopTitleBlink();
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    // Note: In a real app, you'd remove event listeners here
  }
}

// Create and export singleton instance
export const faviconController = new FaviconController();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).faviconController = faviconController;
}
