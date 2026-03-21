import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Task {
  category: string;
  subCategory: string;
  assignedTo: string;
  status: string;
  notes: string;
}

interface RepairTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  task: Task;
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
    <div dir="rtl" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>
        תחנת תיקונים - משימות פתוחות
      </h2>
      
      {tasks.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginTop: '40px' }}>
          אין לך משימות פתוחות כרגע. עבודה נעימה! 🎉
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          {tasks.map((taskData) => (
            <div 
              key={`${taskData.repairId}-${taskData.taskIndex}`} 
              style={{ 
                border: taskData.isUrgent ? '2px solid red' : '1px solid #ddd', 
                padding: '15px', 
                borderRadius: '8px',
                backgroundColor: taskData.isUrgent ? '#fffafa' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>
                  פאה קוד: {taskData.wigCode} 
                  {taskData.isUrgent ? <span style={{ color: 'red', marginLeft: '10px' }}> 🔴 דחוף!</span> : null}
                </h3>
                <span style={{ fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '4px' }}>
                  לקוחה: {taskData.customerName}
                </span>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0' }}><strong>סוג תיקון:</strong> {taskData.task.category} - {taskData.task.subCategory}</p>
                {taskData.task.notes ? <p style={{ margin: '5px 0', color: '#666' }}><strong>הערות:</strong> {taskData.task.notes}</p> : null}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleStatusUpdate(taskData.repairId, taskData.taskIndex, 'בוצע')}
                  style={{ 
                    padding: '8px 15px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  סיום משימה ✅
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};