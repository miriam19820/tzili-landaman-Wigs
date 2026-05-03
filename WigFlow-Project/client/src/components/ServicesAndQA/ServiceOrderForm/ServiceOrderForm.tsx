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
    wigCode: '', // התוספת שלנו!
    serviceType: 'חפיפה וסירוק',
    styleCategory: 'חלק',
    isUrgent: false,
    note: ''
  });

  useEffect(() => {
    if (location.state?.idNumber) {
      const returnedId = location.state.idNumber;
      setCustomerSearch(returnedId);
      handleSearchCustomer(returnedId);
    }
  }, [location.state]);

  const handleSearchCustomer = async (searchParam: string = customerSearch) => {
    if (!searchParam.trim()) { alert('נא להזין תעודת זהות או שם לחיפוש'); return; }
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${encodeURIComponent(searchParam)}`);
      const responseData = response.data !== undefined ? response.data : response;
      if (responseData.exists) {
        setCustomerId(responseData.customer._id || responseData.customer.idNumber);
        setCustomerName(`${responseData.customer.firstName} ${responseData.customer.lastName}`);
      } else {
        if (window.confirm('לקוחה לא נמצאה. האם תרצי לעבור לדף רישום מהיר?')) {
          navigate('/repairs/quick-customer', { state: { idNumber: searchParam } });
        }
      }
    } catch { alert('שגיאה בחיפוש הלקוחה מול השרת'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { alert('חובה לזהות לקוחה לפני יצירת משימה!'); return; }
    if (!formData.wigCode.trim()) { alert('חובה להזין קוד פאה!'); return; }
    
    setLoading(true);
    try {
      // 1. יצירת משימת השירות (שולחים גם את קוד הפאה)
      await axios.post('/services', { customer: customerId, internalNote, ...formData });
      
      // 2. שמירת ההערה בהיסטוריית הלקוחה
      if (internalNote.trim()) {
        try {
          await axios.post(`/customers/${customerId}/notes`, {
            content: internalNote,
            context: "במהלך פתיחת הזמנת שירות"
          });
        } catch (e) { 
          console.error("Failed to save note", e); 
        }
      }

      alert('הזמנת שירות נוצרה בהצלחה!');
      setCustomerSearch(''); setCustomerId(''); setCustomerName(''); setInternalNote('');
      setFormData({ wigCode: '', serviceType: 'חפיפה וסירוק', styleCategory: 'חלק', isUrgent: false, note: '' });
    } catch (error: any) {
      alert(`שגיאה ביצירת המשימה: ${error.response?.data?.message || 'שגיאת שרת'}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="service-form-container" dir="rtl">
      <h2 className="service-form-title">הזמנת שירות</h2>

      <div className="customer-search-block">
        <div className="form-group">
          <label className="form-label">זיהוי לקוחה</label>
          <div className="customer-search-row">
            <input
              type="text"
              className="form-input"
              placeholder="שם מלא או תעודת זהות..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <button type="button" className="search-btn" onClick={() => handleSearchCustomer()} disabled={loading}>
              {loading ? 'מחפש...' : 'חפשי'}
            </button>
          </div>
          {customerName && (
            <div className="customer-found-msg">✓ לקוחה מזוהית: <strong>{customerName}</strong></div>
          )}
        </div>
      </div>

      {customerId && (
        <form onSubmit={handleSubmit} className="service-form-body animate-in">

          <div className="form-group">
            <label className="form-label">קוד פאה *</label>
            <input
              type="text"
              className="form-input"
              placeholder="למשל: WIG-1234"
              value={formData.wigCode}
              onChange={(e) => setFormData({...formData, wigCode: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">סוג השירות</label>
            <select className="form-input" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})}>
              <option value="Wash & Style">חפיפה וסירוק</option>
              <option value="Wash Only">חפיפה בלבד</option>
              <option value="Style Only">סירוק בלבד</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">סגנון מבוקש</label>
            <select className="form-input" value={formData.styleCategory} onChange={(e) => setFormData({...formData, styleCategory: e.target.value})}>
              <option>חלק</option>
              <option>מוברש</option>
              <option>גלי</option>
              <option>תלתלים</option>
              <option>בייביליס</option>
              <option value="טבעי">יבוש טבעי</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">הערות</label>
            <textarea
              className="form-input"
              placeholder="למשל: בייביליס פתוח..."
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>

          <label className="urgent-checkbox-group">
            <input
              type="checkbox"
              checked={formData.isUrgent}
              onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
            />
            <span className="urgent-label">דחוף</span>
          </label>

          <InternalNoteBox
            customerId={customerId}
            context="במהלך פתיחת הזמנת שירות"
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
};