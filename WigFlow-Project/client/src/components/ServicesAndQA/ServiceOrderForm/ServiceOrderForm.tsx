import React, { useState } from 'react';
import './ServiceOrderForm.css'; // <-- הוספנו את ה-CSS

// הגדרת המבנה של הנתונים (Interface) כדי שהטייפסקריפט יהיה מרוצה
interface IServiceForm {
  customerName: string;
  serviceType: string;
  styleCategory: string;
  isUrgent: boolean;
  note: string;
}

export const ServiceOrderForm: React.FC = () => {
  // ניהול המצב של הטופס (State)
  const [formData, setFormData] = useState<IServiceForm>({
    customerName: '',
    serviceType: 'חפיפה וסירוק',
    styleCategory: 'חלק',
    isUrgent: false,
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('נתונים שנשלחו:', formData);
    alert('הזמנת שירות נוצרה בהצלחה!');
  };

  return (
    <div className="service-form-container">
      <h2 className="service-form-title">פתיחת הזמנת שירות - מזכירה</h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* שם הלקוחה */}
        <div className="form-group">
          <label className="form-label">שם הלקוחה:</label>
          <input 
            type="text"
            className="form-input"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            required
          />
        </div>

        {/* סוג השירות */}
        <div className="form-group">
          <label className="form-label">סוג השירות:</label>
          <select 
            className="form-input"
            value={formData.serviceType}
            onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
          >
            <option value="חפיפה וסירוק">חפיפה וסירוק</option>
            <option value="חפיפה בלבד">חפיפה בלבד</option>
            <option value="סירוק בלבד">סירוק בלבד (דילוג אוטומטי לסורקת)</option>
          </select>
        </div>

        {/* סגנון עיצוב */}
        <div className="form-group">
          <label className="form-label">סגנון מבוקש:</label>
          <select 
            className="form-input"
            value={formData.styleCategory}
            onChange={(e) => setFormData({...formData, styleCategory: e.target.value})}
          >
            <option value="חלק">חלק</option>
            <option value="מוברש">מוברש</option>
            <option value="גלי">גלי</option>
            <option value="תלתלים">תלתלים</option>
            <option value="בייביליס">בייביליס</option>
          </select>
        </div>

        {/* הערות מיוחדות */}
        <div className="form-group">
          <label className="form-label">הערות (למשל: בייביליס פתוח):</label>
          <textarea 
            className="form-input"
            style={{ minHeight: '60px' }}
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
          />
        </div>

        {/* סימון דחיפות */}
        <div className="form-group urgent-checkbox-group">
          <input 
            type="checkbox" 
            id="isUrgent"
            checked={formData.isUrgent}
            onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
          />
          <label htmlFor="isUrgent" className="urgent-label">דחוף!</label>
        </div>

        <button type="submit" className="btn-submit">
          צור משימה במערכת
        </button>
      </form>
    </div>
  );
}