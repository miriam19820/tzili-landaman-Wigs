import React, { useState } from 'react';
import './EditWorkerModal.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface EditWorkerModalProps {
  worker: { 
    _id: string; 
    fullName: string; 
    specialty: string; 
    isActive: boolean;
  };
  onClose: () => void;
  onUpdate: () => void;
}

export const EditWorkerModal: React.FC<EditWorkerModalProps> = ({ worker, onClose, onUpdate }) => {
  const [fullName, setFullName] = useState(worker.fullName);
  const [specialty, setSpecialty] = useState(worker.specialty);
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(worker.isActive);
  
  // מנגנון הגנה: האם המשתמש לוחץ כרגע על "בטוחה?"
  const [isConfirmingFreeze, setIsConfirmingFreeze] = useState(false);
  const [isConfirmingActivate, setIsConfirmingActivate] = useState(false);

  const handleToggleFreeze = () => {
    if (!isConfirmingFreeze) {
      // לחיצה ראשונה - מבקשים אישור
      setIsConfirmingFreeze(true);
    } else {
      // לחיצה שנייה - מאשרים הקפאה
      setIsActive(false);
      setIsConfirmingFreeze(false);
    }
  };

  const handleToggleActivate = () => {
    if (!isConfirmingActivate) {
      // לחיצה ראשונה - מבקשים אישור
      setIsConfirmingActivate(true);
    } else {
      // לחיצה שנייה - מאשרים החזרה
      setIsActive(true);
      setIsConfirmingActivate(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    
    // הכנת הנתונים לשליחה
    const updateData: any = { 
      fullName, 
      specialty, 
      isActive 
    };
    
    if (password.trim() !== '') {
      updateData.password = password;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${worker._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // --- חלק 1: הארכת הזמן של ה-Toast ---
        toast.success(`השינויים עבור ${fullName} נשמרו!`, {
          position: "top-center",
          autoClose: 6000, // 6 שניות!
          theme: "colored",
          icon: <span className="status-check-icon">✓</span>,
        });
        
        onUpdate(); 
        
        // נותנים להודעה לעבוד קצת לפני שסוגרים את המודל
        setTimeout(() => onClose(), 2000); 
        
      } else {
        const errorData = await response.json();
        toast.error(`שגיאה בעדכון: ${errorData.message}`, {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error updating worker:", error);
      toast.error('שגיאה בתקשורת עם השרת. אנא נסי שוב מאוחר יותר.', {
        position: "top-center",
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>עריכת עובדת: {worker.fullName}</h3>
        
        <div className="input-group">
          <label>שם מלא</label>
          <input 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="רחלי כהן..."
          />
        </div>

        <div className="input-group">
          <label>התמחות</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="שיער">שיער</option>
            <option value="תפירה">תפירה</option>
            <option value="צבע">צבע</option>
            <option value="QC">QC</option>
          </select>
        </div>

        <div className="input-group">
          <label>איפוס סיסמה (אופציונלי)</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="השאירי ריק ללא שינוי"
          />
        </div>

        {/* --- אזור הסטטוס החדש והנקי --- */}
        <div className="status-box">
          <div className="status-label">
            סטטוס: 
            <strong>
              {isActive ? 'פעילה' : 'מוקפאת'}
            </strong>
          </div>
          
          {isActive ? (
            <button 
              type="button" 
              className={`freeze-toggle-btn btn-active ${isConfirmingFreeze ? 'confirm-mode heavyShake' : ''}`}
              onClick={handleToggleFreeze}
              onMouseLeave={() => setIsConfirmingFreeze(false)}
            >
              {isConfirmingFreeze ? 'בטוחה? לחצי שוב' : 'הקפיאי עובדת'}
            </button>
          ) : (
            <button 
              type="button" 
              className={`freeze-toggle-btn btn-frozen ${isConfirmingActivate ? 'confirm-mode heavyShake' : ''}`}
              onClick={handleToggleActivate}
              onMouseLeave={() => setIsConfirmingActivate(false)}
            >
              {isConfirmingActivate ? 'בטוחה? לחצי שוב' : 'החזירי לפעילות'}
            </button>
          )}
        </div>

        <div className="modal-actions">
          <button className="action-btn btn-save" onClick={handleSave}>שמור שינויים</button>
          <button className="action-btn btn-cancel" onClick={onClose}>ביטול</button>
        </div>
      </div>
      
      {/* Container for toasts will appear globally */}
      <ToastContainer limit={1} /> 
    </div>
  );
};