import React, { useState } from 'react';
import './TaskItem.css';

// הגדרת הממשק (Interface) של המשימה כפי שתחזור מהשרת [cite: 1, 10]
export interface WorkerTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  category: string;
  subCategory: string;
  notes: string;
  status: string;
}

interface TaskItemProps {
  task: WorkerTask;
  // פונקציה לעדכון הרשימה באבא (RepairWorkerList) לאחר סיום מוצלח [cite: 25]
  onComplete: (repairId: string, taskIndex: number) => Promise<void>;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // פונקציה מרכזית לעדכון סטטוס משימה ל"בוצע" בשרת [cite: 17, 37]
  const handleCompleteClick = async () => {
    setIsUpdating(true); // מפעיל מצב טעינה בכפתור
    try {
      // קריאה לנתיב ה-PATCH שהוגדר ב-repairRouter [cite: 37]
      const response = await fetch(`http://localhost:3000/api/repairs/${task.repairId}/task/${task.taskIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'בוצע' }) // עדכון סטטוס משימה ספציפית [cite: 17, 37]
      });

      const result = await response.json();
      if (response.ok) {
        // אם השרת החזיר שכל התיקונים הסתיימו
        if (result.message && result.message.includes('הסתיימו')) {
          alert("כל התיקונים לפאה זו הושלמו! היא הועברה לחפיפה ובקרה. ✨");
        }
        // עדכון ה-UI (הסרת המשימה מהרשימה) [cite: 17]
        await onComplete(task.repairId, task.taskIndex);
      } else {
        // טיפול בשגיאות לוגיות מהשרת
        alert(`שגיאה מהשרת: ${result.message || 'לא ניתן לעדכן את הסטטוס'}`);
      }
    } catch (error) {
      // טיפול בשגיאות רשת
      alert("חלה שגיאה בעדכון המשימה");
      console.error("Network error:", error);
    } finally {
      setIsUpdating(false); // מחזיר את הכפתור למצב רגיל
    }
  };

  // עיצוב דינמי: משימות דחופות נצבעות באדום בולט (דרישת שבוע 4) [cite: 31, 66]
  const cardStyle: React.CSSProperties = {
    border: task.isUrgent ? '2px solid #dc3545' : '1px solid #e0e0e0',
    backgroundColor: task.isUrgent ? '#fff8f8' : '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={cardStyle} className="task-item-card animate-in">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            {task.category} - {task.subCategory}
          </h3>
          {/* תגית "דחוף" בולטת לסימון משימות בעדיפות גבוהה [cite: 31, 66] */}
          {task.isUrgent && (
            <span style={{ 
              backgroundColor: '#dc3545', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 'bold' 
            }}>
              דחוף! 🔴
            </span>
          )}
        </div>
        
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
          <strong>קוד פאה:</strong> {task.wigCode} | <strong>לקוחה:</strong> {task.customerName}
        </p>
        
        {/* הצגת הערות המזכירה מהדיאגנוזה [cite: 22] */}
        {task.notes && (
          <p style={{ 
            margin: '8px 0 0 0', 
            padding: '8px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px', 
            fontSize: '14px', 
            color: '#666', 
            borderRight: '3px solid #6f42c1' 
          }}>
            <strong>הערות:</strong> {task.notes}
          </p>
        )}
      </div>

      <button 
        onClick={handleCompleteClick} // קריאה לפונקציה המאוחדת
        disabled={isUpdating} // מניעת לחיצות כפולות בזמן עדכון
        style={{
          backgroundColor: isUpdating ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isUpdating ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
      >
        {isUpdating ? 'מעדכן...' : 'סיימתי ✔'}
      </button>
    </div>
  );
};