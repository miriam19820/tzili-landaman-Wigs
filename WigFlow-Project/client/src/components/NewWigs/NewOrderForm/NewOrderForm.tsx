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
  earToEar: number;
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
  const [savedWigData, setSavedWigData] = useState<any>(null); 
  const [autoOrderCode, setAutoOrderCode] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [plannedAssignments, setPlannedAssignments] = useState<Record<string, string>>({});

  const isRepairFlow = location.state?.fromFlow === 'repair';
  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewOrderFormInputs>();
  const idSearchValue = watch("idNumberSearch");

  const REQUIRED_STAGES = [
    { name: 'התאמת שיער', specialty: 'התאמת שיער' },
    { name: 'תפירת פאה', specialty: 'תפירה' },
    { name: 'צבע', specialty: 'צבע' },
    { name: 'עבודת יד', specialty: 'עבודת יד' },
    { name: 'חפיפה', specialty: 'חפיפה' }
  ];

  useEffect(() => {
    // 1. ייצור קוד הזמנה אוטומטי
    setAutoOrderCode(`WIG-${Math.floor(100000 + Math.random() * 900000)}`);
    
    // 2. טעינת עובדות לשיבוץ
    axios.get('/users')
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
      setCustomer(response.data);
      alert("הלקוחה נרשמה בהצלחה!");
      setStep(3);
    } catch (error) { alert("שגיאה ברישום הלקוחה"); } finally { setLoading(false); }
  };

  const onSubmit = async (data: NewOrderFormInputs) => {
    if (!signatureData) { alert('חובה להחתים את הלקוחה!'); return; }
    
    const firstWorker = plannedAssignments['התאמת שיער'];
    if (!firstWorker) { alert("חובה לשבץ עובדת לשלב 'התאמת שיער'!"); return; }

    setLoading(true);
    try {
      let finalCustomerId = customer?._id;
      
      // אם הגענו לכאן ואין ID (מקרה קצה), ניצור לקוחה
      if (!finalCustomerId) {
        const newRes = await axios.post('/customers', {
          firstName: data.firstName, 
          lastName: data.lastName, 
          idNumber: customer.idNumber,
          phoneNumber: data.phoneNumber,
          city: data.city
        });
        finalCustomerId = newRes.data._id;
      }

      const payload = {
        ...data,
        customer: finalCustomerId,
        orderCode: autoOrderCode,
        assignedWorker: firstWorker,
        stageAssignments: plannedAssignments,
        currentStage: 'התאמת שיער', 
        measurements: { 
          circumference: Number(data.circumference), 
          earToEar: Number(data.earToEar), 
          frontToBack: Number(data.frontToBack),
          napeLength: Number(data.napeLength)
        },
        customerSignature: signatureData 
      };

      const response = await axios.post('/wigs/new', payload);
      
      setSavedWigData({
        ...payload,
        _id: response.data._id || response.data.data?._id,
        customerName: `${customer?.firstName || data.firstName} ${customer?.lastName || data.lastName}`
      });

    } catch (error) { 
      alert("שגיאה בשמירת ההזמנה"); 
    } finally { 
      setLoading(false); 
    }
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
            <button type="submit" className="submit-btn" disabled={loading}>
              שמור לקוחה והמשך למפרט ←
            </button>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="form-section animate-in">
            <legend>שלב 3: מפרט הפאה (מידות ועיצוב)</legend>
            
            {customer && (
              <div className="customer-banner">
                <span>לקוחה מזוהה: <strong>{customer.firstName} {customer.lastName}</strong></span>
                <button type="button" className="btn-back" onClick={() => setStep(1)}>החלף לקוחה</button>
              </div>
            )}

            <div className="barcode-container">
              <h3>קוד הזמנה: {autoOrderCode}</h3>
              <img src={`https://barcode.tec-it.com/barcode.ashx?data=${autoOrderCode}&code=Code128&dpi=96`} alt="Barcode" />
            </div>

            <h4 className="section-subtitle">📏 מידות ראש</h4>
            <div className="form-grid">
              <input type="number" step="0.1" className="form-input" {...register('circumference', { required: true })} placeholder="היקף ראש (ס״מ) *" />
              <input type="number" step="0.1" className="form-input" {...register('napeLength', { required: true })} placeholder="אורך עורף (ס״מ) *" />
              <input type="number" step="0.1" className="form-input" {...register('earToEar', { required: true })} placeholder="אוזן לאוזן (ס״מ) *" />
              <input type="number" step="0.1" className="form-input" {...register('frontToBack', { required: true })} placeholder="פדחת לעורף (ס״מ) *" />
            </div>

            <h4 className="section-subtitle">⚙️ מפרט טכני ועיצוב</h4>
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
              <input className="form-input" {...register('baseColor')} placeholder="צבע בסיס" />
              <select className="form-input" {...register('netSize', { required: true })}>
                <option value="">מידת רשת *</option>
                <option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
              </select>
            </div>

            <h4 className="section-subtitle">🎨 עיצוב וגימור</h4>
            <div className="form-grid">
              <select className="form-input" {...register('frontStyle', { required: true })}>
                <option value="">עיצוב פרונט *</option>
                <option value='ע"י רגילה שטוחה'>ע"י רגילה שטוחה</option><option value="בייבי הייר קל">בייבי הייר קל</option><option value="בייבי הייר כבד">בייבי הייר כבד</option><option value="פוני צד">פוני צד</option><option value="פוני בובה">פוני בובה</option>
              </select>
              <textarea className="form-input full-width" {...register('specialNotes')} placeholder="הערות מיוחדות..."></textarea>
            </div>

            <h4 className="section-subtitle highlight">👤 שיבוץ צוות (תכנון ייצור)</h4>
            <div className="form-grid">
              {REQUIRED_STAGES.map(stage => (
                <div className="input-group" key={stage.name}>
                  <label className="input-label">{stage.name} {stage.name === 'התאמת שיער' && '*'}</label>
                  <select 
                    className="form-input"
                    value={plannedAssignments[stage.name] || ''}
                    onChange={(e) => setPlannedAssignments({...plannedAssignments, [stage.name]: e.target.value})}
                    required={stage.name === 'התאמת שיער'}
                  >
                    <option value="" disabled>-- בחרי עובדת --</option>
                    {workers.filter(w => w.specialty === stage.specialty).map(w => (
                      <option key={w._id} value={w._id}>{w.fullName || w.username}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h4 className="section-subtitle">💳 תשלום</h4>
            <div className="form-grid">
              <input type="number" className="form-input" {...register('price', { required: true })} placeholder="מחיר סופי *" />
              <input type="number" className="form-input" {...register('advancePayment')} placeholder="מקדמה" />
            </div>

            <div className="signature-container">
              <h4>חתימת לקוחה לאישור:</h4>
              <SignaturePad onSave={(sig) => setSignatureData(sig)} />
              {signatureData && <div className="sig-status">✓ החתימה נשמרה</div>}
            </div>
            
            <button type="submit" className="submit-btn full-width" disabled={loading}>
              {loading ? "פותח הזמנה..." : "פתח הזמנה חדשה ✂️"}
            </button>
          </fieldset>
        )}
      </form>

      {savedWigData && (
        <div className="sticker-overlay animate-in">
          <div className="print-sticker" id="wig-sticker">
            <div className="sticker-header">WigFlow - Tzili Landaman</div>
            <div className="sticker-content">
              <h3>{savedWigData.customerName}</h3>
              <p><strong>קוד הזמנה:</strong> {savedWigData.orderCode}</p>
              <p><strong>סוג שיער:</strong> {savedWigData.hairType}</p>
              <div className="qr-code">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${savedWigData.orderCode}`} alt="QR Code" />
              </div>
            </div>
            <div className="no-print sticker-actions">
              <button className="btn-print" onClick={() => window.print()}>הדפס מדבקה 🖨️</button>
              <button className="btn-close" onClick={() => window.location.reload()}>סיום</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};