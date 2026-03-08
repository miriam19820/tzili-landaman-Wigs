import React, { useState } from 'react';

// הגדרת ה-Props שהמודאל מקבל
interface IRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  customerName: string;
}

export const RejectionModal: React.FC<IRejectionModalProps> = ({ isOpen, onClose, onConfirm, customerName }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null; // אם המודאל סגור, אל תרנדר כלום

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('חובה להזין סיבת פסילה!');
      return;
    }
    onConfirm(reason);
    setReason(''); // ניקוי השדה
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px', direction: 'rtl', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ marginTop: 0, color: '#d32f2f' }}>פסילת פאה והחזרה לתיקון</h3>
        <p>את פוסלת את הפאה של: <strong>{customerName}</strong></p>
        
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>סיבת הפסילה (הערה לעובדת):</label>
        <textarea
          style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          placeholder="לדוגמה: הסירוק לא מספיק עמיד, יש קשרים בעורף..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={handleSubmit}
            style={{ flex: 1, backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            אשר פסילה
          </button>
          <button 
            onClick={onClose}
            style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}