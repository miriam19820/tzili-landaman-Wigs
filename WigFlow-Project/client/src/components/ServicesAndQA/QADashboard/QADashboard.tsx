import React, { useState, useEffect } from 'react';
import { RejectionModal } from '../RejectionModal/RejectionModal'; 
import './QADashboard.css';
import axios from 'axios';

interface IQATask {
  _id: string;
  customer?: { firstName: string, lastName: string };
  serviceType: string;
  origin: 'Service' | 'NewWig' | 'Repair';
  status: string;
}

export const QADashboard: React.FC = () => {
  const [tasks, setTasks] = useState<IQATask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQATasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/services/qa-tasks');
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת משימות בקרת איכות', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQATasks();
  }, []);

  const openRejectionModal = (task: IQATask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleApprove = async (taskId: string) => {
    if (!window.confirm('האם את בטוחה שאת רוצה לאשר פאה זו כראויה ללקוחה?')) return;
    
    try {
      await axios.patch(`/services/${taskId}/approve`);
      alert('הפאה אושרה בהצלחה והלקוחה תעודכן! ✅');
      fetchQATasks(); 
    } catch (error) {
      alert('שגיאה באישור הפאה.');
    }
  };

  // התיקון שלנו: מקבל גם את סיבת הפסילה וגם את התחנות שנבחרו!
  const handleRejectConfirm = async (reason: string, returnStages: string[]) => {
    if (!selectedTask) return;
    
    try {
      // עכשיו הלקוח שולח לשרת גם את רשימת התחנות החוזרות
      await axios.patch(`/services/${selectedTask._id}/reject`, { 
        qaNote: reason,
        returnStages: returnStages 
      });
      
      alert(`הפאה נפסלה והוחזרה בהצלחה לתחנות: ${returnStages.join(', ')} ❌`);
      setIsModalOpen(false);
      fetchQATasks(); 
    } catch (error) {
      console.error(error);
      alert('שגיאה בפסילת הפאה.');
    }
  };

  return (
    <div className="qa-dashboard-container" dir="rtl">
      <h1 className="qa-title">ניהול בקרת איכות (QA) 🔍</h1>
      
      {loading ? (
        <p style={{ textAlign: 'center' }}>טוען פאות בבדיקה...</p>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '1.2rem', color: '#666' }}>
          <h3>אין כרגע פאות שממתינות לבקרת איכות. 🎉</h3>
        </div>
      ) : (
        <table className="qa-table">
          <thead>
            <tr>
              <th>שם לקוחה</th>
              <th>סוג שירות/ייצור</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id}>
                <td>{task.customer ? `${task.customer.firstName} ${task.customer.lastName}` : 'לקוחה לא ידועה'}</td>
                <td>{task.serviceType}</td>
                <td>
                  <button className="btn-approve" onClick={() => handleApprove(task._id)}>
                    אישור סופי ✅
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => openRejectionModal(task)}
                  >
                    פסילה והחזרה לתיקון ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RejectionModal 
        isOpen={isModalOpen} 
        customerName={selectedTask?.customer ? `${selectedTask.customer.firstName} ${selectedTask.customer.lastName}` : ''}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}