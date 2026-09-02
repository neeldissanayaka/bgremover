/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_LEMONSQUEEZY_STORE_ID?: string;
  readonly VITE_LEMONSQUEEZY_STORE_URL?: string;
  readonly VITE_LEMONSQUEEZY_PAYG_3_URL?: string;
  readonly VITE_LEMONSQUEEZY_PAYG_10_URL?: string;
  readonly VITE_LEMONSQUEEZY_PAYG_50_URL?: string;
  readonly VITE_LEMONSQUEEZY_LITE_URL?: string;
  readonly VITE_LEMONSQUEEZY_PRO_URL?: string;
  readonly VITE_LEMONSQUEEZY_UNLIMITED_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (error: any) => void;
          }): {
            requestAccessToken(overrideConfig?: { prompt?: string }): void;
          };
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode?: 'popup' | 'redirect';
            redirect_uri?: string;
            callback: (response: { code?: string; error?: string }) => void;
          }): {
            requestCode(): void;
          };
        };
        id: {
          initialize(config: any): void;
          renderButton(parent: HTMLElement, options: any): void;
          prompt(momentListener?: (moment: any) => void): void;
        };
      };
    };
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup: (options: {
        eventHandler: (data: { event: string; data?: any }) => void;
      }) => void;
    };
  }
}

export {};


