import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuickCustomerRegister.css';

export const QuickCustomerRegister: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialSearch = location.state?.idNumber || '';
  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', idNumber: '',
    phoneNumber: '', email: '', city: '', address: ''
  });

  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) { alert('נא להזין תעודת זהות או שם מלא לחיפוש'); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/customers/search/${encodeURIComponent(customerSearch)}`);
      const responseData = res.data !== undefined ? res.data : res;
      if (responseData.exists) {
        navigate('/repairs/new', { state: { idNumber: responseData.customer?.idNumber || customerSearch } });
      } else {
        const isNumeric = /^\d+$/.test(customerSearch);
        if (isNumeric) {
          setFormData(prev => ({ ...prev, idNumber: customerSearch }));
        } else {
          const parts = customerSearch.trim().split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            idNumber: Math.floor(100000000 + Math.random() * 900000000).toString()
          }));
        }
        setStep(2);
      }
    } catch { alert('שגיאה בתקשורת מול השרת'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idNumber) { alert('חובה להזין תעודת זהות'); return; }
    setLoading(true);
    try {
      const finalData = {
        ...formData,
        firstName: formData.firstName.trim() || 'לקוחה',
        lastName: formData.lastName.trim() || 'כללית',
        phoneNumber: formData.phoneNumber.trim() || '0500000000'
      };
      const response = await axios.post('/customers', finalData);
      if (response.status === 201 || response.status === 200) {
        alert('הלקוחה נרשמה בהצלחה');
        navigate('/repairs/new', { state: { idNumber: finalData.idNumber } });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'נתונים לא תקינים';
      alert(`שגיאה ברישום הלקוחה: ${errorMsg}`);
    } finally { setLoading(false); }
  };

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="quick-reg-container" dir="rtl">

      <div className="quick-reg-page-header">
        <h2>זיהוי ורישום לקוחה</h2>
        <p>חיפוש לפי שם מלא או תעודת זהות</p>
      </div>

      {/* שלב 1 — חיפוש */}
      {step === 1 && (
        <div className="search-section animate-in">
          <span className="search-section-label">זיהוי לקוחה</span>
          <div className="search-box">
            <input
              type="text"
              className="form-input"
              placeholder="שם מלא או תעודת זהות..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
            />
            <button className="btn-search" onClick={handleCustomerSearch} disabled={loading}>
              {loading ? 'מחפש...' : 'חפשי'}
            </button>
          </div>
          <button className="btn-link-cancel" type="button" onClick={() => navigate(-1)}>
            ביטול וחזרה
          </button>
        </div>
      )}

      {/* שלב 2 — רישום */}
      {step === 2 && (
        <div className="animate-in">
          <div className="not-found-notice">
            הלקוחה לא נמצאה במערכת — נא למלא פרטים לרישום
          </div>

          <div className="quick-reg-form-card">
            <div className="form-section-title">פרטי לקוחה חדשה</div>

            <form onSubmit={handleSubmit} className="quick-reg-form">
              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="שם פרטי" value={formData.firstName} onChange={e => update('firstName', e.target.value)} required />
                <input className="form-input-reg" type="text" placeholder="שם משפחה" value={formData.lastName} onChange={e => update('lastName', e.target.value)} required />
              </div>

              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="תעודת זהות" value={formData.idNumber} onChange={e => update('idNumber', e.target.value)} required />
                <input className="form-input-reg" type="text" placeholder="טלפון" value={formData.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} />
              </div>

              <input className="form-input-reg" type="email" placeholder="אימייל" value={formData.email} onChange={e => update('email', e.target.value)} />

              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="עיר" value={formData.city} onChange={e => update('city', e.target.value)} />
                <input className="form-input-reg" type="text" placeholder="כתובת" value={formData.address} onChange={e => update('address', e.target.value)} />
              </div>

              <div className="reg-actions-wrapper">
                <button className="btn-submit-reg" type="submit" disabled={loading}>
                  {loading ? 'רושם לקוחה...' : 'סיום רישום והמשך לתיקון'}
                </button>
                <button className="btn-back-reg" type="button" onClick={() => setStep(1)}>
                  חזרה לחיפוש
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
