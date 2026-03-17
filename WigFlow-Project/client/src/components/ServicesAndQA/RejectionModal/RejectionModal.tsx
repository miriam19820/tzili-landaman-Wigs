import React, { useState } from 'react';
import './RejectionModal.css'; // <-- הוספנו את ה-CSS

interface IRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  customerName: string;
}

export const RejectionModal: React.FC<IRejectionModalProps> = ({ isOpen, onClose, onConfirm, customerName }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('חובה להזין סיבת פסילה!');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">פסילת פאה והחזרה לתיקון</h3>
        <p>את פוסלת את הפאה של: <strong>{customerName}</strong></p>
        
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>סיבת הפסילה (הערה לעובדת):</label>
        <textarea
          className="modal-textarea"
          placeholder="לדוגמה: הסירוק לא מספיק עמיד, יש קשרים בעורף..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn-confirm-reject" onClick={handleSubmit}>
            אשר פסילה
          </button>
          <button className="btn-cancel" onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}