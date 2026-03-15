import React, { useState } from 'react';
import './ServiceOrderForm.css'; // הייבוא של ה-CSS החדש

export const ServiceOrderForm: React.FC = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    serviceType: 'חפיפה וסירוק',
    styleCategory: 'חלק',
    isUrgent: false,
    note: ''
  });

  return (
    <div className="service-form-container">
      <h2 className="service-form-title">פתיחת הזמנת שירות - מזכירה</h2>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label className="form-label">שם הלקוחה:</label>
          <input 
            type="text" 
            className="form-input"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">סוג השירות:</label>
          <select 
            className="form-input"
            value={formData.serviceType}
            onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
          >
            <option value="חפיפה וסירוק">חפיפה וסירוק</option>
            <option value="חפיפה בלבד">חפיפה בלבד</option>
            <option value="סירוק בלבד">סירוק בלבד</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">הערות:</label>
          <textarea 
            className="form-input"
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
          />
        </div>

        <div className="form-group urgent-checkbox-group">
          <input 
            type="checkbox" 
            id="isUrgent" 
            checked={formData.isUrgent}
            onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
          />
          <label htmlFor="isUrgent" className="urgent-label">דחוף!</label>
        </div>

        <button type="submit" className="btn-submit">צור משימה במערכת</button>
      </form>
    </div>
  );
}