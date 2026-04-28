import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; 
import axios from 'axios';

interface RepairTask {
  repairId: string;
  type: 'Repair' | 'NewWig'; 
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  description: string; 
  createdAt: string;
}

export const RepairWorkerList: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>(); 
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId) {
      fetchTasks();
    }
  }, [workerId]);

  const fetchTasks = async () => {
    if (!workerId) {
      console.error("No workerId found in URL");
      return; 
    }
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/repairs/worker-tasks/${workerId}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks', error);
      alert('שגיאה בטעינת המשימות');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, taskIndex: number, type: string) => {
    try {
      if (type === 'Repair') {
        const res = await axios.patch(`http://localhost:3000/api/repairs/${taskId}/task/${taskIndex}`, {
          status: 'בוצע'
        });
        if (res.data.success) {
          alert(res.data.message || 'המשימה עודכנה!');
          fetchTasks();
        }
      } 
      else {
        const res = await axios.patch(`http://localhost:3000/api/wigs/${taskId}/next-step`);
        if (res.data.success) {
          alert('הפאה עברה לשלב הבא בייצור!');
          fetchTasks();
        }
      }
    } catch (error) {
      console.error('Error updating task status', error);
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>טוען רשימת משימות מאוחדת... ⏳</div>;
  }

  return (
    <div dir="rtl" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px', color: '#6f42c1' }}>
        📋 התחנה שלי - משימות לביצוע
      </h2>
      
      {tasks.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginTop: '40px' }}>
          אין לך משימות פתוחות (ייצור או תיקונים) כרגע. עבודה נעימה! 🎉
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          {tasks.map((taskData) => (
            <div 
             key={taskData.repairId || taskData.wigCode + taskData.taskIndex}
              style={{ 
                padding: '15px', 
                borderRadius: '12px',
                border: taskData.isUrgent ? '2px solid #ff4d4d' : '1px solid #ddd', 
                backgroundColor: taskData.isUrgent ? '#fff5f5' : '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              
              <span style={{
                position: 'absolute',
                left: '15px',
                top: '15px',
                fontSize: '0.8rem',
                padding: '3px 8px',
                borderRadius: '15px',
                background: taskData.type === 'Repair' ? '#d63384' : '#16a34a',
                color: 'white'
              }}>
                {taskData.type === 'Repair' ? '🛠️ תיקון' : '✨ ייצור חדש'}
              </span>

              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: taskData.isUrgent ? '#d00' : '#333' }}>
                   פאה: {taskData.wigCode} 
                  {taskData.isUrgent && <span style={{ marginRight: '10px' }}>🔴 דחוף!</span>}
                </h3>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>לקוחה: {taskData.customerName}</p>
              </div>
              
              <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}><strong>תיאור עבודה:</strong> {taskData.description}</p>
              </div>
              
              <button 
                onClick={() => handleStatusUpdate(taskData.repairId, taskData.taskIndex, taskData.type)}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                סיימתי משימה ועוברת לבאה ✅
              </button>
            </div>
          ))} 
        </div>
      )}
    </div>
  );
}