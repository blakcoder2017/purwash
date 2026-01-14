// Admin Portal Configuration
const CONFIG = {
    development: {
        API_BASE: 'http://localhost:5000/api',
        WS_URL: 'ws://localhost:5000',
        REFRESH_INTERVAL: 30000, // 30 seconds
        PAGE_SIZE: 10
    },
    production: {
        API_BASE: 'https://purwash-api.com/api',
        WS_URL: 'wss://purwash-api.com',
        REFRESH_INTERVAL: 60000, // 1 minute
        PAGE_SIZE: 20
    }
};

// Current environment detection
const getEnvironment = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
    } else {
        return 'production';
    }
};

// Current config
const currentConfig = CONFIG[getEnvironment()];

// Export configuration
window.CONFIG = currentConfig;
window.API_BASE_URL = currentConfig.API_BASE;
window.WS_URL = currentConfig.WS_URL;
window.REFRESH_INTERVAL = currentConfig.REFRESH_INTERVAL;
window.PAGE_SIZE = currentConfig.PAGE_SIZE;

// Log current environment (remove in production)
if (getEnvironment() !== 'production') {
    console.log('Admin Portal Environment:', getEnvironment());
    console.log('API Base URL:', currentConfig.API_BASE);
}
