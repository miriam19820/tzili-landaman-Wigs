import React, { useState } from 'react';

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
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', direction: 'rtl', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>פתיחת הזמנת שירות - מזכירה</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* שם הלקוחה */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>שם הלקוחה:</label>
          <input 
            type="text"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            required
          />
        </div>

        {/* סוג השירות - כולל לוגיקת הדילוג שלך משבוע 2 */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>סוג השירות:</label>
          <select 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={formData.serviceType}
            onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
          >
            <option value="חפיפה וסירוק">חפיפה וסירוק</option>
            <option value="חפיפה בלבד">חפיפה בלבד</option>
            <option value="סירוק בלבד">סירוק בלבד (דילוג אוטומטי לסורקת)</option>
          </select>
        </div>

        {/* סגנון עיצוב */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>סגנון מבוקש:</label>
          <select 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
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
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>הערות (למשל: בייביליס פתוח):</label>
          <textarea 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }}
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
          />
        </div>

        {/* סימון דחיפות */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="isUrgent"
            checked={formData.isUrgent}
            onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
          />
          <label htmlFor="isUrgent" style={{ fontWeight: 'bold', color: 'red' }}>דחוף!</label>
        </div>

        <button 
          type="submit" 
          style={{ backgroundColor: '#007bff', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          צור משימה במערכת
        </button>
      </form>
    </div>
  );
};