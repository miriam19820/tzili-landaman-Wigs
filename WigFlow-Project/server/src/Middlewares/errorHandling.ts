import logger from '../Utils/logger';

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  // כתיבה ללוג
  logger.error(err.message, { stack: err.stack });
  
  res.status(500).json({ error: err.message });
};
