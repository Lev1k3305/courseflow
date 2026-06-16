// lib/vkBridge.ts
import bridge from '@vkontakte/vk-bridge';

/**
 * VK Bridge configuration and utilities
 */

interface VKBridgeConfig {
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
}

interface VKUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
}

class VKBridgeManager {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private userInfoPromise: Promise<VKUserInfo | null> | null = null;
  private config: Required<VKBridgeConfig>;

  constructor(config: VKBridgeConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Log with debug mode support
   */
  private log(message: string, data?: any) {
    if (this.config.debug) {
      console.log(`[VKBridge] ${message}`, data || '');
    }
  }

  /**
   * Log error with context
   */
  private logError(message: string, error?: any) {
    console.error(`[VKBridge] ${message}`, error || '');
  }

  /**
   * Check if VK Bridge is available in window
   */
  private isVKBridgeAvailable(): boolean {
    // In development (non-production), mock VK Bridge availability to avoid errors.
    if (process.env.NODE_ENV !== 'production') {
      this.log('Mocking VK Bridge availability in development mode');
      return true;
    }
    if (typeof window === 'undefined') {
      this.log('Window object not available');
      return false;
    }

    const available = !!(window as any).VKBridge;
    if (!available) {
      this.log('VK Bridge not available in window');
    }
    return available;
  }

  /**
   * Initialize VK Bridge with retry logic
   */
  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return if already initialized
    if (this.isInitialized) {
      this.log('VK Bridge already initialized');
      return;
    }

    this.initPromise = this._initWithRetry();
    await this.initPromise;
  }

  /**
   * Internal init with retry logic
   */
  private async _initWithRetry(): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (!this.isVKBridgeAvailable()) {
          throw new Error('VK Bridge is not available');
        }

        this.log(`Initializing VK Bridge (attempt ${attempt}/${this.config.maxRetries})`);

        // Send init command
        const response = await bridge.send('VKWebAppInit');
        
        this.log('VK Bridge initialized successfully', response);
        this.isInitialized = true;
        return;
      } catch (error) {
        lastError = error;
        this.logError(`Initialization attempt ${attempt} failed:`, error);

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt; // Exponential backoff
          this.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.logError(
      `Failed to initialize VK Bridge after ${this.config.maxRetries} attempts`,
      lastError
    );
    this.isInitialized = false;
  }

  /**
   * Get user info with error handling and caching
   */
  async getUserInfo(): Promise<VKUserInfo | null> {
    if (this.userInfoPromise) {
      this.log('Returning cached user info promise');
      return this.userInfoPromise;
    }

    this.userInfoPromise = (async () => {
      try {
        if (!this.isVKBridgeAvailable()) {
          this.log('VK Bridge not available for getUserInfo');
          return null;
        }

        this.log('Fetching VK user info');
        const userInfo = await bridge.send('VKWebAppGetUserInfo');

        this.log('User info fetched successfully', {
          id: userInfo?.id,
          first_name: userInfo?.first_name,
          last_name: userInfo?.last_name,
        });

        return userInfo || null;
      } catch (error) {
        this.logError('Failed to get user info:', error);
        // Reset promise on error to allow retry
        this.userInfoPromise = null;
        return null;
      }
    })();

    return this.userInfoPromise;
  }

  /**
   * Subscribe to VK Bridge events
   */
  subscribe(handler: (event: any) => void): void {
    try {
      if (!this.isVKBridgeAvailable()) {
        this.log('VK Bridge not available for subscribe');
        return;
      }

      this.log('Subscribing to VK Bridge events');
      bridge.subscribe(handler);
    } catch (error) {
      this.logError('Failed to subscribe to events:', error);
    }
  }

  /**
   * Unsubscribe from VK Bridge events
   */
  unsubscribe(handler: (event: any) => void): void {
    try {
      if (!this.isVKBridgeAvailable()) {
        this.log('VK Bridge not available for unsubscribe');
        return;
      }

      this.log('Unsubscribing from VK Bridge events');
      bridge.unsubscribe(handler);
    } catch (error) {
      this.logError('Failed to unsubscribe from events:', error);
    }
  }

  /**
   * Check if initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const vkBridgeManager = new VKBridgeManager({
  maxRetries: 3,
  retryDelay: 1000,
  debug: true,
});

// Export types
export type { VKUserInfo };