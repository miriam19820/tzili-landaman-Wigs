import React, { useState, useEffect } from 'react';
import { StaffAllocator } from '../StaffAllocator/StaffAllocator';
import './DiagnosisChecklist.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const REPAIR_CATEGORIES = [
  { id: 'machine', name: 'מכונה', subTypes: ['העברת רשת', 'תיקון רשת', 'התקנת לייס', 'השטחת סקין', 'דילול/מילוי'] },
  { id: 'color', name: 'צבע', subTypes: ['גוונים', 'שורש', 'שטיפה', 'הבהרה'] },
  { id: 'hand', name: 'עבודת יד', subTypes: ['מילוי לייס', 'בייביהייר', 'גובה בקודקוד'] }
];

export const DiagnosisChecklist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [idNumber, setIdNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [wigCode, setWigCode] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [categoryWorkers, setCategoryWorkers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location.state?.idNumber) {
      const returnedId = location.state.idNumber;
      setIdNumber(returnedId);
      handleSearchById(returnedId);
    }
  }, [location.state]);

  const handleSearchById = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${id}`);
      if (response.data.exists) {
        setCustomerId(response.data.customer._id);
        setCustomerName(`${response.data.customer.firstName} ${response.data.customer.lastName}`);
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!idNumber) return;
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${idNumber}`);
      if (response.data.exists) {
        setCustomerId(response.data.customer._id);
        setCustomerName(`${response.data.customer.firstName} ${response.data.customer.lastName}`);
      } else {
        if (window.confirm("לקוחה לא נמצאה. האם תרצי לעבור לדף רישום לקוחה חדשה?")) {
          navigate('/repairs/quick-register', { state: { idNumber } });
        }
      }
    } catch (error) {
      alert("שגיאה בחיפוש הלקוחה");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryWorkerChange = (categoryName: string, workerId: string) => {
    setCategoryWorkers(prev => ({ ...prev, [categoryName]: workerId }));
    
    setSelectedTasks(prev => prev.map(t => 
      t.category === categoryName ? { ...t, assignedTo: workerId } : t
    ));
  };

  const toggleTask = (category: string, subCategory: string) => {
    const exists = selectedTasks.find(t => t.category === category && t.subCategory === subCategory);
    if (exists) {
      setSelectedTasks(selectedTasks.filter(t => t !== exists));
    } else {
      setSelectedTasks([...selectedTasks, { 
        category, 
        subCategory, 
        assignedTo: categoryWorkers[category] || '', 
        notes: '',
        status: 'ממתין' 
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!customerId || !wigCode || selectedTasks.length === 0) {
      alert("נא לוודא זיהוי לקוחה, קוד פאה ובחירת תיקונים");
      return;
    }

    const unassigned = selectedTasks.find(t => !t.assignedTo);
    if (unassigned) {
      alert(`נא לבחור עובדת עבור קטגוריית ${unassigned.category}`);
      return;
    }

    const repairData = {
      customerId,
      wigCode,
      isUrgent,
      tasks: selectedTasks,
      overallStatus: 'בתיקון'
    };

    try {
      const response = await axios.post('/repairs', repairData);

      if (response.status === 201 || response.status === 200) {
        alert("כרטיס תיקון נפתח בהצלחה! ✅");
        setSelectedTasks([]);
        setCategoryWorkers({});
        setWigCode('');
        setCustomerId('');
        setCustomerName('');
        setIdNumber('');
      }
    } catch (error: any) {
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאת תקשורת בפתיחת התיקון'}`);
    }
  };

  return (
    <div className="diagnosis-container" dir="rtl">
      <h2 className="diagnosis-title">אבחון ושיבוץ פאה לתיקון 📝</h2>
      
      <div className="search-section">
        <p className="search-label">זיהוי לקוחה לפי ת"ז:</p>
        <div className="search-controls">
          <input 
            type="text" 
            placeholder="הזיני תעודת זהות..." 
            value={idNumber} 
            onChange={e => setIdNumber(e.target.value)} 
          />
          <button className="search-btn" onClick={handleSearchCustomer} disabled={loading}>
            {loading ? 'מחפש...' : 'חיפוש לקוחה'}
          </button>
        </div>
        {customerName && <p className="customer-found-msg">לקוחה מזוהה: {customerName}</p>}
      </div>

      <div className="basic-info-row">
        <input 
          className="wig-code-input"
          placeholder="קוד פאה (REP-XXXXX)" 
          value={wigCode} 
          onChange={e => setWigCode(e.target.value)} 
        />
        <label className={`urgent-toggle ${isUrgent ? 'is-urgent' : ''}`}>
          <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
          סימון כדחוף! 🔴
        </label>
      </div>

      <div className="categories-grid">
        {REPAIR_CATEGORIES.map(cat => (
          <div key={cat.id} className="category-card">
            <h3 className="category-title">{cat.name}</h3>
            
            <div className="category-worker-box">
              <p className="category-worker-label">בחרי עובדת ל{cat.name}:</p>
              <StaffAllocator 
                category={cat.name} 
                onSelect={(workerId) => handleCategoryWorkerChange(cat.name, workerId)} 
              />
            </div>

            {cat.subTypes.map(sub => {
              const isSelected = selectedTasks.find(t => t.subCategory === sub);
              return (
                <div key={sub} className={`task-selection-row ${isSelected ? 'active' : ''}`}>
                  <label className="task-checkbox-label">
                    <input type="checkbox" checked={!!isSelected} onChange={() => toggleTask(cat.name, sub)} />
                    {sub}
                  </label>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button className="main-submit-btn" onClick={handleSubmit}>
        אישור ופתיחת כרטיס תיקון 🖨️
      </button>
    </div>
  );
};