import React, { useState } from 'react';
import './RejectionModal.css';

interface RejectionModalProps {
  isOpen: boolean;
  customerName: string;
  onClose: () => void;
  // הפונקציה עכשיו מקבלת גם את סיבת הפסילה וגם מערך של התחנות אליהן מחזירים
  onConfirm: (reason: string, returnStages: string[]) => void;
}

const STAGES = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה'
];

export const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, customerName, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  if (!isOpen) return null;

  // פונקציה שמוסיפה או מסירה תחנה מהרשימה כשלוחצים על ה-V
  const toggleStage = (stage: string) => {
    setSelectedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('חובה להזין סיבת פסילה כדי שהצוות ידע מה לתקן');
      return;
    }
    if (selectedStages.length === 0) {
      alert('חובה לבחור לפחות תחנה אחת אליה הפאה חוזרת לתיקון');
      return;
    }
    
    // שולח למסך הראשי את הסיבה ואת רשימת התחנות שנבחרו
    onConfirm(reason, selectedStages);
    setReason('');
    setSelectedStages([]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content rejection-modal" dir="rtl">
        <h2>פסילת פאה - {customerName}</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold' }}>פרטי את סיבת הפסילה והוראות התיקון לצוות:</p>
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="למשל: התפירה בעורף לא ישרה, יש לפרום ולתפור מחדש..."
            style={{ width: '100%', height: '80px', padding: '10px' }}
          />
        </div>
        
        <div className="stages-selection" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p style={{ fontWeight: 'bold', marginTop: 0 }}>לאילו תחנות להחזיר את הפאה לתיקון?</p>
          <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {STAGES.map(stage => (
              <label key={stage} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedStages.includes(stage)}
                  onChange={() => toggleStage(stage)}
                  style={{ transform: 'scale(1.2)' }}
                />
                {stage}
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-confirm-reject" onClick={handleSubmit} style={{ backgroundColor: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            אישור פסילה והחזרה לתיקון
          </button>
          <button className="btn-cancel" onClick={onClose} style={{ backgroundColor: '#95a5a6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};