import React, { useState, useEffect } from 'react';

// נתונים סטטיים לפי ה-repairModel שיצרת בשרת
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
  const [wigCode, setWigCode] = useState('');
  
  // --- תיקון: הפרדה בין תעודת זהות ל-ID של ה-Database ---
  const [idNumber, setIdNumber] = useState(''); // מה שהמזכירה מקלידה
  const [customerId, setCustomerId] = useState(''); // ה-ID שיישלח לשרת (ObjectId)
  const [customerName, setCustomerName] = useState(''); // להצגת שם הלקוחה שנמצאה
  
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<TaskSelection[]>([]);
  const [stylingType, setStylingType] = useState('חלק');
  const [washerId, setWasherId] = useState('');
  const [adminId, setAdminId] = useState('');

  const [workers, setWorkers] = useState<Record<string, Worker[]>>({
    'צבע': [], 'מכונה': [], 'עבודת יד': [], 'חפיפה': [], 'בקרה': []
  });

  // משיכת עובדות לפי קטגוריה
  useEffect(() => {
    const fetchWorkers = async () => {
      const categories = ['צבע', 'מכונה', 'עבודת יד', 'חפיפה', 'בקרה'];
      const workersData: Record<string, Worker[]> = {};

      for (const cat of categories) {
        try {
          const response = await fetch(`http://localhost:3000/api/repairs/available-workers/${cat}`);
          const result = await response.json();
          if (result.success) {
            workersData[cat] = result.data;
          }
        } catch (error) {
          console.error(`שגיאה במשיכת עובדות לקטגוריה ${cat}:`, error);
        }
      }
      setWorkers(workersData);
    };
    fetchWorkers();
  }, []);

  // --- תוספת: פונקציית חיפוש לקוחה --- [cite: 41]
  const handleSearchCustomer = async () => {
    if (!idNumber) return;
    try {
      const response = await fetch(`http://localhost:3000/api/customers/search/${idNumber}`);
      const data = await response.json();
      if (data.exists) {
        setCustomerId(data.customer._id); // הגדרת ה-ID הפנימי לשליחה ב-POST [cite: 13]
        setCustomerName(`${data.customer.firstName} ${data.customer.lastName}`);
      } else {
        alert("לקוחה לא נמצאה במערכת. יש לרשום אותה קודם.");
        setCustomerId('');
        setCustomerName('');
      }
    } catch (error) {
      console.error("שגיאה בחיפוש לקוחה", error);
    }
  };

  const handleTaskToggle = (category: string, subCategory: string) => {
    const isSelected = selectedTasks.some(t => t.subCategory === subCategory);
    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(t => t.subCategory !== subCategory));
    } else {
      setSelectedTasks([...selectedTasks, {
        category, subCategory, assignedTo: '', notes: '', status: 'ממתין'
      }]);
    }
  };

  const updateTaskDetail = (subCategory: string, field: 'assignedTo' | 'notes', value: string) => {
    setSelectedTasks(selectedTasks.map(t => 
      t.subCategory === subCategory ? { ...t, [field]: value } : t
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wigCode || !customerId || selectedTasks.length === 0 || !washerId || !adminId) {
      alert("נא למלא את כל שדות החובה, לוודא שהלקוחה זוהתה, ולשבץ חופפת ובקרה.");
      return;
    }

    const payload = {
      wigCode,
      customerId, // כאן נשלח ה-ObjectId [cite: 13]
      isUrgent,
      tasks: selectedTasks,
      stylingType,
      washerId,
      adminId
    };

    try {
      const response = await fetch('http://localhost:3000/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.success) {
        alert("הזמנת התיקון נוצרה בהצלחה!");
        setWigCode('');
        setIdNumber('');
        setCustomerId('');
        setCustomerName('');
        setSelectedTasks([]);
      } else {
        alert("שגיאה ביצירת התיקון: " + result.message);
      }
    } catch (error) {
      console.error("שגיאה בשליחת הטופס", error);
    }
  };

  return (
    <div className="diagnosis-container" dir="rtl" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#6f42c1' }}>דיאגנוזה וקבלת פאה לתיקון</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>קוד פאה:</label>
            <input required type="text" value={wigCode} onChange={e => setWigCode(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          
          {/* תיקון: שדה חיפוש לקוחה חכם */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>תעודת זהות לקוחה:</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input 
                required 
                type="text" 
                value={idNumber} 
                onChange={e => setIdNumber(e.target.value)} 
                placeholder="הזיני ת.ז."
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="button" onClick={handleSearchCustomer} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#e9ecef', border: '1px solid #ccc', borderRadius: '4px' }}>🔎</button>
            </div>
            {customerName && <small style={{ color: 'green', display: 'block', marginTop: '4px' }}>נמצאה: <strong>{customerName}</strong></small>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '25px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
              <strong style={{ color: 'red', marginRight: '5px' }}>דחוף!</strong>
            </label>
          </div>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #eee', marginBottom: '20px' }} />

        <h3>בחירת תיקונים ושיבוץ עובדות</h3>
        {Object.entries(CATEGORY_MAP).map(([category, subCategories]) => (
          <div key={category} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e1e1e1', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#6f42c1', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{category}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              
              {subCategories.map(sub => {
                const isSelected = selectedTasks.some(t => t.subCategory === sub);
                const taskData = selectedTasks.find(t => t.subCategory === sub);

                return (
                  <div key={sub} style={{ padding: '8px', border: isSelected ? '1px solid #6f42c1' : '1px solid transparent', borderRadius: '5px', backgroundColor: isSelected ? '#f8f4ff' : 'transparent' }}>
                    <label style={{ fontWeight: isSelected ? 'bold' : 'normal', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleTaskToggle(category, sub)} 
                        style={{ marginLeft: '8px' }}
                      />
                      {sub}
                    </label>

                    {isSelected && (
                      <div style={{ marginTop: '10px', paddingRight: '22px' }}>
                        <select 
                          required 
                          value={taskData?.assignedTo || ''} 
                          onChange={(e) => updateTaskDetail(sub, 'assignedTo', e.target.value)}
                          style={{ width: '100%', padding: '5px', borderRadius: '4px' }}
                        >
                          <option value="">-- בחרי עובדת --</option>
                          {workers[category]?.map(w => (
                            <option key={w.workerId} value={w.workerId}>
                              {w.workerName} (עומס: {w.load})
                            </option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          placeholder="הערה ספציפית..." 
                          value={taskData?.notes || ''}
                          onChange={(e) => updateTaskDetail(sub, 'notes', e.target.value)}
                          style={{ marginTop: '8px', width: '100%', padding: '5px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

        <h3>סיום ובקרה</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>סגנון חפיפה:</label>
            <select value={stylingType} onChange={e => setStylingType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              {STYLING_OPTIONS.map(style => <option key={style} value={style}>{style}</option>)}
            </select>
          </div>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>שיוך חופפת:</label>
            <select required value={washerId} onChange={e => setWasherId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="">-- בחרי חופפת --</option>
              {workers['חפיפה']?.map(w => (
                 <option key={w.workerId} value={w.workerId}>{w.workerName} (עומס: {w.load})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>שיוך QA (בקרה):</label>
            <select required value={adminId} onChange={e => setAdminId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="">-- בחרי מבקרת --</option>
              {workers['בקרה']?.map(w => (
                 <option key={w.workerId} value={w.workerId}>{w.workerName} (עומס: {w.load})</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          פתיחת כרטיס תיקון במערכת
        </button>
      </form>
    </div>
  );
};