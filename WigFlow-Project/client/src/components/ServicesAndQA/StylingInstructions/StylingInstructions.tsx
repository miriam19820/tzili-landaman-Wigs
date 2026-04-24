import React from 'react';
import './StylingInstructions.css'; // ייבוא ה-CSS

interface IStylingProps {
  category: string;
  notes?: string;
  isUrgent?: boolean;
}

export const StylingInstructions: React.FC<IStylingProps> = ({ category, notes, isUrgent }) => {
  return (
    /* אם isUrgent אמת, הקונטיינר יקבל גם את הקלאס 'urgent' */
    <div className={`styling-container ${isUrgent ? 'urgent' : ''}`}>
      <h3 className="styling-title">הוראות עיצוב לסורקת:</h3>
      
      <p className="styling-text">
        <strong>סגנון מבוקש:</strong> {category}
      </p>
      
      {notes && (
        <p className="styling-text">
          <strong>הערות ספציפיות:</strong> {notes}
        </p>
      )}

      {isUrgent && (
        <p className="urgent-text">
          ⚠️ דחוף - נא לתת עדיפות!
        </p>
      )}
    </div>
  );
}