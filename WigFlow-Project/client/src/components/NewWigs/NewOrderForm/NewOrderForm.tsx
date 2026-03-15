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
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [signatureData, setSignatureData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savedWigData, setSavedWigData] = useState<any>(null); 
  
  // זיהוי האם הגענו מתהליך של תיקון
  const isRepairFlow = location.state?.fromFlow === 'repair';

  const [plannedAssignments, setPlannedAssignments] = useState<Record<string, string>>({});

  const REQUIRED_STAGES = [
    { name: 'התאמת שיער', specialty: 'התאמת שיער' },
    { name: 'תפירת פאה', specialty: 'תפירה' },
    { name: 'צבע', specialty: 'צבע' },
    { name: 'עבודת יד', specialty: 'עבודת יד' },
    { name: 'חפיפה', specialty: 'חפיפה' }
  ];

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewOrderFormInputs>();
  
  const idSearchValue = watch("idNumberSearch");

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
        if (isRepairFlow) {
            navigate('/repairs/new', { state: { idNumber: idSearchValue } });
        } else {
            setStep(3);
        }
      } else {
        setCustomer({ idNumber: idSearchValue });
        setStep(2);
      }
    } catch (err) { alert("שגיאה בחיפוש"); } finally { setLoading(false); }
  };

  // פונקציית רישום מהירה עבור לקוחה שבאה לתיקון
  const handleQuickCustomerRegistration = async (data: NewOrderFormInputs) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/customers', {
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: customer.idNumber,
        phoneNumber: data.phoneNumber,
        email: data.email,
        address: data.address,
        city: data.city
      });

      if (response.status === 201 || response.status === 200) {
        alert("הלקוחה נרשמה בהצלחה! חוזרים לאבחון התיקון...");
        navigate('/repairs/new', { state: { idNumber: customer.idNumber } });
      }
    } catch (error) {
      alert("שגיאה ברישום הלקוחה");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: NewOrderFormInputs) => {
    // לוגיקת שמירה רגילה להזמנה חדשה...
  };

  return (
    <div className="new-order-container" dir="rtl">
      <h1 className="form-title">WigFlow - {isRepairFlow ? 'רישום לקוחה לתיקון' : 'הזמנה חדשה'}</h1>

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
            <legend>רישום לקוחה חדשה {isRepairFlow ? '(עבור תיקון)' : ''}</legend>
            <div className="form-grid">
              <input className="form-input" {...register('firstName', { required: true })} placeholder="שם פרטי *" />
              <input className="form-input" {...register('lastName', { required: true })} placeholder="שם משפחה *" />
              <input className="form-input" {...register('phoneNumber', { required: true })} placeholder="טלפון *" />
              <input className="form-input" {...register('email')} placeholder="אימייל" />
              <input className="form-input" {...register('city')} placeholder="עיר" />
              <input className="form-input full-width" {...register('address')} placeholder="כתובת מגורים" />
            </div>
            
            {isRepairFlow ? (
                <button 
                  type="button" 
                  className="submit-btn" 
                  onClick={handleSubmit(handleQuickCustomerRegistration)}
                  disabled={loading}
                >
                  {loading ? "רושם..." : "סיום רישום וחזרה לתיקון ←"}
                </button>
            ) : (
                <button type="button" className="btn-next" onClick={() => setStep(3)}>המשך למפרט ←</button>
            )}
          </fieldset>
        )}
        {/* המשך הטופס עבור הזמנה חדשה... */}
      </form>
    </div>
  );
};