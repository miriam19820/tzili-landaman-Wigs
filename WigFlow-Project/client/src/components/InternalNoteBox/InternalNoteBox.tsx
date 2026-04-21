import React from 'react';
import './InternalNoteBox.css';

interface Props {
  customerId: string;
  context: string;
  note: string;
  setNote: (value: string) => void;
}

export const InternalNoteBox: React.FC<Props> = ({ note, setNote }) => {
  return (
    <div className="internal-note-container">
      <h4 className="internal-note-title">
        <span>📝</span> הערה פנימית על הלקוחה (לא מופיע ב-PDF)
      </h4>
      
      <textarea 
        className="internal-note-textarea"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`כתבי הערה על הלקוחה (למשל: דגשי שירות, התנהגות וכו')...`}
      />
    </div>
  );
};