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
    firstName: '',
    lastName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    city: '',
    address: ''
  });

  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) {
      alert("נא להזין תעודת זהות או שם מלא לחיפוש"); 
      return;
    }
    
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
    } catch (err) { 
      alert("שגיאה בתקשורת מול השרת"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (!formData.idNumber) {
      alert("חובה להזין תעודת זהות");
      return;
    }

    setLoading(true);

    try {
      const finalData = {
        ...formData,
        firstName: formData.firstName.trim() || 'לקוחה',
        lastName: formData.lastName.trim() || 'כללית',
        // וודוא שמספר הטלפון תקין או נשלח בפורמט שהשרת מצפה לו
        phoneNumber: formData.phoneNumber.trim() || '0500000000' 
      };

      const response = await axios.post('/customers', finalData);
      
      if (response.status === 201 || response.status === 200) {
        alert("הלקוחה נרשמה בהצלחה!");
        navigate('/repairs/new', { state: { idNumber: finalData.idNumber } }); 
      }
    } catch (error: any) {
      // חילוץ הודעת השגיאה המדויקת מהשרת (כדי לדעת למה נזרק 400)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "נתונים לא תקינים";
      console.error("Full Error:", error.response?.data);
      alert(`שגיאה ברישום הלקוחה: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-reg-container" dir="rtl">
      <div className="quick-reg-card">
        <h2 className="quick-reg-title">זיהוי לקוחה לפי שם או תז ✂️</h2>
        
        {step === 1 && (
          <div className="search-section animate-in">
            <h3>שלב 1: זיהוי לקוחה לפי שם או תז</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="זיהוי לקוחה לפי שם או תז..."
                value={customerSearch} 
                onChange={(e) => setCustomerSearch(e.target.value)} 
                className="form-input"
              />
              <button className="btn-search" onClick={handleCustomerSearch} disabled={loading}>
                {loading ? 'מחפש...' : 'חפשי ←'}
              </button>
            </div>
            <button className="btn-link-cancel" type="button" onClick={() => navigate(-1)} style={{marginTop: '15px'}}>ביטול וחזרה</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in">
            <p className="error-msg-reg">הלקוחה לא נמצאה. רשמי פרטים כדי להמשיך:</p>
            <form onSubmit={handleSubmit} className="quick-reg-form">
              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="שם פרטי" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                <input className="form-input-reg" type="text" placeholder="שם משפחה" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              </div>

              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="תעודת זהות" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} required />
                <input className="form-input-reg" type="text" placeholder="טלפון" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>

              <input className="form-input-reg" type="email" placeholder="אימייל" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              
              <div className="form-row-reg">
                <input className="form-input-reg" type="text" placeholder="עיר" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <input className="form-input-reg" type="text" placeholder="כתובת" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="reg-actions-wrapper">
                <button className="btn-submit-reg" type="submit" disabled={loading}>
                  {loading ? "רושם לקוחה..." : "סיום רישום והמשך לתיקון"}
                </button>
                <button className="btn-back-reg" type="button" onClick={() => setStep(1)}>חזרה לחיפוש</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};