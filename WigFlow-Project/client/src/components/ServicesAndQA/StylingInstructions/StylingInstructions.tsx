import React from 'react';
import './StylingInstructions.css'; // <-- הוספנו את ה-CSS

interface IStylingProps {
  category: string;
  notes?: string;
  isUrgent?: boolean;
}

export const StylingInstructions: React.FC<IStylingProps> = ({ category, notes, isUrgent }) => {
  return (
    <div className={`styling-container ${isUrgent ? 'urgent' : ''}`}>
      <h3 className="styling-title">הוראות עיצוב לסורקת:</h3>
      <p className="styling-detail"><strong>סגנון מבוקש:</strong> {category}</p>
      {notes && <p className="styling-detail"><strong>הערות ספציפיות:</strong> {notes}</p>}
      
      {isUrgent && (
        <p className="urgent-warning">
          ⚠️ דחוף - נא לתת עדיפות!
        </p>
      )}
    </div>
  );
}