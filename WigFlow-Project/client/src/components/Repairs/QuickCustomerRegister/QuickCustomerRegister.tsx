import React, { useState } from 'react';
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
    }
  };

  return (
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
