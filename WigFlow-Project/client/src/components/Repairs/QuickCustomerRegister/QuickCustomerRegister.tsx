import React, { useState } from 'react';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';

export const QuickCustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    idNumber: '', firstName: '', lastName: '', phoneNumber: '', email: '', city: '', address: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data._id) {
        setMessage('הלקוחה נרשמה בהצלחה ✅');
        setTimeout(() => navigate('/repairs/new'), 1500);
      } else {
        setMessage('שגיאה ברישום: ' + (data.message || ''));
      }
    } catch {
      setMessage('שגיאת תקשורת עם השרת');
=======
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
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    }
  };

  return (
<<<<<<< HEAD
    <div dir="rtl" style={{ maxWidth: '500px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>רישום לקוחה מהיר</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
        {[
          { name: 'idNumber', placeholder: 'תעודת זהות *', required: true },
          { name: 'firstName', placeholder: 'שם פרטי *', required: true },
          { name: 'lastName', placeholder: 'שם משפחה *', required: true },
          { name: 'phoneNumber', placeholder: 'טלפון *', required: true },
          { name: 'email', placeholder: 'מייל (חובה) *', required: true },
          { name: 'city', placeholder: 'עיר', required: false },
          { name: 'address', placeholder: 'כתובת', required: false },
        ].map(({ name, placeholder, required }) => (
          <input
            key={name}
            name={name}
            placeholder={placeholder}
            required={required}
            value={(form as any)[name]}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        ))}
        <button type="submit" style={{ padding: '12px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          רשמי לקוחה
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};
=======
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
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
