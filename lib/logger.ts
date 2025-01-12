import config from './config';

// Custom logger that works in both development and production
const logger = {
  log: (...args: any[]) => {
    // Debug the environment
    console.log('[Logger Debug] Environment:', {
      isDev: config.app.isDev,
      isProd: config.app.isProd,
      loggingEnabled: config.logging.enabled
    });

    // Always log in development
    if (config.app.isDev) {
      console.log(...args);
      return;
    }

    // In production, only log if enabled
    if (config.logging.enabled) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors in both development and production
    console.error(...args);
  }
};

// Log environment on module load
console.log('[Logger] Initializing with environment:', {
  isDev: config.app.isDev,
  isProd: config.app.isProd,
  loggingEnabled: config.logging.enabled
});

export default logger; 