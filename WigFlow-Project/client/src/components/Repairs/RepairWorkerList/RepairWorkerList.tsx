<<<<<<< HEAD
import React, { useEffect, useState } from 'react';

interface Task {
  _id: string;
  category: string;
  subCategory: string;
  status: 'ממתין' | 'בוצע';
  notes: string;
}

interface RepairWithTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  task: Task;
}

interface Props {
  workerId: string;
}

export const RepairWorkerList: React.FC<Props> = ({ workerId }) => {
  const [tasks, setTasks] = useState<RepairWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/repairs/worker-tasks/${workerId}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (error) {
      console.error('שגיאה בשליפת משימות', error);
    } finally {
      setLoading(false);
=======
import React, { useState, useEffect } from 'react';
import { TaskItem, WorkerTask } from '../TaskItem/TaskItem';
import './RepairWorkerList.css';
interface RepairWorkerListProps {
  workerId: string; 
}

export const RepairWorkerList: React.FC<RepairWorkerListProps> = ({ workerId }) => {
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // משיכת המשימות מהשרת - חיבור ל-API של מפתחת #3 
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isAdmin = user?.role === 'Admin';

    try {
      // ניתוב חכם: אדמין רואה הכל (דשבורד), עובדת רואה רק את משימותיה האישיות
      const endpoint = isAdmin 
        ? `http://localhost:3000/api/repairs/dashboard-view` 
        : `http://localhost:3000/api/repairs/worker-tasks/${workerId}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('שגיאה בתקשורת מול השרת');
      
      const result = await response.json();
      
      if (result.success) {
        // התאמת נתונים לתצוגה אחידה ב-TaskItem
        const displayData = isAdmin 
          ? result.data.map((item: any) => ({
              repairId: item._id,
              wigCode: item.wigCode,
              customerName: item.customerName,
              isUrgent: item.isUrgent,
              category: item.overallStatus, // מציג את הסטטוס הכללי (למשל: "בתיקון")
              subCategory: item.currentStation, // מציג את התחנה הנוכחית
              notes: `משובץ ל: ${item.assignedTo || 'טרם נקבע'}`,
              status: 'ממתין'
            }))
          : result.data;

        // מיון משימות: משימות דחופות תמיד יופיעו בראש הרשימה
        const sortedTasks = [...displayData].sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent));
        setTasks(sortedTasks);
      } else {
        throw new Error(result.message || 'שגיאה בשליפת המשימות');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    if (workerId) fetchTasks();
  }, [workerId]);

  const handleComplete = async (repairId: string, taskIndex: number) => {
    try {
      await fetch(`http://localhost:3000/api/repairs/${repairId}/task/${taskIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'בוצע' })
      });
      fetchTasks();
    } catch (error) {
      console.error('שגיאה בעדכון משימה', error);
    }
  };

  if (loading) return <div dir="rtl" style={{ padding: '20px' }}>טוען משימות...</div>;

  return (
    <div dir="rtl" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>המשימות שלי</h2>

      {tasks.length === 0 ? (
        <p style={{ color: '#6c757d', textAlign: 'center', marginTop: '40px' }}>אין משימות פתוחות כרגע ✅</p>
      ) : (
        tasks.map((item) => (
          <div key={item.repairId + item.taskIndex} style={{
            border: `2px solid ${item.isUrgent ? '#dc3545' : '#dee2e6'}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px',
            background: item.isUrgent ? '#fff5f5' : '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {item.isUrgent && <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '10px' }}>🔴 דחוף</span>}
                <strong>{item.wigCode}</strong> — {item.customerName}
              </div>
              <span style={{ background: '#6f42c1', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {item.task.category}
              </span>
            </div>
            <div style={{ marginTop: '10px', color: '#495057' }}>
              משימה: <strong>{item.task.subCategory}</strong>
              {item.task.notes && <span style={{ marginRight: '10px', color: '#6c757d' }}>({item.task.notes})</span>}
            </div>
            <button
              onClick={() => handleComplete(item.repairId, item.taskIndex)}
              style={{ marginTop: '10px', padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              סמני כבוצע ✓
            </button>
          </div>
        ))
      )}
    </div>
  );
};
=======
    if (workerId) {
      fetchTasks();
    }
  }, [workerId]);

  // פונקציה לעדכון ה-UI לאחר שהעובדת לחצה על "סיימתי" ב-TaskItem 
  const handleTaskComplete = async (repairId: string, taskIndex: number) => {
    // הסרת המשימה שבוצעה מהרשימה המקומית מיד (Optimistic Update)
    setTasks(prevTasks => prevTasks.filter(t => !(t.repairId === repairId && t.taskIndex === taskIndex)));
    console.log(`משימה ${taskIndex} בתיקון ${repairId} סומנה כבוצעה בהצלחה.`);
    
    // במידה ורוצים לראות אם נוספו משימות אוטומטיות כמו חפיפה או בקרה, ניתן לרענן את הרשימה מהשרת
    // fetchTasks(); 
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '20px' }}>טוען משימות עבודה... ⏳</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>שגיאה: {error}</div>;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const title = user.role === 'Admin' ? 'מעקב תיקונים כללי - מבט על 📋' : 'רשימת המשימות האישית שלי ✂️';

  return (
    <div dir="rtl" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px' }}>
      <header style={{ 
        borderBottom: '2px solid #6f42c1', 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '10px'
      }}>
        <h2 style={{ color: '#6f42c1', margin: 0 }}>{title}</h2>
        <button 
          onClick={fetchTasks} 
          style={{ 
            background: 'none', 
            border: '1px solid #ccc', 
            cursor: 'pointer', 
            borderRadius: '4px', 
            padding: '5px 15px',
            fontWeight: 'bold'
          }}
        >
          🔄 רענן רשימה
        </button>
      </header>
      
      {tasks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          color: '#666' 
        }}>
          <h3>אין כרגע משימות פתוחות לביצוע. 🎉</h3>
        </div>
      ) : (
        <div className="tasks-container">
          <p style={{ fontWeight: 'bold', color: '#555', marginBottom: '15px' }}>
             נמצאו {tasks.length} משימות הממתינות לטיפולך:
          </p>
          {tasks.map((task, index) => (
            <TaskItem 
              key={`${task.repairId}-${task.taskIndex || index}`} 
              task={task} 
              onComplete={handleTaskComplete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
