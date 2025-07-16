/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTH_URL: string;
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID: string;
  readonly VITE_OAUTH_REDIRECT_URI: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_DEBUG: string;
  readonly VITE_ENABLE_MSW: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_SESSION_WARNING_TIME: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly url: string;
}
