
import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

const nodeId = process.env.NODE_ID || 'unknown';

const devFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] [${nodeId}]: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.format = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    devFormat
  );
}

export default logger;
