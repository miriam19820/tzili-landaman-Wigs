import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RepairWorkerList.css'; 

interface Task {
  category: string;
  subCategory: string;
  assignedTo: string;
  status: string;
  notes: string;
  deadline?: string;
}

interface RepairTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  task: Task;
  internalNote?: string; 
  images?: string[];    
}

interface RepairWorkerListProps {
  workerId: string;
}

export const RepairWorkerList: React.FC<RepairWorkerListProps> = ({ workerId }) => {
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [workerId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/repairs/worker-tasks/${workerId}`);
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

  const handleStatusUpdate = async (repairId: string, taskIndex: number, newStatus: string) => {
    try {
      const res = await axios.patch(`/repairs/${repairId}/task/${taskIndex}`, {
        status: newStatus
      });
      
      if (res.data.success) {
        fetchTasks();
        if (res.data.message) {
          alert(res.data.message); 
        }
      }
    } catch (error) {
      console.error('Error updating task status', error);
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>טוען משימות...</div>;
  }

  return (
    <div dir="rtl" style={{ maxWidth: '900px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>
        תחנת תיקונים - משימות פתוחות
      </h2>
      
      {tasks.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginTop: '40px' }}>
          אין לך משימות פתוחות כרגע. עבודה נעימה! 🎉
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          {tasks.map((taskData) => (
            <div 
              key={`${taskData.repairId}-${taskData.taskIndex}`} 
              style={{ 
                border: taskData.isUrgent ? '2px solid red' : '1px solid #ddd', 
                padding: '20px', 
                borderRadius: '12px',
                backgroundColor: taskData.isUrgent ? '#fffafa' : '#fff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  פאה קוד: {taskData.wigCode} 
                  {taskData.isUrgent ? <span style={{ color: 'red', marginRight: '10px' }}> 🔴 דחוף!</span> : null}
                </h3>
                <span style={{ fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  לקוחה: {taskData.customerName}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '15px' }}>
                {/* הצגת תמונות "לפני" לעובדת */}
                {taskData.images && taskData.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {taskData.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt="לפני התיקון" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #ccc' }}
                        onClick={() => window.open(img, '_blank')}
                        title="לחצי להגדלה"
                      />
                    ))}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '250px' }}>
                  <p style={{ margin: '5px 0', fontSize: '1.1rem' }}><strong>סוג תיקון:</strong> {taskData.task.category} - {taskData.task.subCategory}</p>
                  
                  {/* הצגת הערה פנימית מהמזכירה בצורה בולטת */}
                  {taskData.internalNote && (
                    <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#fff3cd', borderRight: '4px solid #ffc107', borderRadius: '4px' }}>
                      <strong>📝 הערת אבחון (מזכירה):</strong>
                      <p style={{ margin: '5px 0', color: '#856404' }}>{taskData.internalNote}</p>
                    </div>
                  )}

                  {taskData.task.notes && (
                    <p style={{ margin: '5px 0', color: '#666' }}><strong>הערות נוספות:</strong> {taskData.task.notes}</p>
                  )}
                  
                  {taskData.task.deadline && (
                    <p style={{ margin: '5px 0', color: '#d9534f' }}>
                      <strong>📅 תאריך יעד:</strong> {new Date(taskData.task.deadline).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <button 
                  onClick={() => handleStatusUpdate(taskData.repairId, taskData.taskIndex, 'בוצע')}
                  style={{ 
                    padding: '10px 25px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                >
                  סיום משימה ועדכון מערכת ✅
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};