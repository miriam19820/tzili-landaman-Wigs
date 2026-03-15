import React, { useState } from 'react';
import './RejectionModal.css';

interface Props {
  isOpen: boolean;
  customerName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectionModal: React.FC<Props> = ({ isOpen, customerName, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">פסילת פאה - {customerName}</h2>
        <p>נא לציין סיבה להחזרה לתיקון:</p>
        <textarea 
          className="modal-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="לדוגמה: הקצוות עדיין רטובים..."
        />
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>ביטול</button>
          <button className="btn-confirm-reject" onClick={() => onConfirm(reason)}>אישור פסילה</button>
        </div>
      </div>
    </div>
  );
};