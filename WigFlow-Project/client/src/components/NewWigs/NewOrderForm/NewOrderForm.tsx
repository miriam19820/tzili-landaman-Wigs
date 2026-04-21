import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignaturePad } from '../../Shared/SignaturePad';
import { InternalNoteBox } from '../../InternalNoteBox/InternalNoteBox'; 
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './NewOrderForm.css';

// הגדרת בסיס הכתובת לשרת
axios.defaults.baseURL = 'http://localhost:5000/api';

interface NewOrderFormInputs {
  customerSearch: string; 
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string; 
  orderCode: string; 
  circumference: number;
  earToEar: number;
  frontToBack: number;
  napeLength: number; 
  netSize: string;
  hairType: string;
  baseColor: string;
  highlights: string;
  topConstruction: string;
  frontStyle: string[];
  finalStyle: string;
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
  const [pdfStatus, setPdfStatus] = useState<string>(''); 
  const [savedWigData, setSavedWigData] = useState<any>(null); 
  const [workers, setWorkers] = useState<any[]>([]);
  
  const [plannedAssignments, setPlannedAssignments] = useState<Record<string, string[]>>({});
  const [stageDeadlines, setStageDeadlines] = useState<Record<string, string>>({});

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [internalNote, setInternalNote] = useState('');

  const isRepairFlow = location.state?.fromFlow === 'repair';
  
  const { register, handleSubmit, watch, setValue } = useForm<NewOrderFormInputs>();
  
  const searchValue = watch("customerSearch");
  const selectedHairType = watch('hairType');
  const selectedTopConstruction = watch('topConstruction');
  const selectedNetSize = watch('netSize');
  const selectedFinalStyle = watch('finalStyle');

  const REQUIRED_STAGES = [
    { name: 'התאמת שיער', specialty: 'התאמת שיער' },
    { name: 'תפירת פאה', specialty: 'תפירה' },
    { name: 'צבע', specialty: 'צבע' },
    { name: 'עבודת יד', specialty: 'עבודת יד' },
    { name: 'חפיפה', specialty: 'חפיפה' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("לא נמצא טוקן אבטחה, נא להתחבר מחדש");
        navigate('/login');
        return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // תיקון: הסרת הלוכסן מ-'users' כדי להשתמש ב-baseURL בצורה תקינה
    axios.get('users')
      .then((res: any) => {
          const usersList = Array.isArray(res.data) ? res.data : res.data.data;
          setWorkers(usersList.filter((u: any) => u.role === 'Worker'));
      })
      .catch(err => {
          console.error('שגיאה בטעינת עובדות:', err);
          if (err.response?.status === 401) {
              alert("פג תוקף ההתחברות, נא להתחבר מחדש");
              navigate('/login');
          }
      });

    return () => { stopCamera(); };
  }, [navigate]);

  useEffect(() => {
    const generateAndSendPDF = async () => {
      if (savedWigData && pdfStatus === 'מייצר מסמך PDF ושולח למייל הסלון...') {
        try {
          setTimeout(async () => {
            const element = document.getElementById('pdf-receipt-content');
            if (element) {
              const canvas = await html2canvas(element, { useCORS: true });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              const pdfBase64 = pdf.output('datauristring');
              
              // תיקון: הסרת הלוכסן מתחילת הנתיב
              await axios.post('wigs/send-summary-email', { 
                wigData: savedWigData, 
                pdfBase64 
              });
              
              setPdfStatus('המייל נשלח בהצלחה! ✅');
              setLoading(false);
              alert('✅ העסקה נסגרה בהצלחה! מסמך ה-PDF נשלח ישירות למייל של הסלון.');
            }
          }, 1000);
        } catch(err) {
           console.error("שגיאה ביצירת/שליחת PDF:", err);
           setPdfStatus('שגיאה בשליחת המייל.');
           setLoading(false);
        }
      }
    };
    generateAndSendPDF();
  }, [savedWigData, pdfStatus]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("לא הצלחנו לגשת למצלמה. אנא ודאי שיש הרשאה בדפדפן.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8); 
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleCustomerSearch = async () => {
    if (!searchValue || searchValue.trim().length < 2) {
      alert("נא להזין תעודת זהות או שם לחיפוש"); 
      return;
    }
    setLoading(true);
    try {
      // תיקון: הסרת הלוכסן מתחילת הנתיב
      const res = await axios.get(`customers/search/${encodeURIComponent(searchValue)}`);
      const searchData = res.data;
      if (searchData.exists) {
        setCustomer(searchData.customer);
        if (isRepairFlow) {
            navigate('/repairs/new', { state: { idNumber: searchData.customer.idNumber || searchValue } });
        } else {
            setStep(3); 
        }
      } else {
        const isId = /^\d+$/.test(searchValue);
        if (isId) {
           setCustomer({ idNumber: searchValue });
        } else {
           const parts = searchValue.trim().split(' ');
           const fName = parts[0] || '';
           const lName = parts.slice(1).join(' ') || '';
           const foreignId = `F-${Math.floor(Math.random() * 10000000)}`;
           setCustomer({ firstName: fName, lastName: lName, idNumber: foreignId });
           setValue('firstName', fName);
           setValue('lastName', lName);
        }
        setStep(2); 
      }
    } catch (err: any) { 
      console.error("שגיאה בחיפוש לקוחה:", err);
      alert(err.response?.status === 401 ? "אין הרשאה לביצוע פעולה זו" : "שגיאה בחיפוש מול השרת"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleQuickCustomerRegistration = async (data: NewOrderFormInputs) => {
    setLoading(true);
    try {
      // תיקון: הסרת הלוכסן מתחילת הנתיב
      const response = await axios.post('customers', {
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: customer?.idNumber || `F-${Math.floor(Math.random() * 10000000)}`,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city
      });
      setCustomer(response.data);
      alert("הלקוחה נרשמה בהצלחה!");
      setStep(3);
    } catch (error: any) { 
      alert(error.response?.data?.message || "שגיאה ברישום הלקוחה"); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleWorkerForStage = (stageName: string, workerId: string) => {
    setPlannedAssignments(prev => {
      const currentWorkers = prev[stageName] || [];
      if (currentWorkers.includes(workerId)) {
        return { ...prev, [stageName]: currentWorkers.filter(id => id !== workerId) };
      } else {
        return { ...prev, [stageName]: [...currentWorkers, workerId] };
      }
    });
  };

  const onSubmit = async (data: NewOrderFormInputs) => {
    if (!signatureData) { alert('חובה להחתים את הלקוחה!'); return; }
    const firstStageWorkers = plannedAssignments['התאמת שיער'] || [];
    if (firstStageWorkers.length === 0) { alert("חובה לשבץ לפחות עובדת אחת לשלב 'התאמת שיער'!"); return; }

    setLoading(true);
    setPdfStatus('מייצר מסמך PDF ושולח למייל הסלון...');

    try {
      let finalCustomerId = customer?._id;
      if (!finalCustomerId) {
        // תיקון: הסרת הלוכסן מתחילת הנתיב
        const newRes = await axios.post('customers', {
          firstName: data.firstName, 
          lastName: data.lastName, 
          idNumber: customer?.idNumber || `F-${Math.floor(Math.random() * 10000000)}`,
          phoneNumber: data.phoneNumber,
          city: data.city
        });
        finalCustomerId = newRes.data._id;
      }

      const payload: any = {
        ...data,
        customer: finalCustomerId,
        assignedWorkers: firstStageWorkers, 
        stageAssignments: plannedAssignments, 
        stageDeadlines: stageDeadlines, 
        currentStage: 'התאמת שיער', 
        customerSignature: signatureData,
        imageUrl: capturedImage,
        internalNote: internalNote 
      };

      payload.measurements = { 
        circumference: data.circumference ? Number(data.circumference) : null, 
        earToEar: data.earToEar ? Number(data.earToEar) : null, 
        frontToBack: data.frontToBack ? Number(data.frontToBack) : null,
        napeLength: data.napeLength ? Number(data.napeLength) : null
      };

      if (!payload.hairType) delete payload.hairType;
      if (!payload.topConstruction) delete payload.topConstruction;
      if (!payload.netSize) delete payload.netSize;
      if (!payload.frontStyle || payload.frontStyle.length === 0) delete payload.frontStyle;
      if (!payload.finalStyle) delete payload.finalStyle;

      // תיקון: הסרת הלוכסן מתחילת הנתיב
      const response = await axios.post('wigs/new', payload);
      const newWig = response.data.data || response.data;
      
      setSavedWigData({
        ...payload,
        _id: newWig._id,
        customerName: `${customer?.firstName || data.firstName} ${customer?.lastName || data.lastName}`,
        phoneNumber: data.phoneNumber || customer?.phoneNumber
      });

    } catch (error: any) { 
      console.error("שגיאה בשמירת הזמנה:", error);
      if (error.response?.data?.message?.includes('E11000') || error.response?.data?.message?.includes('unique')) {
        alert("שגיאה: קוד הפאה הזה כבר קיים במערכת! נא להקליד קוד אחר.");
      } else {
        alert(error.response?.data?.message || "שגיאה בשמירת ההזמנה. אנא נסי שוב."); 
      }
      setLoading(false);
      setPdfStatus('');
    }
  };

  return (
    <div className="new-order-container" dir="rtl">
      
      {/* תבנית נסתרת מושלמת ליצירת ה-PDF - מותאמת לגודל A4 */}
      {savedWigData && (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
          <div id="pdf-receipt-content" style={{ width: '210mm', minHeight: '297mm', padding: '40px', background: 'white', color: 'black', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '3px solid #2c3e50', paddingBottom: '20px', marginBottom: '20px' }}>
              <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2.5rem' }}>WigFlow - Tzili Landaman</h1>
              <h2 style={{ margin: '10px 0', color: '#7f8c8d' }}>תיעוד עסקת הזמנת פאה</h2>
              <p style={{ margin: 0, fontSize: '1.2rem' }}>תאריך העסקה: {new Date().toLocaleDateString('he-IL')}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '1.2rem', fontWeight: 'bold' }}>קוד הזמנה: {savedWigData.orderCode}</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1, border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>👤 פרטי לקוחה</h3>
                <p><strong>שם:</strong> {savedWigData.customerName}</p>
                <p><strong>טלפון:</strong> {savedWigData.phoneNumber}</p>
              </div>
              <div style={{ flex: 1, border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>✂️ מפרט פאה עיקרי</h3>
                <p><strong>סוג שיער:</strong> {savedWigData.hairType || 'לא נבחר'}</p>
                <p><strong>סוג סקין:</strong> {savedWigData.topConstruction || 'לא נבחר'}</p>
                <p><strong>עיצוב פרונט:</strong> {Array.isArray(savedWigData.frontStyle) ? savedWigData.frontStyle.join(', ') : savedWigData.frontStyle || 'לא נבחר'}</p>
              </div>
            </div>

            <div style={{ marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>👥 צוות ייצור ותאריכי יעד</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>שלב</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>עובדת משובצת</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>תאריך יעד לסיום</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_STAGES.map(stage => {
                    const assignedWorkersIds = savedWigData.stageAssignments?.[stage.name] || [];
                    const assignedNames = assignedWorkersIds.map((id: string) => workers.find(w => w._id === id)?.username).join(', ');
                    const deadline = savedWigData.stageDeadlines?.[stage.name];
                    const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('he-IL') : 'לא נקבע';

                    if(assignedWorkersIds.length === 0) return null;

                    return (
                      <tr key={stage.name}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}><strong>{stage.name}</strong></td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{assignedNames || 'לא שובץ'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', color: '#d32f2f', fontWeight: 'bold' }}>{formattedDeadline}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', background: '#f8f9fa', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>💳 סיכום תשלום</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60', margin: 0 }}>סה"כ לתשלום: ₪{savedWigData.price || 'לא הוזן'}</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {savedWigData.imageUrl && (
                <div style={{ flex: 1, textAlign: 'center', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0 }}>תמונת הלקוחה</h4>
                  <img src={savedWigData.imageUrl} alt="Customer" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              {savedWigData.customerSignature && (
                <div style={{ flex: 1, textAlign: 'center', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0 }}>חתימת הלקוחה לאישור</h4>
                  <img src={savedWigData.customerSignature} alt="Signature" style={{ maxHeight: '100px', maxWidth: '100%' }} />
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <h1 className="form-title">WigFlow - {isRepairFlow ? 'רישום לקוחה לתיקון' : 'הזמנת פאה חדשה'}</h1>

      {step === 1 && (
        <div className="search-section animate-in">
          <h3>שלב 1: זיהוי לקוחה</h3>
          <div className="search-box">
            <input {...register('customerSearch')} placeholder="תעודת זהות או שם מלא (למשל: רחל כהן)..." className="form-input" />
            <button type="button" onClick={handleCustomerSearch} className="btn-search" disabled={loading}>
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

            <div className="barcode-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>קוד זיהוי פאה *</h3>
              <input 
                className="form-input" 
                style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', maxWidth: '300px', letterSpacing: '2px' }}
                placeholder="הקלידי קוד פאה (למשל: WIG-555)" 
                {...register('orderCode', { required: true })} 
              />
            </div>

            <h4 className="section-subtitle">📏 מידות ראש </h4>
            <div className="form-grid">
              <input type="number" step="0.1" className="form-input" {...register('circumference')} placeholder="היקף ראש (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('napeLength')} placeholder="אורך עורף (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('earToEar')} placeholder="אוזן לאוזן (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('frontToBack')} placeholder="פדחת לעורף (ס״מ)" />
            </div>

            <h4 className="section-subtitle">⚙️ מפרט טכני ועיצוב</h4>
            <div className="form-grid">
              <select className="form-input" style={{ color: !selectedHairType ? '#757575' : '#000' }} defaultValue="" {...register('hairType', { required: true })}>
                <option value="" disabled hidden>סוג שיער </option>
                <option value="חלק" style={{ color: '#000' }}>חלק</option>
                <option value="שיער תנועתי" style={{ color: '#000' }}>שיער תנועתי</option>
                <option value="שיער גלי" style={{ color: '#000' }}>שיער גלי</option>
                <option value="מתולתל" style={{ color: '#000' }}>מתולתל</option>
              </select>
              
              <select className="form-input" style={{ color: !selectedTopConstruction ? '#757575' : '#000' }} defaultValue="" {...register('topConstruction', { required: true })}>
                <option value="" disabled hidden>סוג סקין </option>
                <option value="סקין" style={{ color: '#000' }}>סקין</option>
                <option value="שבלול" style={{ color: '#000' }}>שבלול</option>
                <option value="לייסטופ" style={{ color: '#000' }}>לייסטופ</option>
                <option value="לייס פרונט" style={{ color: '#000' }}>לייס פרונט</option>
                <option value="דיפ לייס" style={{ color: '#000' }}>דיפ לייס</option>
              </select>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="form-input" style={{ color: !watch('baseColor') ? '#a9a9a9' : '#000', flex: 1 }} defaultValue="" {...register('baseColor')}>
                  <option value="" disabled hidden style={{ color: '#a9a9a9' }}>צבע בסיס</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
                
                <input className="form-input" style={{ flex: 1 }} {...register('highlights')} placeholder="גוונים (למשל: 10-12)" />
              </div>
              
              <select className="form-input" style={{ color: !selectedNetSize ? '#757575' : '#000' }} defaultValue="" {...register('netSize', { required: true })}>
                <option value="" disabled hidden>מידת רשת </option>
                <option value="XS" style={{ color: '#000' }}>XS</option>
                <option value="S" style={{ color: '#000' }}>S</option>
                <option value="M" style={{ color: '#000' }}>M</option>
                <option value="L" style={{ color: '#000' }}>L</option>
                <option value="XL" style={{ color: '#000' }}>XL</option>
              </select>
            </div>

          <h4 className="section-subtitle">🎨 עיצוב וגימור</h4>
            <div className="form-grid">
              
              <div className="form-input" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'auto', padding: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>עיצוב פרונט </span>
                {[
                  'ע"י רגילה שטוחה',
                  'בייבי הייר קל',
                  'בייבי הייר כבד',
                  'פוני צד',
                  'פוני בובה'
                ].map(option => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      value={option}
                      {...register('frontStyle', { required: true })} 
                      style={{ transform: 'scale(1.2)' }}
                    />
                    {option}
                  </label>
                ))}
              </div>
              
             <select className="form-input" style={{ color: !selectedFinalStyle ? '#757575' : '#000', alignSelf: 'start' }} defaultValue="" {...register('finalStyle', { required: true })}>
                <option value="" disabled hidden>סוג סירוק</option>
                <option value="חלק" style={{ color: '#000' }}>חלק</option>
                <option value="מוברש" style={{ color: '#000' }}>מוברש</option>
                <option value="גלי" style={{ color: '#000' }}>גלי</option>
                <option value="תלתלים" style={{ color: '#000' }}>תלתלים</option>
                <option value="בייביליס" style={{ color: '#000' }}>בייביליס</option>
                <option value="יבוש טבעי" style={{ color: '#000' }}>יבוש טבעי</option>
              </select>
              
              <textarea className="form-input full-width" {...register('specialNotes')} placeholder="הערות מיוחדות..."></textarea>
            </div>

            <h4 className="section-subtitle highlight">👤 שיבוץ צוות (ניתן לבחור כמה עובדות לכל שלב)</h4>
            <div className="form-grid">
              {REQUIRED_STAGES.map(stage => {
                const stageWorkers = workers.filter(w => w.specialty === stage.specialty);
                return (
                  <div className="input-group" key={stage.name} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <label className="input-label" style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                        {stage.name} {stage.name === 'התאמת שיער' && '*'}
                      </label>
                      
                      {stageWorkers.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: '#e74c3c' }}>אין עובדות זמינות להתמחות זו</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {stageWorkers.map(w => (
                            <label key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                              <input
                                type="checkbox"
                                checked={(plannedAssignments[stage.name] || []).includes(w._id)}
                                onChange={() => toggleWorkerForStage(stage.name, w._id)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              {w.fullName || w.username}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {stageWorkers.length > 0 && (
                      <div style={{ marginTop: '15px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px' }}>
                          📅 תאריך יעד לשלב:
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '6px', fontSize: '0.9rem', width: '100%', borderColor: '#ddd' }}
                          value={stageDeadlines[stage.name] || ''}
                          onChange={(e) => setStageDeadlines({ ...stageDeadlines, [stage.name]: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <h4 className="section-subtitle">💳 תשלום</h4>
            <div className="form-grid">
              <input type="number" className="form-input" {...register('price', { required: true })} placeholder="מחיר סופי *" />
              <input type="number" className="form-input" {...register('advancePayment')} placeholder="מקדמה" />
            </div>

            <h4 className="section-subtitle">📸 תמונת לקוחה (תשולב במסמך העסקה)</h4>
            <div className="camera-container" style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
              {!isCameraOpen && !capturedImage && (
                <button type="button" onClick={startCamera} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '5px' }}>
                  פתח מצלמה וצלם לקוחה 📷
                </button>
              )}

              {isCameraOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', border: '2px solid #333' }}></video>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={capturePhoto} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px' }}>
                      צלם תמונה 📸
                    </button>
                    <button type="button" onClick={stopCamera} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>
                      בטל מצלמה
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <p style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ התמונה צולמה בהצלחה</p>
                  <img src={capturedImage} alt="Customer" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', border: '2px solid #4caf50' }} />
                  <button type="button" onClick={retakePhoto} style={{ padding: '8px 15px', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '5px' }}>
                    צלם מחדש 🔄
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>

            <div className="signature-container">
              <h4>חתימת לקוחה לאישור:</h4>
              <SignaturePad onSave={(sig) => setSignatureData(sig)} />
              {signatureData && <div className="sig-status">✓ החתימה נשמרה</div>}
            </div>
            
            {/* הצגת תיבת ההערות הפנימיות ללקוחה מזוהה */}
            {customer?._id && (
              <InternalNoteBox 
                customerId={customer._id} 
                context="במהלך הזמנת פיאה חדשה" 
                note={internalNote}
                setNote={setInternalNote}
              />
            )}

            <button type="submit" className="submit-btn full-width" disabled={loading}>
              {loading ? pdfStatus || "שומר עסקה..." : "סגור עסקה ושלח קבלה למייל 🖨️"}
            </button>
          </fieldset>
        )}
      </form>

      {/* מסך סיכום הצלחה */}
      {savedWigData && !loading && (
        <div className="sticker-overlay animate-in">
          <div className="print-sticker">
            <div className="sticker-header">WigFlow - העסקה נקלטה!</div>
            
            <div className="sticker-content" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#27ae60' }}>{pdfStatus}</h3>
              <p>לקוחה: {savedWigData.customerName}</p>
              <p>קוד הזמנה: <strong>{savedWigData.orderCode}</strong></p>
            </div>
            
            <div className="sticker-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-close" style={{ flex: 1, backgroundColor: '#34495e' }} onClick={() => navigate('/dashboard')}>
                מעבר לדאשבורד
              </button>
              
              <button className="btn-close" style={{ flex: 1, backgroundColor: '#2ecc71' }} onClick={() => window.location.reload()}>
                התחלת קבלה חדשה
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};