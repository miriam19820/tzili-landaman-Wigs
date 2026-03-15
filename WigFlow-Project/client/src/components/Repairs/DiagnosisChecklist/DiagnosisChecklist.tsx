import React, { useState } from 'react';
import { StaffAllocator } from '../StaffAllocator/StaffAllocator';
import './DiagnosisChecklist.css';

// הגדרת סוגי התיקונים לפי האפיון (שבוע 1) [cite: 7, 8, 9]
const REPAIR_CATEGORIES = [
  { id: 'machine', name: 'מכונה', subTypes: ['העברת רשת', 'תיקון רשת', 'התקנת לייס', 'השטחת סקין', 'דילול/מילוי'] },
  { id: 'color', name: 'צבע', subTypes: ['גוונים', 'שורש', 'שטיפה', 'הבהרה'] },
  { id: 'hand', name: 'עבודת יד', subTypes: ['מילוי לייס', 'בייביהייר', 'גובה בקודקוד'] }
];

export const DiagnosisChecklist: React.FC = () => {
  const [idNumber, setIdNumber] = useState(''); // לחיפוש לקוחה
  const [customerId, setCustomerId] = useState(''); // ה-ID שנדרש לשרת [cite: 34]
  const [customerName, setCustomerName] = useState('');
  const [wigCode, setWigCode] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // פונקציה לחיפוש לקוחה וקבלת ה-ID שלה מהשרת [cite: 43]
  const handleSearchCustomer = async () => {
    if (!idNumber) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/customers/search/${idNumber}`);
      const data = await response.json();
      if (data.exists) {
        setCustomerId(data.customer._id);
        setCustomerName(`${data.customer.firstName} ${data.customer.lastName}`);
      } else {
        alert("לקוחה לא נמצאה. יש לרשום אותה במערכת תחילה.");
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה להוספת/הסרת תיקון מהרשימה (שבוע 3) [cite: 22]
  const toggleTask = (category: string, subCategory: string) => {
    const exists = selectedTasks.find(t => t.category === category && t.subCategory === subCategory);
    if (exists) {
      setSelectedTasks(selectedTasks.filter(t => t !== exists));
    } else {
      setSelectedTasks([...selectedTasks, { 
        category, 
        subCategory, 
        assignedTo: '', // השדה המדויק שהשרת מצפה לו [cite: 10]
        notes: '',
        status: 'ממתין' 
      }]);
    }
  };

  // עדכון העובדת שנבחרה למשימה ספציפית דרך ה-StaffAllocator [cite: 24, 55]
  const updateWorker = (subCategory: string, workerId: string) => {
    setSelectedTasks(prev => prev.map(t => 
      t.subCategory === subCategory ? { ...t, assignedTo: workerId } : t
    ));
  };

  // שליחת הטופס לשרת (POST /api/repairs) [cite: 34]
  const handleSubmit = async () => {
    if (!customerId || !wigCode || selectedTasks.length === 0) {
      alert("נא לוודא זיהוי לקוחה, קוד פאה ובחירת תיקונים כולל שיבוץ עובדות");
      return;
    }

    const repairData = {
      customerId, // ה-ID של הלקוחה עבור הקישור ב-DB [cite: 34]
      wigCode,
      isUrgent,
      tasks: selectedTasks,
      overallStatus: 'בתיקון'
    };

    try {
      const response = await fetch('http://localhost:3000/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData)
      });

      if (response.ok) {
        alert("כרטיס תיקון נפתח בהצלחה! המשימות הועברו לעובדות. ✅");
        // איפוס טופס
        setSelectedTasks([]);
        setWigCode('');
        setCustomerId('');
        setCustomerName('');
        setIdNumber('');
      } else {
        const errorData = await response.json();
        alert(`שגיאה מהשרת: ${errorData.message}`);
      }
    } catch (error) {
      alert("שגיאת תקשורת בפתיחת התיקון");
    }
  };

  return (
    <div className="diagnosis-container" dir="rtl">
      <h2 style={{ color: '#6f42c1' }}>אבחון ושיבוץ פאה לתיקון 📝</h2>
      
      <div className="search-section" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p>זיהוי לקוחה לפי ת"ז:</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="הזיני תעודת זהות..." 
            value={idNumber} 
            onChange={e => setIdNumber(e.target.value)} 
          />
          <button onClick={handleSearchCustomer} disabled={loading}>
            {loading ? 'מחפש...' : 'חיפוש לקוחה'}
          </button>
        </div>
        {customerName && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>לקוחה מזוהה: {customerName}</p>}
      </div>

      <div className="basic-info">
        <input 
          placeholder="קוד פאה (REP-XXXXX)" 
          value={wigCode} 
          onChange={e => setWigCode(e.target.value)} 
        />
        <label className="urgent-label" style={{ color: isUrgent ? 'red' : 'inherit', fontWeight: 'bold' }}>
          <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
          סימון כדחוף! 🔴 [cite: 31, 66]
        </label>
      </div>

      <div className="categories-grid">
        {REPAIR_CATEGORIES.map(cat => (
          <div key={cat.id} className="category-section" style={{ border: '1px solid #eee', padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ color: '#6f42c1', marginTop: 0 }}>{cat.name}</h3>
            {cat.subTypes.map(sub => {
              const isSelected = selectedTasks.find(t => t.subCategory === sub);
              return (
                <div key={sub} className={`task-row ${isSelected ? 'selected' : ''}`} style={{ marginBottom: '10px' }}>
                  <label>
                    <input type="checkbox" checked={!!isSelected} onChange={() => toggleTask(cat.name, sub)} />
                    {sub}
                  </label>
                  
                  {isSelected && (
                    <div className="allocator-wrapper" style={{ marginTop: '5px', marginRight: '20px' }}>
                      {/* שימוש בקומפוננטה המציגה עובדות פנויות ועומס בזמן אמת (שבוע 3) [cite: 24, 35, 56] */}
                      <StaffAllocator 
                        category={cat.name} 
                        onSelect={(workerId) => updateWorker(sub, workerId)} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button 
        className="submit-repair-btn" 
        onClick={handleSubmit}
        style={{ width: '100%', padding: '15px', backgroundColor: '#6f42c1', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        אישור ופתיחת כרטיס תיקון 🖨️
      </button>
    </div>
  );
};