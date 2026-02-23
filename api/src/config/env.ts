const NODE_ENV = process.env.NODE_ENV ?? 'development';

const envDefaults = {
  development: {
    port: 3000,
    logLevel: 'debug',
    corsOrigins: ['http://localhost:5173'],
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 100,
    minSubmissionTimeSeconds: 5,
  },
  uat: {
    port: 3000,
    logLevel: 'info',
    corsOrigins: ['https://aswa-pregate-uat.azurestaticapps.net'],
    rateLimitWindowMs: 60 * 60 * 1000,
    rateLimitMax: 60,
    minSubmissionTimeSeconds: 10,
  },
  production: {
    port: 3000,
    logLevel: 'warn',
    corsOrigins: ['https://aswa-pregate-prod.azurestaticapps.net'],
    rateLimitWindowMs: 60 * 60 * 1000,
    rateLimitMax: 30,
    minSubmissionTimeSeconds: 15,
  },
} as const;

type EnvKey = keyof typeof envDefaults;

const currentEnv = (Object.keys(envDefaults).includes(NODE_ENV) ? NODE_ENV : 'development') as EnvKey;
const defaults = envDefaults[currentEnv];

export const config = {
  nodeEnv: NODE_ENV,
  port: Number(process.env.PORT ?? defaults.port),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://pregate:pregate_dev_password@localhost:5432/pregate_dev',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  logLevel: process.env.LOG_LEVEL ?? defaults.logLevel,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : defaults.corsOrigins,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? defaults.rateLimitWindowMs),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? defaults.rateLimitMax),
  minSubmissionTimeSeconds: Number(process.env.MIN_SUBMISSION_TIME_SECONDS ?? defaults.minSubmissionTimeSeconds),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
};
