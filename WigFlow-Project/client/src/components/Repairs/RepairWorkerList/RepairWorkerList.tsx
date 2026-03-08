import React, { useState, useEffect } from 'react';
import { TaskItem, WorkerTask } from '../TaskItem/TaskItem';

interface RepairWorkerListProps {
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

    // שליפת פרטי המשתמש מה-localStorage כדי לדעת אם מדובר במנהלת
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isAdmin = user?.role === 'Admin';

    try {
      // אם המשתמש הוא אדמין, נבקש את תצוגת הלוח הכללי (Dashboard). אחרת - רק משימות אישיות.
      const endpoint = isAdmin 
        ? `http://localhost:3000/api/repairs/dashboard-view` 
        : `http://localhost:3000/api/repairs/worker-tasks/${workerId}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('שגיאה בתקשורת מול השרת');
      
      const result = await response.json();
      
      if (result.success) {
        // במידה ואדמין צופה, נבצע התאמה (Mapping) של נתוני ה-Dashboard למבנה של TaskItem
        const displayData = isAdmin 
          ? result.data.map((item: any) => ({
              repairId: item._id,
              wigCode: item.wigCode,
              customerName: item.customerName,
              isUrgent: item.isUrgent,
              category: item.overallStatus, // מציג "בתיקון"/"בחפיפה" וכו'
              subCategory: item.currentStation, // מציג את השלב הספציפי (למשל: "גוונים")
              notes: `משובץ ל: ${item.assignedTo || 'טרם נקבע'}`,
              status: 'ממתין'
            }))
          : result.data;

        setTasks(displayData);
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
        // הסרת המשימה מהרשימה המקומית מיד לאחר ההצלחה
        setTasks(prevTasks => prevTasks.filter(t => !(t.repairId === repairId && t.taskIndex === taskIndex)));
        console.log('המשימה עודכנה בהצלחה!');
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

  // זיהוי כותרת לפי תפקיד
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const title = user.role === 'Admin' ? 'ניהול תיקונים - מבט על 📋' : 'סביבת העבודה שלי ✂️';

  return (
    <div dir="rtl" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#6f42c1', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        {title}
      </h2>
      
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
          <h3>{user.role === 'Admin' ? 'אין כרגע תיקונים פעילים במערכת.' : 'איזה כיף! אין לך משימות פתוחות כרגע. 🎉'}</h3>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 'bold', color: '#555' }}>
            {user.role === 'Admin' ? `סה"כ פאות בטיפול: ${tasks.length}` : `סה"כ משימות ממתינות לך: ${tasks.length}`}
          </p>
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