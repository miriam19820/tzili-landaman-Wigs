import React, { useState, useEffect } from 'react';
import { TaskItem, WorkerTask } from '../TaskItem/TaskItem';

interface RepairWorkerListProps {
  // בפרויקט אמיתי ה-ID הזה יגיע מה-AuthContext של העובדת שהתחברה הרגע
  workerId: string; 
}

export const RepairWorkerList: React.FC<RepairWorkerListProps> = ({ workerId }) => {
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // משיכת המשימות מהשרת
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/repairs/worker-tasks/${workerId}`);
      if (!response.ok) throw new Error('שגיאה בתקשורת מול השרת');
      
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
      } else {
        throw new Error(result.message || 'שגיאה בשליפת המשימות');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchTasks();
    }
  }, [workerId]);

  // פונקציה לעדכון סטטוס משימה ל"בוצע"
  const handleTaskComplete = async (repairId: string, taskIndex: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/repairs/${repairId}/task/${taskIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'בוצע' })
      });

      const result = await response.json();
      
      if (result.success) {
        // הסרת המשימה מהרשימה המקומית מיד לאחר ההצלחה (כדי לא לעשות רענון מיותר לשרת)
        setTasks(prevTasks => prevTasks.filter(t => !(t.repairId === repairId && t.taskIndex === taskIndex)));
        
        // אופציונלי: אפשר להוסיף פה הודעת Toast קופצת
        console.log('המשימה עודכנה בהצלחה והפאה הועברה הלאה במידת הצורך!');
      } else {
        alert('שגיאה בעדכון המשימה: ' + result.message);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('חלה שגיאה בתקשורת בעת עדכון המשימה.');
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '20px' }}>טוען משימות... ⏳</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>שגיאה: {error}</div>;

  return (
    <div dir="rtl" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#6f42c1', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        סביבת העבודה שלי ✂️
      </h2>
      
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
          <h3>איזה כיף! אין לך משימות פתוחות כרגע. 🎉</h3>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 'bold', color: '#555' }}>סה"כ משימות ממתינות: {tasks.length}</p>
          {tasks.map(task => (
            <TaskItem 
              key={`${task.repairId}-${task.taskIndex}`} 
              task={task} 
              onComplete={handleTaskComplete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};