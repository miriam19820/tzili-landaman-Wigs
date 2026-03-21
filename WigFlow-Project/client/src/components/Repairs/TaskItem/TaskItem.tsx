import React, { useState } from 'react';
import axios from 'axios';
import './TaskItem.css';

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
  onComplete: (repairId: string, taskIndex: number) => Promise<void>;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCompleteClick = async () => {
    setIsUpdating(true);
    try {
      const response = await axios.patch(`/repairs/${task.repairId}/task/${task.taskIndex}`, {
        status: 'בוצע'
      });

      const result = response.data;
      
      // אם השרת החזיר שכל התיקונים הסתיימו
      if (result.message && result.message.includes('הסתיימו')) {
        alert("כל התיקונים לפאה זו הושלמו! היא הועברה לחפיפה ובקרה. ");
      }
      
      await onComplete(task.repairId, task.taskIndex);
      
    } catch (error: any) {
      alert(`שגיאה מול השרת: ${error.response?.data?.message || 'לא ניתן לעדכן את הסטטוס'}`);
      console.error("Network error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

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
        onClick={handleCompleteClick}
        disabled={isUpdating}
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