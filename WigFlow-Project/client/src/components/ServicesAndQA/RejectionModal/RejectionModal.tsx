import React, { useState } from 'react';
import './RejectionModal.css';

interface RejectionModalProps {
  isOpen: boolean;
  customerName: string;
  onClose: () => void;
  // התיקון: הוספת photoUrl לחתימת הפונקציה
  onConfirm: (reason: string, returnStages: string[], photoUrl: string) => void;
}

const STAGES = ['תפירת פאה', 'צבע', 'תיקון רשת', 'חפיפה ועיצוב'];

export const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, customerName, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null); // State לתמונה

  if (!isOpen) return null;

  const handleToggleStage = (stage: string) => {
    setSelectedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAction = () => {
    if (!reason) return alert('חובה להזין סיבת פסילה');
    if (selectedStages.length === 0) return alert('חובה לבחור לפחות שלב אחד לחזרה');
    if (!photo) return alert('חובה לצלם את התקלה עבור העובדת!');

    onConfirm(reason, selectedStages, photo);
    // איפוס שדות
    setReason('');
    setSelectedStages([]);
    setPhoto(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" dir="rtl">
        <div className="modal-header">
          <h2>פסילת פאה</h2>
          <div className="modal-customer">{customerName}</div>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <label>מה הבעיה</label>
            <textarea
              className="modal-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="למשל: השביל לא במקום, חסר שיער בצד ימין..."
            />
          </div>

          <div className="modal-section">
            <label>צלמי את הבעיה (חובה)</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="photo-input"
            />
            {photo && <img src={photo} alt="תצוגה מקדימה" className="rejection-preview" />}
          </div>

          <div className="modal-section">
            <label>לאילו שלבים להחזיר</label>
            <div className="stages-grid">
              {STAGES.map(stage => (
                <button
                  key={stage}
                  className={`stage-btn ${selectedStages.includes(stage) ? 'active' : ''}`}
                  onClick={() => handleToggleStage(stage)}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>ביטול</button>
          <button className="btn-confirm-reject" onClick={handleConfirmAction}>אשר פסילה</button>
        </div>
      </div>
    </div>
  );
};