/**
 * Application configuration constants
 * All values are hardcoded - no environment variables required
 */


// API configuration

export const API_BASE_URL = '';
export const API_TIMEOUT = 10000;


// App configuration

export const APP_NAME = 'BrandNav Email Verifier';
export const APP_VERSION = '2.0.0';


// Authentication configuration

export const USER_STORAGE_KEY = 'user';


// Development configuration

export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;


/**
 * Environment configuration object for easy access
 */
export const config = {
    api: {
        baseUrl: API_BASE_URL,
        timeout: API_TIMEOUT,
    },
    app: {
        name: APP_NAME,
        version: APP_VERSION,
        isDevelopment: IS_DEVELOPMENT,
        isProduction: IS_PRODUCTION,
    },
    auth: {
        userStorageKey: USER_STORAGE_KEY,
    },
} as const;