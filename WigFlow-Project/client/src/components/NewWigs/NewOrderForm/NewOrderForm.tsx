import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
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
  orderCode: string;
  receivedBy: string;
  circumference: number;
  earToEar: number;
  frontToBack: number;
  napeLength: string; 

  netSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
  hairType: 'חלק' | 'שיער תנועתי' | 'שיער גלי' | 'מתולתל';
  baseColor: string;
  highlightsWefts: string;
  highlightsSkin: string;
  topConstruction: 'סקין' | 'שבלול' | 'לייסטופ' | 'לייס פרונט' | 'דיפ לייס';
  topNotes: string;
  frontStyle: 'ע"י רגילה שטוחה' | 'בייבי הייר קל' | 'בייבי הייר כבד' | 'פוני צד' | 'פוני בובה' | 'בייבי הייר לאסוף' | 'גל נמוך';
  frontNotes: string;
  price: number;
  advancePayment: number;
  balancePayment: number;
  specialNotes: string;
}

export const NewOrderForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [signatureData, setSignatureData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savedWigData, setSavedWigData] = useState<any>(null); // לטובת המדבקה

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewOrderFormInputs>();
  
  const idSearchValue = watch("idNumberSearch");
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");

  useEffect(() => {
    axios.get('http://localhost:3000/api/users')
      .then((res: any) => setWorkers(res.data.filter((u: any) => u.role === 'Worker')))
      .catch(err => console.error('שגיאה בטעינת עובדות'));
  }, []);

  const handleIdSearch = async () => {
    if (!idSearchValue || idSearchValue.length < 8) {
      alert("נא להזין מספר תעודת זהות תקין"); 
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/customers/search/${idSearchValue}`);
      if (res.data.exists) {
        setCustomer(res.data.customer);
        setStep(3);
      } else {
        setCustomer({ idNumber: idSearchValue });
        setStep(2);
      }
    } catch (err) { alert("שגיאה בחיפוש"); } finally { setLoading(false); }
  };

  const onSubmit = async (data: NewOrderFormInputs) => {
    if (!signatureData) { alert('חובה להחתים את הלקוחה!'); return; }

    setLoading(true);
    try {
      let finalCustomerId = customer?._id;
      
      // אם זו לקוחה חדשה - יוצרים אותה קודם בשרת
      if (step === 3 && !customer?._id) {
        const newRes = await axios.post('http://localhost:3000/api/customers', {
          firstName: data.firstName, 
          lastName: data.lastName, 
          idNumber: customer.idNumber,
          phoneNumber: data.phoneNumber, 
          email: data.email, 
          address: data.address, 
          city: data.city
        });
        finalCustomerId = newRes.data._id;
      }

      // מציאת עובדת לשלב הראשון
      const firstStageWorker = workers.find(w => w.specialty === 'התאמת שיער') || workers[0];
      if (!firstStageWorker) {
        alert("שגיאה: לא נמצאו עובדות במערכת! אנא ודאי שהרצת npm run seed.");
        setLoading(false);
        return;
      }

      const payload = {
        ...data,
        customer: finalCustomerId,
        assignedWorker: firstStageWorker._id, 
        currentStage: 'התאמת שיער', 
        measurements: { 
          circumference: Number(data.circumference), 
          earToEar: Number(data.earToEar), 
          frontToBack: Number(data.frontToBack) 
        },
        balancePayment: Number(data.price) - (Number(data.advancePayment) || 0),
        customerSignature: signatureData 
      };

      const response = await axios.post('http://localhost:3000/api/wigs/new', payload);
      
      // במקום רענון, נציג את נתוני המדבקה
      setSavedWigData({
        ...payload,
        _id: response.data._id,
        customerName: `${customer?.firstName || data.firstName} ${customer?.lastName || data.lastName}`
      });

    } catch (error) { 
      alert("שגיאה בשמירה"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="new-order-container" dir="rtl">
      <h1 className="form-title">WigFlow - הזמנה חדשה</h1>

      {step === 1 && (
        <div className="search-section animate-in">
          <h3>שלב 1: זיהוי לקוחה</h3>
          <div className="search-box">
            <input {...register('idNumberSearch')} placeholder="מספר תעודת זהות..." className="form-input" />
            <button type="button" onClick={handleIdSearch} className="btn-search">חפשי לקוחה</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 2 && (
          <fieldset className="form-section animate-in">
            <legend>רישום לקוחה חדשה</legend>
            <div className="form-grid">
              <input className="form-input" {...register('firstName', { required: true })} placeholder="שם פרטי *" />
              <input className="form-input" {...register('lastName', { required: true })} placeholder="שם משפחה *" />
              <input className="form-input" {...register('phoneNumber', { required: true })} placeholder="טלפון *" />
              <input className="form-input" {...register('email')} placeholder="אימייל" />
              <input className="form-input" {...register('city')} placeholder="עיר" />
              <input className="form-input full-width" {...register('address')} placeholder="כתובת מגורים" />
            </div>
            <button type="button" className="btn-next" onClick={() => setStep(3)}>המשך למפרט ←</button>
          </fieldset>
        )}

        {step === 3 && !savedWigData && (
          <div className="animate-in">
            <div className="customer-banner">
              מזמינה: <strong>{customer.firstName || watchedFirstName} {customer.lastName || watchedLastName}</strong> | ת"ז: {customer.idNumber}
            </div>

            <fieldset className="form-section">
              <legend>מידות ופרטי הזמנה</legend>
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">קוד הזמנה</label>
                  <input className="form-input" {...register('orderCode', { required: true })} placeholder="קוד הזמנה *" />
                </div>
                <div className="input-group">
                  <label className="input-label">היקף ראש</label>
                  <input className="form-input" type="number" step="0.1" {...register('circumference')} placeholder="היקף" />
                </div>
                <div className="input-group">
                  <label className="input-label">מאוזן לאוזן</label>
                  <input className="form-input" type="number" step="0.1" {...register('earToEar')} placeholder="אוזן לאוזן" />
                </div>
                <div className="input-group">
                  <label className="input-label">פדחת לעורף</label>
                  <input className="form-input" type="number" step="0.1" {...register('frontToBack')} placeholder="פדחת לעורף" />
                </div>
              
                <div className="input-group">
                  <label className="input-label">אורך עורף</label>
                  <input className="form-input" {...register('napeLength')} placeholder="אורך עורף" />
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>מפרט טכני</legend>
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">מידת רשת</label>
                  <select className="form-input" {...register('netSize', { required: true })} defaultValue="">
                    <option value="" disabled>בחר מידה</option>
                    <option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">סוג שיער</label>
                  <select className="form-input" {...register('hairType', { required: true })} defaultValue="">
                    <option value="" disabled>בחר סוג</option>
                    <option value="חלק">חלק</option><option value="שיער תנועתי">שיער תנועתי</option><option value="שיער גלי">שיער גלי</option><option value="מתולתל">מתולתל</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">צבע בסיס</label>
                  <input className="form-input" {...register('baseColor')} placeholder="צבע בסיס" />
                </div>
                
                <div className="input-group">
                   <label className="input-label">סוג סקין (Top)</label>
                   <select className="form-input" {...register('topConstruction', { required: true })} defaultValue="">
                    <option value="" disabled>בחר סוג</option>
                    <option value="סקין">סקין</option><option value="שבלול">שבלול</option><option value="לייסטופ">לייסטופ</option><option value="לייס פרונט">לייס פרונט</option><option value="דיפ לייס">דיפ לייס</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend>עיצוב וגימור</legend>
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">עיצוב פרונט</label>
                  <select className="form-input" {...register('frontStyle', { required: true })} defaultValue="">
                    <option value="" disabled>בחר עיצוב</option>
                    <option value='ע"י רגילה שטוחה'>ע"י רגילה שטוחה</option><option value="בייבי הייר קל">בייבי הייר קל</option><option value="בייבי הייר כבד">בייבי הייר כבד</option><option value="פוני צד">פוני צד</option><option value="פוני בובה">פוני בובה</option><option value="בייבי הייר לאסוף">בייבי הייר לאסוף</option><option value="גל נמוך">גל נמוך</option>
                  </select>
                </div>
              </div>
              <textarea className="form-input full-width" style={{marginTop:'10px'}} {...register('specialNotes')} placeholder="הערות מיוחדות"></textarea>
            </fieldset>

            <fieldset className="form-section highlight-section">
              <legend>תשלום</legend>
              <div className="form-grid">
                <input className="form-input" type="number" {...register('price', { required: true })} placeholder="מחיר סופי *" />
                <input className="form-input" type="number" {...register('advancePayment')} placeholder="מקדמה" />
              </div>
              <SignaturePad onSave={(sig) => setSignatureData(sig)} />
            </fieldset>

            <div className="button-group">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "שומר..." : "סגור עסקה ושגר לייצור"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* חלונית מדבקת QR לאחר שמירה מוצלחת */}
      {savedWigData && (
        <div className="sticker-overlay animate-in">
          <div className="print-sticker" id="wig-sticker">
            <div className="sticker-header">WigFlow - Tzili Landaman</div>
            <div className="sticker-content">
              <h3>{savedWigData.customerName}</h3>
              <p><strong>קוד הזמנה:</strong> {savedWigData.orderCode}</p>
              <p><strong>סוג שיער:</strong> {savedWigData.hairType}</p>
              
              <div className="qr-code">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=wigflow://scan/${savedWigData._id}`} 
                  alt="QR Code" 
                />
              </div>
            </div>
            <div className="sticker-footer">סרוק למפרט טכני מלא</div>
            
            <div className="no-print sticker-actions">
              <button className="btn-print" onClick={() => window.print()}>הדפס מדבקה 🖨️</button>
              <button className="btn-close" onClick={() => window.location.reload()}>סיום וסגירה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};