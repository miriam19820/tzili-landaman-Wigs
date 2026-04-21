import logger from '../Utils/logger.js';

export const errorHandler = (err: any, req: any, res: any, next: any) => {

  logger.error(err.message, { stack: err.stack });
  
  res.status(500).json({ error: err.message });
};