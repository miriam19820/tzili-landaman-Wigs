import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ServiceOrderForm.css'; 
import { InternalNoteBox } from '../../InternalNoteBox/InternalNoteBox';

export const ServiceOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalNote, setInternalNote] = useState('');

  const [formData, setFormData] = useState({
    serviceType: 'חפיפה וסירוק',
    styleCategory: 'חלק',
    isUrgent: false,
    note: ''
  });

  // אם המזכירה חזרה מדף הרישום המהיר עם ת"ז - נבצע חיפוש אוטומטי
  useEffect(() => {
    if (location.state?.idNumber) {
      const returnedId = location.state.idNumber;
      setCustomerSearch(returnedId);
      handleSearchCustomer(returnedId);
    }
  }, [location.state]);

  const handleSearchCustomer = async (searchParam: string = customerSearch) => {
    if (!searchParam.trim()) {
      alert("נא להזין תעודת זהות או שם לחיפוש"); 
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${encodeURIComponent(searchParam)}`);
      const responseData = response.data !== undefined ? response.data : response;

      if (responseData.exists) {
        setCustomerId(responseData.customer._id || responseData.customer.idNumber);
        setCustomerName(`${responseData.customer.firstName} ${responseData.customer.lastName}`);
      } else {
        if (window.confirm("לקוחה לא נמצאה. האם תרצי לעבור לדף רישום מהיר?")) {
          navigate('/repairs/quick-customer', { state: { idNumber: searchParam } });
        }
      }
    } catch (error) {
      alert("שגיאה בחיפוש הלקוחה מול השרת");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
        alert("חובה לזהות לקוחה לפני יצירת משימה!");
        return;
    }

    // איחוד כל הנתונים כולל ההערה הפנימית
    const finalSubmissionData = {
        customer: customerId, // שליחת ה-ID לשרת
        internalNote, // ההערה הפנימית שתישמר בתיק הלקוחה
        ...formData
    };

    setLoading(true);
    try {

      await axios.post('/services', finalSubmissionData);

      alert('הזמנת שירות נוצרה בהצלחה!');

      setCustomerSearch('');
      setCustomerId('');
      setCustomerName('');
      setInternalNote(''); 
      setFormData({
        serviceType: 'חפיפה וסירוק',
        styleCategory: 'חלק',
        isUrgent: false,
        note: ''
      });
    } catch (error: any) {
      alert(`שגיאה ביצירת המשימה: ${error.response?.data?.message || 'שגיאת שרת'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-form-container" dir="rtl">
      <h2 className="service-form-title">פתיחת הזמנת שירות - מזכירה</h2>
      
      <div className="form-group" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee', marginBottom: '25px' }}>
        <label className="form-label" style={{ fontWeight: 'bold' }}>זיהוי לקוחה לפי שם או תז:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text"
            className="form-input"
            placeholder="זיהוי לקוחה לפי שם או תז..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button 
            type="button" 
            onClick={() => handleSearchCustomer()} 
            disabled={loading}
            style={{ padding: '0 25px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }}
          >
            {loading ? 'מחפש...' : 'חפשי'}
          </button>
        </div>
        
        {customerName && (
          <div style={{ marginTop: '12px', color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>
            ✓ לקוחה מזוהה: {customerName}
          </div>
        )}
      </div>

      {customerId && (
        <form onSubmit={handleSubmit} className="animate-in">
          
          <div className="form-group">
            <label className="form-label">סוג השירות:</label>
            <select 
              className="form-input"
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
            >
              <option value="Wash & Style">חפיפה וסירוק</option>
              <option value="Wash Only">חפיפה בלבד</option>
              <option value="Style Only">סירוק בלבד (דילוג אוטומטי לסורקת)</option>
            </select>
          </div>

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
              <option value="טבעי">יבוש טבעי</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">הערות (למשל: בייביליס פתוח):</label>
            <textarea 
              className="form-input"
              style={{ minHeight: '60px' }}
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

          <InternalNoteBox 
            customerId={customerId} 
            context="במהלך פתיחת הזמנת שירות (חפיפה/סירוק)" 
            note={internalNote}
            setNote={setInternalNote}
          />

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'יוצר משימה...' : 'צור משימה במערכת'}
          </button>
        </form>
      )}
    </div>
  );
}