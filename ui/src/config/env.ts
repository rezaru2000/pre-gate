const VITE_ENV = import.meta.env['VITE_ENV'] ?? 'development';

const envConfig = {
  development: {
    // Use empty string to hit Vite proxy (avoids CORS, same-origin requests)
    apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] ?? '',
    environment: 'development',
  },
  uat: {
    apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] ?? 'https://ca-pregate-uat.azurecontainerapps.io',
    environment: 'uat',
  },
  production: {
    apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] ?? 'https://ca-pregate-prod.azurecontainerapps.io',
    environment: 'production',
  },
} as const;

type EnvKey = keyof typeof envConfig;
const currentEnv = (Object.keys(envConfig).includes(VITE_ENV) ? VITE_ENV : 'development') as EnvKey;

export const config = envConfig[currentEnv];
