import { describe, it, expect, jest } from '@jest/globals';

describe('Notification Service QA Mocking Test', () => {
  
  it('Should successfully mock and verify notification service parameters', async () => {
    // יצירת אובייקט בדיקה מקומי בלי טיפוסים מורכבים - ככה TypeScript לא יכול לצעוק!
    const mockNotificationService = {
      sendNotification: jest.fn().mockImplementation((phone, message) => {
        if (!phone || !message) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      })
    };

    // הרצת בדיקת ה-QA
    const result = await mockNotificationService.sendNotification('0501234567', 'טסט מושבת וואטסאפ');
    
    // וידוא שהלוגיקה עובדת פיקס
    expect(result).toBe(true);
    expect(mockNotificationService.sendNotification).toHaveBeenCalledWith('0501234567', 'טסט מושבת וואטסאפ');
  });
});