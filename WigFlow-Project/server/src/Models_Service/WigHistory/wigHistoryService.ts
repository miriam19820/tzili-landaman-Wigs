import { WigHistory } from './wigHistoryModel.js';

/**
 * פונקציה להוספת אירוע חדש להיסטוריה
 */
export const addHistoryEvent = async (data: {
  wigCode: string,
  actionType: 'יצור' | 'תיקון' | 'סירוק' | 'הערת מנהלת',
  stage: string,
  workerName: string,
  description: string,
  beforeImageUrl?: string,
  afterImageUrl?: string,
  notes?: string
}) => {
  return await WigHistory.create(data);
};

/**
 * שליפת כל ההיסטוריה של פאה לפי הקוד שלה - מסודר מהחדש לישן
 */
export const getFullHistoryByCode = async (wigCode: string) => {
  return await WigHistory.find({ wigCode }).sort({ createdAt: -1 });
};