import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignaturePad } from '../../Shared/SignaturePad';
import { InternalNoteBox } from '../../InternalNoteBox/InternalNoteBox'; 
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ziliLogo from '../../../assets/images/zili-logo.png';
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
  
  const searchValue = watch('customerSearch');

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
        orderCode: data.orderCode.trim(), // הוספת Trim לניקוי רווחים מיותרים
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
      
      {/* תבנית נסתרת מושלמת ליצירת ה-PDF - עיצוב יוקרתי */}
      {savedWigData && (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
          <div id="pdf-receipt-content" style={{ 
            width: '794px', 
            minHeight: '1123px', 
            padding: '40px', 
            background: 'white', 
            color: '#4a4a4a', 
            direction: 'rtl', 
            fontFamily: "'Heebo', 'Assistant', 'Arial', sans-serif",
            boxSizing: 'border-box'
          }}>
            
            {/* Header with Logo */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '40px', 
              paddingBottom: '30px',
              borderBottom: '1px solid #e8d7d8'
            }}>
              <img 
                src={ziliLogo} 
                alt="Zili Logo" 
                style={{ 
                  maxWidth: '180px', 
                  height: 'auto', 
                  marginBottom: '20px'
                }} 
              />
              <h1 style={{ 
                margin: '0 0 15px 0', 
                color: '#5c3d3d', 
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>תיעוד עסקת הזמנת פאה</h1>
              <p style={{ 
                margin: 0, 
                color: '#999', 
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.3px'
              }}>תאריך העסקה: {new Date().toLocaleDateString('he-IL')}</p>
            </div>

            {/* Customer Info Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '25px', 
              marginBottom: '35px'
            }}>
              <div style={{ 
                padding: '20px', 
                background: '#fafafa',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#5c3d3d', 
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>פרטי הלקוחה</h3>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>שם:</span> <strong>{savedWigData.customerName}</strong></p>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>קוד הזמנה:</span> <strong>{savedWigData.orderCode}</strong></p>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>טלפון:</span> <strong>{savedWigData.phoneNumber}</strong></p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                background: '#fafafa',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#5c3d3d', 
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>מפרט פאה</h3>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>סוג שיער:</span> <strong>{savedWigData.hairType || '—'}</strong></p>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>סוג בניה:</span> <strong>{savedWigData.topConstruction || '—'}</strong></p>
                <p style={{ margin: '8px 0', fontSize: '13px' }}><span style={{ color: '#999' }}>עיצוב:</span> <strong>{savedWigData.finalStyle || '—'}</strong></p>
              </div>
            </div>

            {/* Measurements Section */}
            {savedWigData.measurements && (Object.values(savedWigData.measurements as any).some(v => v !== null)) && (
              <div style={{ 
                marginBottom: '35px',
                padding: '20px',
                background: '#f5e6e8',
                borderRadius: '6px'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#5c3d3d', 
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>מידות ראש</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px' }}>
                  {savedWigData.measurements.circumference && <p style={{ margin: 0 }}><span style={{ color: '#999' }}>היקף ראש:</span> <strong>{savedWigData.measurements.circumference} ס״מ</strong></p>}
                  {savedWigData.measurements.napeLength && <p style={{ margin: 0 }}><span style={{ color: '#999' }}>אורך עורף:</span> <strong>{savedWigData.measurements.napeLength} ס״מ</strong></p>}
                  {savedWigData.measurements.earToEar && <p style={{ margin: 0 }}><span style={{ color: '#999' }}>אוזן לאוזן:</span> <strong>{savedWigData.measurements.earToEar} ס״מ</strong></p>}
                  {savedWigData.measurements.frontToBack && <p style={{ margin: 0 }}><span style={{ color: '#999' }}>פדחת לעורף:</span> <strong>{savedWigData.measurements.frontToBack} ס״מ</strong></p>}
                </div>
              </div>
            )}

            {/* Production Team Table */}
            <div style={{ marginBottom: '35px' }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#5c3d3d', 
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>צוות ייצור</h3>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                textAlign: 'right',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ background: '#f5e6e8' }}>
                    <th style={{ padding: '12px', color: '#5c3d3d', fontWeight: 600, borderBottom: '1px solid #d8c6c7' }}>שלב ייצור</th>
                    <th style={{ padding: '12px', color: '#5c3d3d', fontWeight: 600, borderBottom: '1px solid #d8c6c7' }}>עובדת משובצת</th>
                    <th style={{ padding: '12px', color: '#5c3d3d', fontWeight: 600, borderBottom: '1px solid #d8c6c7' }}>תאריך יעד</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_STAGES.map(stage => {
                    const assignedWorkersIds = savedWigData.stageAssignments?.[stage.name] || [];
                    const assignedNames = assignedWorkersIds.map((id: string) => workers.find(w => w._id === id)?.username).filter(Boolean).join(', ') || '—';
                    const deadline = savedWigData.stageDeadlines?.[stage.name];
                    const formattedDeadline = deadline ? new Date(deadline).toLocaleDateString('he-IL') : '—';

                    if(assignedWorkersIds.length === 0) return null;

                    return (
                      <tr key={stage.name} style={{ borderBottom: '1px solid #f0e8e9' }}>
                        <td style={{ padding: '10px 12px', color: '#5c3d3d', fontWeight: 500 }}>{stage.name}</td>
                        <td style={{ padding: '10px 12px' }}>{assignedNames}</td>
                        <td style={{ padding: '10px 12px', color: '#d8676d', fontWeight: 500 }}>{formattedDeadline}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div style={{ 
              marginBottom: '35px',
              padding: '20px',
              background: '#f5e6e8',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>סך הכול</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color: '#5c3d3d', margin: 0 }}>₪{savedWigData.price || '—'}</p>
            </div>

            {/* Images Section */}
            {(savedWigData.imageUrl || savedWigData.customerSignature) && (
              <div style={{ 
                marginBottom: '30px',
                display: 'grid',
                gridTemplateColumns: savedWigData.imageUrl && savedWigData.customerSignature ? '1fr 1fr' : '1fr',
                gap: '20px'
              }}>
                {savedWigData.imageUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#5c3d3d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>תמונת לקוחה</p>
                    <img src={savedWigData.imageUrl} alt="Customer" style={{ 
                      width: '100%', 
                      maxWidth: '150px', 
                      height: 'auto', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                    }} />
                  </div>
                )}
                {savedWigData.customerSignature && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#5c3d3d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>חתימת לקוחה</p>
                    <img src={savedWigData.customerSignature} alt="Signature" style={{ 
                      maxHeight: '80px', 
                      maxWidth: '100%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                    }} />
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ 
              borderTop: '1px solid #e8d7d8',
              paddingTop: '20px',
              marginTop: 'auto',
              textAlign: 'center',
              fontSize: '11px',
              color: '#999'
            }}>
              <p style={{ margin: '5px 0' }}>צילי לנדמן — פיאות יוקרתיות</p>
              <p style={{ margin: '5px 0' }}>☎️ 050-123-4567 | 📍 תל אביב</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#ccc' }}>© Zili Landaman Wigs | WigFlow System</p>
            </div>

          </div>
        </div>
      )}

      <h1 className="form-title">zili — {isRepairFlow ? 'רישום לקוחה לתיקון' : 'הזמנת פאה חדשה'}</h1>

      {step === 1 && (
        <div className="search-section animate-in">
          <h3>שלב 1: זיהוי לקוחה</h3>
          <div className="search-box">
            <input {...register('customerSearch')} placeholder="תעודת זהות או שם מלא..." className="form-input" />
            <button type="button" onClick={handleCustomerSearch} className="btn-search" disabled={loading}>
              {loading ? 'מחפש...' : 'חפשי לקוחה'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(step === 2 ? handleQuickCustomerRegistration : onSubmit)}>
        
        {step === 2 && (
          <fieldset className="form-section animate-in">
            <div className="section-subtitle">שלב 2 — רישום לקוחה חדשה</div>
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
            
            {customer && (
              <div className="customer-banner">
                <span>לקוחה מזוהה: <strong>{customer.firstName} {customer.lastName}</strong></span>
                <button type="button" className="btn-back" onClick={() => setStep(1)}>החלף לקוחה</button>
              </div>
            )}

            <div className="barcode-container">
              <h3>קוד זיהוי פאה *</h3>
              <input
                className="form-input"
                placeholder="הקלידי קוד פאה (למשל: WIG-555)"
                required
                {...register('orderCode', { required: true })}
              />
            </div>

            <div className="section-subtitle">מידות ראש</div>
            <div className="form-grid">
              <input type="number" step="0.1" className="form-input" {...register('circumference')} placeholder="היקף ראש (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('napeLength')} placeholder="אורך עורף (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('earToEar')} placeholder="אוזן לאוזן (ס״מ)" />
              <input type="number" step="0.1" className="form-input" {...register('frontToBack')} placeholder="פדחת לעורף (ס״מ)" />
            </div>

            <div className="section-subtitle">מפרט טכני ועיצוב</div>
            <div className="form-grid">
              <select className="form-input" defaultValue="" {...register('hairType', { required: true })}>
                <option value="" disabled hidden>סוג שיער</option>
                <option>חלק</option>
                <option>שיער תנועתי</option>
                <option>שיער גלי</option>
                <option>מתולתל</option>
              </select>

              <select className="form-input" defaultValue="" {...register('topConstruction', { required: true })}>
                <option value="" disabled hidden>סוג סקין</option>
                <option>סקין</option>
                <option>שבלול</option>
                <option>לייסטופ</option>
                <option>לייס פרונט</option>
                <option>דיפ לייס</option>
              </select>
              
              <div className="color-pair">
                <select className="form-input" defaultValue="" {...register('baseColor')}>
                  <option value="" disabled hidden>צבע בסיס</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={String(n)}>{n}</option>)}
                </select>
                <input className="form-input" {...register('highlights')} placeholder="גוונים (למשל: 10-12)" />
              </div>
              
              <select className="form-input" defaultValue="" {...register('netSize', { required: true })}>
                <option value="" disabled hidden>מידת רשת</option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </div>

            <div className="section-subtitle">עיצוב וגימור</div>
            <div className="form-grid">
              <div className="front-style-box">
                <span className="box-label">עיצוב פרונט</span>
                {['ע"י רגילה שטוחה','בייבי הייר קל','בייבי הייר כבד','פוני צד','פוני בובה'].map(option => (
                  <label key={option} className="checkbox-row">
                    <input type="checkbox" value={option} {...register('frontStyle', { required: true })} />
                    {option}
                  </label>
                ))}
              </div>
              
              <select className="form-input select-inline" defaultValue="" {...register('finalStyle', { required: true })}>
                <option value="" disabled hidden>סוג סירוק</option>
                <option>חלק</option>
                <option>מוברש</option>
                <option>גלי</option>
                <option>תלתלים</option>
                <option>בייביליס</option>
                <option>יבוש טבעי</option>
              </select>
              
              <textarea className="form-input full-width" {...register('specialNotes')} placeholder="הערות מיוחדות..."></textarea>
            </div>

            <div className="section-subtitle">שיבוץ צוות</div>
            <div className="form-grid">
              {REQUIRED_STAGES.map(stage => {
                const stageWorkers = workers.filter(w => w.specialty === stage.specialty);
                return (
                  <div className="stage-card" key={stage.name}>
                    <div className="stage-card-title">
                      {stage.name}{stage.name === 'התאמת שיער' && ' *'}
                    </div>
                    {stageWorkers.length === 0 ? (
                      <span className="stage-no-workers">אין עובדות זמינות</span>
                    ) : (
                      stageWorkers.map(w => (
                        <label key={w._id} className="stage-worker-row">
                          <input
                            type="checkbox"
                            checked={(plannedAssignments[stage.name] || []).includes(w._id)}
                            onChange={() => toggleWorkerForStage(stage.name, w._id)}
                          />
                          {w.fullName || w.username}
                        </label>
                      ))
                    )}
                    {stageWorkers.length > 0 && (
                      <div className="stage-deadline">
                        <label>תאריך יעד לשלב</label>
                        <input
                          type="date"
                          className="form-input"
                          value={stageDeadlines[stage.name] || ''}
                          onChange={(e) => setStageDeadlines({ ...stageDeadlines, [stage.name]: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="section-subtitle">תשלום</div>
            <div className="form-grid">
              <input type="number" className="form-input" {...register('price', { required: true })} placeholder="מחיר סופי *" />
              <input type="number" className="form-input" {...register('advancePayment')} placeholder="מקדמה" />
            </div>

            <div className="section-subtitle">תמונת לקוחה</div>
            <div className="camera-container">
              {!isCameraOpen && !capturedImage && (
                <button type="button" className="btn-secondary" onClick={startCamera}>
                  פתח מצלמה וצלם לקוחה
                </button>
              )}
              {isCameraOpen && (
                <div className="camera-preview">
                  <video ref={videoRef} autoPlay playsInline />
                  <div className="neworder-camera-btns">
                    <button type="button" className="btn-capture" onClick={capturePhoto}>צלם תמונה</button>
                    <button type="button" className="btn-close-cam" onClick={stopCamera}>בטל</button>
                  </div>
                </div>
              )}
              {capturedImage && (
                <div className="captured-preview">
                  <span className="capture-success">✓ התמונה צולמה בהצלחה</span>
                  <img src={capturedImage} alt="Customer" />
                  <button type="button" className="btn-secondary" onClick={retakePhoto}>צלם מחדש</button>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="signature-container">
              <h4>חתימת לקוחה לאישור</h4>
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

      {savedWigData && !loading && (
        <div className="sticker-overlay animate-in">
          <div className="print-sticker">
            <div className="sticker-header">zili — העסקה נקלטה</div>
            <div className="sticker-content">
              <h3>{pdfStatus}</h3>
              <p>לקוחה: {savedWigData.customerName}</p>
              <p>קוד הזמנה: <strong>{savedWigData.orderCode}</strong></p>
            </div>
            <div className="sticker-actions">
              <button className="btn-close" style={{ background: 'var(--zili-deep)', color: 'white' }} onClick={() => navigate('/dashboard')}>
                מעבר לדאשבורד
              </button>
              <button className="btn-close" style={{ background: 'var(--zili-success)', color: 'white' }} onClick={() => window.location.reload()}>
                קבלה חדשה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};