import winston from 'winston';
import path from 'path';

// פורמט התאריך לשם הקובץ (YYYY-MM-DD)
const getLogFileName = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

// יצירת Logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
    })
  ),
  transports: [
    // כתיבה לקובץ יומי
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs', getLogFileName()),
      level: 'error'
    }),
    // כתיבה ל-console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default logger;
