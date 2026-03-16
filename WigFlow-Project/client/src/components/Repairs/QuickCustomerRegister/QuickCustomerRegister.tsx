import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuickCustomerRegister.css';

export const QuickCustomerRegister: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // קבלת מספר הזהות שהוזן בדף האבחון (אם קיים) כדי לחסוך הקלדה חוזרת
  const initialId = location.state?.idNumber || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: initialId,
    phoneNumber: '',
    email: '',
    city: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // שליחת הנתונים למסד הנתונים דרך ה-API
      const response = await axios.post('http://localhost:3000/api/customers', formData);
      
      if (response.status === 201 || response.status === 200) {
        alert("הלקוחה נרשמה בהצלחה!");
        
        // הניתוב המדויק חזרה לדף האבחון/תיקונים כפי שמוגדר ב-App.tsx
        // העברת מספר הזהות ב-state מאפשרת לדף האבחון לזהות את הלקוחה אוטומטית בחזרה
        navigate('/repairs/new', { state: { idNumber: formData.idNumber } }); 
      }
    } catch (error: any) {
      alert("שגיאה ברישום הלקוחה: " + (error.response?.data?.message || "בדקי את החיבור לשרת"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-reg-container" dir="rtl">
      <div className="quick-reg-card">
        <h2>רישום לקוחה חדשה לתיקון ✂️</h2>
        <p>מלאי פרטים בסיסיים כדי להמשיך באבחון הפאה</p>
        
        <form onSubmit={handleSubmit} className="quick-reg-form">
          <div className="form-row">
            <input 
              type="text" 
              placeholder="שם פרטי *" 
              required 
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="שם משפחה *" 
              required 
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          <div className="form-row">
            <input 
              type="text" 
              placeholder="תעודת זהות *" 
              required 
              value={formData.idNumber}
              onChange={e => setFormData({...formData, idNumber: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="טלפון *" 
              required 
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <input 
            type="email" 
            placeholder="אימייל" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          
          <div className="form-row">
            <input 
              type="text" 
              placeholder="עיר" 
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="כתובת" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="reg-actions">
            <button type="submit" className="reg-btn-submit" disabled={loading}>
              {loading ? "רושם לקוחה..." : "סיום רישום והמשך לתיקון"}
            </button>
            <button type="button" className="reg-btn-cancel" onClick={() => navigate(-1)}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};