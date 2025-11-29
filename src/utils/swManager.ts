import { Workbox } from 'workbox-window';

export class ServiceWorkerManager {
  private wb: Workbox | null = null;
  private updateAvailable: boolean = false;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported in this browser');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('Service Worker registration skipped in development mode');
      return;
    }

    this.wb = new Workbox('/sw.js');

    // Listen for waiting service worker (update available)
    this.wb.addEventListener('waiting', () => {
      this.updateAvailable = true;
      this.showUpdatePrompt();
    });

    // Listen for controlling event (service worker activated)
    this.wb.addEventListener('controlling', () => {
      // Service worker is now controlling the page
      console.log('Service Worker is now controlling the page');
    });

    // Listen for activated event
    this.wb.addEventListener('activated', (event) => {
      // Service worker activated
      if (!event.isUpdate) {
        console.log('Service Worker activated for the first time');
      } else {
        console.log('Service Worker updated and activated');
      }
    });

    try {
      await this.wb.register();
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private showUpdatePrompt(): void {
    // Show UI prompt: "New version available. Update now?"
    const updateConfirmed = window.confirm(
      'A new version of the app is available. Would you like to update now?'
    );

    if (updateConfirmed && this.wb) {
      // Tell the service worker to skip waiting
      this.wb.messageSkipWaiting();

      // Reload the page when the new service worker takes control
      this.wb.addEventListener('controlling', () => {
        window.location.reload();
      });
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.wb) {
      try {
        await this.wb.update();
        console.log('Checked for Service Worker updates');
      } catch (error) {
        console.error('Failed to check for Service Worker updates:', error);
      }
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  async skipWaiting(): Promise<void> {
    if (this.wb && this.updateAvailable) {
      this.wb.messageSkipWaiting();
    }
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();
