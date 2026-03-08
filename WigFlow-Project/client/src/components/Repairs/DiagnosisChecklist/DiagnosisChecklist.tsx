import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CATEGORY_MAP = {
  'צבע': ['גוונים', 'שורש', 'שטיפה לעש', 'הבהרה לבלונד'],
  'מכונה': [
    'העברת רשת', 'תיקון רשת', 'התקנת לייס', 'התקנת ריבן', 
    'התקנת סקין', 'להשטיח סקין', 'הארכת פאה', 'דילול טרסים', 
    'מילוי טרסים', 'קיצור פאה'
  ],
  'עבודת יד': ['מילוי לייס', 'מילוי ריבן', 'בייביהייר', 'ע"י ישנה', 'גובה בקודקוד']
};

const STYLING_OPTIONS = ['חלק', 'מוברש', 'גלי', 'תלתלים', 'ייבוש טבעי', 'בייביליס'];

interface Worker {
  workerId: string;
  workerName: string;
  load: number;
}

interface TaskSelection {
  category: string;
  subCategory: string;
  assignedTo: string;
  notes: string;
  status: 'ממתין';
}

export const DiagnosisChecklist: React.FC = () => {
  const [step, setStep] = useState(1); 
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [generatedSticker, setGeneratedSticker] = useState<any>(null);
  const [wigSyncStatus, setWigSyncStatus] = useState<string | null>(null);

  const [wigCode, setWigCode] = useState(() => 'REP-' + Math.random().toString(36).substr(2, 5).toUpperCase());
  
  const [idNumber, setIdNumber] = useState(''); 
  const [customerId, setCustomerId] = useState(''); 
  const [customerName, setCustomerName] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    firstName: '', lastName: '', phoneNumber: '', email: '', address: '', city: ''
  });

  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<TaskSelection[]>([]);
  const [stylingType, setStylingType] = useState('חלק');
  const [washerId, setWasherId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [workers, setWorkers] = useState<Record<string, Worker[]>>({
    'צבע': [], 'מכונה': [], 'עבודת יד': [], 'חפיפה': [], 'בקרה': []
  });

  useEffect(() => {
    const fetchWorkers = async () => {
      const categories = ['צבע', 'מכונה', 'עבודת יד', 'חפיפה', 'בקרה'];
      const workersData: Record<string, Worker[]> = {};
      for (const cat of categories) {
        try {
          const response = await fetch(`http://localhost:3000/api/repairs/available-workers/${cat}`);
          const result = await response.json();
          if (result.success) workersData[cat] = result.data;
        } catch (error) { console.error("Error fetching workers", error); }
      }
      setWorkers(workersData);
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(async (decodedText) => {
        const cleanCode = decodedText.split('/').pop() || decodedText;
        setWigCode(cleanCode);
        setIsScannerOpen(false);
        scanner.clear();

        try {
          const res = await fetch(`http://localhost:3000/api/repairs/sync-check/${cleanCode}`);
          const data = await res.json();
          if (data.found) {
            setWigSyncStatus(`הפאה זוהתה: נמצאת כרגע ב-${data.location} (סטטוס: ${data.status})`);
            if (data.customer) {
              setCustomerId(data.customer._id);
              setCustomerName(`${data.customer.firstName} ${data.customer.lastName}`);
            }
          } else {
            setWigSyncStatus("פאה חדשה/לא מוכרת - ממשיך כתיקון רגיל");
          }
        } catch (e) { console.error("Sync error", e); }
      }, () => {});
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [isScannerOpen]);

  const handleSearchCustomer = async () => {
    if (!idNumber) return;
    try {
      const response = await fetch(`http://localhost:3000/api/customers/search/${idNumber}`);
      const data = await response.json();
      if (data.exists) {
        setCustomerId(data.customer._id);
        setCustomerName(`${data.customer.firstName} ${data.customer.lastName}`);
        setStep(3); 
      } else {
        setStep(2); 
      }
    } catch (error) { console.error("Search error", error); }
  };

  const handleTaskToggle = (category: string, subCategory: string) => {
    const isSelected = selectedTasks.some(t => t.subCategory === subCategory);
    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(t => t.subCategory !== subCategory));
    } else {
      setSelectedTasks([...selectedTasks, { category, subCategory, assignedTo: '', notes: '', status: 'ממתין' }]);
    }
  };

  const updateTaskDetail = (subCategory: string, field: 'assignedTo' | 'notes', value: string) => {
    setSelectedTasks(selectedTasks.map(t => t.subCategory === subCategory ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCustomerId = customerId;

    if (step === 2 || !customerId) {
      if (!newCustomer.email) { alert("חובה להזין אימייל!"); return; }
      const custRes = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCustomer, idNumber })
      });
      const custResult = await custRes.json();
      if (custResult._id) finalCustomerId = custResult._id;
      else return;
    }

    const payload = { wigCode, customerId: finalCustomerId, isUrgent, tasks: selectedTasks, stylingType, washerId, adminId };

    const response = await fetch('http://localhost:3000/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      setGeneratedSticker({ id: result.data._id, code: wigCode, name: customerName || newCustomer.firstName });
    }
  };

  return (
    <div className="diagnosis-container" dir="rtl" style={{ maxWidth: '850px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>
        {step === 1 ? "חיפוש לקוחה" : step === 2 ? "רישום לקוחה חדשה" : "דיאגנוזה ושיבוץ עבודה"}
      </h2>

      {step === 1 && (
        <div style={{ padding: '30px', textAlign: 'center', background: '#f8f9fa' }}>
          <p>הזיני תעודת זהות:</p>
          <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} style={{ padding: '10px', width: '200px' }} />
          <button onClick={handleSearchCustomer} style={{ padding: '10px 20px', background: '#6f42c1', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}>המשך</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: '#fff', padding: '20px', border: '1px solid #ddd' }}>
          <h3>פרטי לקוחה (ת.ז. {idNumber})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input placeholder="שם פרטי *" onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="שם משפחה *" onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="טלפון *" onChange={e => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="מייל (חובה) *" onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="עיר" onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} style={{ padding: '8px' }} />
            <input placeholder="כתובת" onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} style={{ padding: '8px' }} />
          </div>
          <button onClick={() => setStep(3)} style={{ marginTop: '15px', padding: '10px', background: '#28a745', color: 'white', border: 'none' }}>המשך לדיאגנוזה</button>
        </div>
      )}

      {step === 3 && !generatedSticker && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#eee', padding: '10px', marginBottom: '15px' }}>
            לקוחה: <strong>{customerName || newCustomer.firstName}</strong>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #6f42c1', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>זיהוי פאה:</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <input readOnly value={wigCode} style={{ padding: '10px', flex: 1, background: '#f0f0f0' }} />
              <button type="button" onClick={() => setIsScannerOpen(!isScannerOpen)} style={{ padding: '10px', background: '#17a2b8', color: 'white', border: 'none' }}>📷 סרוק פאה קיימת</button>
            </div>
            {isScannerOpen && <div id="qr-reader" style={{ marginTop: '10px' }}></div>}
            {wigSyncStatus && <div style={{ marginTop: '10px', color: '#856404', background: '#fff3cd', padding: '5px' }}>ℹ️ {wigSyncStatus}</div>}
          </div>

          <div style={{ marginBottom: '10px' }}>
             <label style={{ color: 'red', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} /> סימון כדחוף!
             </label>
          </div>

          {Object.entries(CATEGORY_MAP).map(([category, subCats]) => (
            <div key={category} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>{category}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                {subCats.map(sub => {
                  const isSelected = selectedTasks.some(t => t.subCategory === sub);
                  const taskData = selectedTasks.find(t => t.subCategory === sub);
                  return (
                    <div key={sub} style={{ padding: '5px', background: isSelected ? '#f8f4ff' : 'transparent' }}>
                      <label><input type="checkbox" checked={isSelected} onChange={() => handleTaskToggle(category, sub)} /> {sub}</label>
                      {isSelected && (
                        <div style={{ marginTop: '5px' }}>
                          <select required value={taskData?.assignedTo || ''} onChange={(e) => updateTaskDetail(sub, 'assignedTo', e.target.value)} style={{ width: '100%' }}>
                            <option value="">-- בחרי עובדת --</option>
                            {workers[category]?.map(w => <option key={w.workerId} value={w.workerId}>{w.workerName} ({w.load})</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* סיום ובקרה - כולל סגנון חפיפה */}
          <div style={{ display: 'flex', gap: '10px', padding: '15px', background: '#fdfdfd', border: '1px solid #eee', borderRadius: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>סגנון חפיפה:</label>
              <select value={stylingType} onChange={e => setStylingType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                {STYLING_OPTIONS.map(style => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>חופפת:</label>
              <select required value={washerId} onChange={e => setWasherId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                <option value="">-- בחרי --</option>
                {workers['חפיפה']?.map(w => <option key={w.workerId} value={w.workerId}>{w.workerName}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>QA (בקרה):</label>
              <select required value={adminId} onChange={e => setAdminId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                <option value="">-- בחרי --</option>
                {workers['בקרה']?.map(w => <option key={w.workerId} value={w.workerId}>{w.workerName}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '15px', background: '#6f42c1', color: 'white', border: 'none', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', borderRadius: '6px' }}>
            אישור ופתיחת כרטיס תיקון
          </button>
        </form>
      )}

      {generatedSticker && (
        <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed #000', borderRadius: '15px', marginTop: '20px' }}>
          <h3>התיקון נרשם! ✅</h3>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wigflow://repair/${generatedSticker.id}`} alt="QR" />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>{generatedSticker.code}</div>
          <p>{generatedSticker.name}</p>
          <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>הדפס מדבקה 🖨️</button>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>סגור ופתח חדש</button>
        </div>
      )}
    </div>
  );
};