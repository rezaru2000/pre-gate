import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/env';

const { combine, timestamp, json, errors } = winston.format;

const baseFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: baseFormat,
  }),
];

if (config.nodeEnv === 'uat' || config.nodeEnv === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: baseFormat,
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: {
    service: 'pregate-api',
    environment: config.nodeEnv,
  },
  transports,
});

export default logger;
