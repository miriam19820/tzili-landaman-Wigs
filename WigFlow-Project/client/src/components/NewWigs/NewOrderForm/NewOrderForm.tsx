import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignaturePad } from '../../Shared/SignaturePad';
import './NewOrderForm.css';

interface NewOrderFormInputs {
  idNumberSearch: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string; 
  circumference: number;
  frontToBack: number;
  napeLength: number; 
  netSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
  hairType: 'חלק' | 'שיער תנועתי' | 'שיער גלי' | 'מתולתל';
  baseColor: string;
  topConstruction: 'סקין' | 'שבלול' | 'לייסטופ' | 'לייס פרונט' | 'דיפ לייס';
  frontStyle: 'ע"י רגילה שטוחה' | 'בייבי הייר קל' | 'בייבי הייר כבד' | 'פוני צד' | 'פוני בובה' | 'בייבי הייר לאסוף' | 'גל נמוך';
  price: number;
  advancePayment: number;
  specialNotes: string;
}

export const NewOrderForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // יצירת קוד הזמנה אוטומטי
  const [autoOrderCode, setAutoOrderCode] = useState('');

  const isRepairFlow = location.state?.fromFlow === 'repair';
  const { register, handleSubmit, watch } = useForm<NewOrderFormInputs>();
  const idSearchValue = watch("idNumberSearch");

  useEffect(() => {
    // מייצר קוד הזמנה אקראי וייחודי ברגע שהקומפוננטה עולה (למשל WIG-847392)
    setAutoOrderCode(`WIG-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  const handleIdSearch = async () => {
    if (!idSearchValue || idSearchValue.length < 8) {
      alert("נא להזין מספר תעודת זהות תקין"); 
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/customers/search/${idSearchValue}`);
      if (res.data.exists) {
        setCustomer(res.data.customer);
        if (isRepairFlow) {
            navigate('/repairs/new', { state: { idNumber: idSearchValue } });
        } else {
            setStep(3); 
        }
      } else {
        setCustomer({ idNumber: idSearchValue });
        setStep(2); 
      }
    } catch (err) { alert("שגיאה בחיפוש מול השרת"); } finally { setLoading(false); }
  };

  const handleQuickCustomerRegistration = async (data: NewOrderFormInputs) => {
    setLoading(true);
    try {
      const response = await axios.post('/customers', {
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: customer.idNumber,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city
      });

      if (response.status === 201 || response.status === 200) {
        setCustomer(response.data);
        if (isRepairFlow) {
            alert("הלקוחה נרשמה בהצלחה! חוזרים לאבחון התיקון...");
            navigate('/repairs/new', { state: { idNumber: customer.idNumber } });
        } else {
            alert("הלקוחה נרשמה בהצלחה! ממשיכים למפרט הפאה...");
            setStep(3);
        }
      }
    } catch (error) { alert("שגיאה ברישום הלקוחה"); } finally { setLoading(false); }
  };

  const onSubmit = async (data: NewOrderFormInputs) => {
    if (!signatureData) {
      alert("נא להחתים את הלקוחה לפני פתיחת ההזמנה");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: customer._id,
        orderCode: autoOrderCode, // שולחים את הקוד האוטומטי שנוצר
        measurements: {
          circumference: data.circumference,
          frontToBack: data.frontToBack,
          napeLength: data.napeLength
        },
        netSize: data.netSize,
        hairType: data.hairType,
        baseColor: data.baseColor,
        topConstruction: data.topConstruction,
        frontStyle: data.frontStyle,
        price: data.price,
        advancePayment: data.advancePayment,
        specialNotes: data.specialNotes,
        customerSignature: signatureData 
      };

      const response = await axios.post('/wigs/new', payload);
      
      if (response.data.success) {
        alert(`הזמנת פאה חדשה (${autoOrderCode}) נפתחה בהצלחה! 🎉`);
        window.location.reload(); 
      }
    } catch (error: any) {
      alert("שגיאה בפתיחת ההזמנה: " + (error.response?.data?.message || "שגיאת שרת"));
    } finally { setLoading(false); }
  };

  return (
    <div className="new-order-container" dir="rtl">
      <h1 className="form-title">WigFlow - {isRepairFlow ? 'רישום לקוחה לתיקון' : 'הזמנת פאה חדשה'}</h1>

      {step === 1 && (
        <div className="search-section animate-in">
          <h3>שלב 1: זיהוי לקוחה</h3>
          <div className="search-box">
            <input {...register('idNumberSearch')} placeholder="מספר תעודת זהות..." className="form-input" />
            <button type="button" onClick={handleIdSearch} className="btn-search" disabled={loading}>
              {loading ? 'מחפש...' : 'חפשי לקוחה'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(step === 2 ? handleQuickCustomerRegistration : onSubmit)}>
        
        {step === 2 && (
          <fieldset className="form-section animate-in">
            <legend>שלב 2: רישום לקוחה חדשה</legend>
            <div className="form-grid">
              <input className="form-input" {...register('firstName', { required: true })} placeholder="שם פרטי *" />
              <input className="form-input" {...register('lastName', { required: true })} placeholder="שם משפחה *" />
              <input className="form-input" {...register('phoneNumber', { required: true })} placeholder="טלפון *" />
              <input className="form-input" {...register('email')} placeholder="אימייל" type="email" />
              <input className="form-input" {...register('city')} placeholder="עיר" />
              <input className="form-input full-width" {...register('address')} placeholder="כתובת מגורים" />
            </div>
            <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '15px' }}>
              {loading ? "רושם..." : (isRepairFlow ? "סיום רישום וחזרה לתיקון ←" : "שמור לקוחה והמשך למפרט ←")}
            </button>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="form-section animate-in" style={{ padding: '30px' }}>
            <legend>שלב 3: מפרט הפאה (מידות ועיצוב)</legend>
            
            {customer && (
              <div className="customer-banner">
                <span>לקוחה מזוהה: <strong>{customer.firstName} {customer.lastName}</strong></span>
                <button type="button" className="btn-back" onClick={() => setStep(1)}>החלף לקוחה</button>
              </div>
            )}

            {/* קוד הזמנה וברקוד (אוטומטי) */}
            <div className="barcode-container">
              <h3>קוד הזמנה: {autoOrderCode}</h3>
              <img src={`https://barcode.tec-it.com/barcode.ashx?data=${autoOrderCode}&code=Code128&dpi=96`} alt="Barcode" />
              <p>הברקוד נוצר אוטומטית ויודפס על מדבקת הפאה</p>
            </div>

            {/* קטגוריה 1: מידות ראש */}
            <h4 className="section-subtitle">📏 מידות ראש</h4>
            <div className="form-grid">
              <input type="number" step="0.1" className="form-input" {...register('circumference', { required: true })} placeholder="היקף ראש (ס״מ) *" />
              <input type="number" step="0.1" className="form-input" {...register('napeLength', { required: true })} placeholder="אורך עורף (ס״מ) *" />
              <input type="number" step="0.1" className="form-input" {...register('frontToBack', { required: true })} placeholder="פדחת לעורף (ס״מ) *" />
            </div>

            {/* קטגוריה 2: מפרט טכני */}
            <h4 className="section-subtitle">⚙️ מפרט טכני</h4>
            <div className="form-grid">
              <select className="form-input" {...register('hairType', { required: true })}>
                <option value="">סוג שיער *</option>
                <option value="חלק">חלק</option>
                <option value="שיער תנועתי">שיער תנועתי</option>
                <option value="שיער גלי">שיער גלי</option>
                <option value="מתולתל">מתולתל</option>
              </select>
              <select className="form-input" {...register('topConstruction')}>
                <option value="">סוג סקין</option>
                <option value="סקין">סקין</option>
                <option value="שבלול">שבלול</option>
                <option value="לייסטופ">לייסטופ</option>
                <option value="לייס פרונט">לייס פרונט</option>
                <option value="דיפ לייס">דיפ לייס</option>
              </select>
              <input className="form-input" {...register('baseColor')} placeholder="צבע בסיס (לדוגמה: 4/6)" />
              <select className="form-input" {...register('netSize', { required: true })}>
                <option value="">מידת רשת *</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>

            {/* קטגוריה 3: עיצוב וגימור */}
            <h4 className="section-subtitle">עיצוב וגימור</h4>
            <div className="form-grid">
              <select className="form-input" {...register('frontStyle')}>
                <option value="">עיצוב פרונט</option>
                <option value='ע"י רגילה שטוחה'>ע"י רגילה שטוחה</option>
                <option value="בייבי הייר קל">בייבי הייר קל</option>
                <option value="בייבי הייר כבד">בייבי הייר כבד</option>
                <option value="פוני צד">פוני צד</option>
                <option value="פוני בובה">פוני בובה</option>
                <option value="בייבי הייר לאסוף">בייבי הייר לאסוף</option>
                <option value="גל נמוך">גל נמוך</option>
              </select>
              <textarea className="form-input" {...register('specialNotes')} placeholder="הערות מיוחדות לייצור (אופציונלי)..."></textarea>
            </div>

            {/* קטגוריה 4: תשלום ומקדמה */}
            <h4 className="section-subtitle">💳 תשלום ומקדמה</h4>
            <div className="form-grid">
              <input type="number" className="form-input" {...register('price')} placeholder="מחיר סופי סוכם (₪)" />
              <input type="number" className="form-input" {...register('advancePayment')} placeholder="מקדמה שולמה (₪)" />
            </div>

            {/* קטגוריה 5: חתימה */}
            <div className="signature-container">
              <h4>חתימת לקוחה לאישור המפרט והתקנון:</h4>
              <SignaturePad onSave={(sig) => setSignatureData(sig)} />
              {signatureData && <div className="sig-status">✓ החתימה נשמרה בהצלחה ותצורף להזמנה</div>}
            </div>
            
            <button type="submit" className="submit-btn full-width" style={{ marginTop: '30px', fontSize: '1.2rem', padding: '15px' }} disabled={loading}>
              {loading ? "פותח הזמנה..." : "פתח הזמנה חדשה ✂️"}
            </button>
          </fieldset>
        )}
      </form>
    </div>
  );
};