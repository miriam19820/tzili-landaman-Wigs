import React from 'react';

interface IStylingProps {
  category: string;
  notes?: string;
  isUrgent?: boolean;
}

export const StylingInstructions: React.FC<IStylingProps> = ({ category, notes, isUrgent }) => {
  return (
    <div style={{ 
      padding: '15px', 
      border: isUrgent ? '2px solid red' : '1px solid #ccc', 
      borderRadius: '8px', 
      backgroundColor: '#fefefe',
      marginTop: '10px' 
    }}>
      <h3 style={{ color: '#333', marginTop: 0 }}>הוראות עיצוב לסורקת:</h3>
      <p><strong>סגנון מבוקש:</strong> {category}</p>
      {notes && <p><strong>הערות ספציפיות:</strong> {notes}</p>}
      {isUrgent && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ דחוף - נא לתת עדיפות!</p>}
    </div>
  );
}