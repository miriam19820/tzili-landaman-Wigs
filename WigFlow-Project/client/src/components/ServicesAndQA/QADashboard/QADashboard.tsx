import React, { useState, useEffect } from 'react';
import { RejectionModal } from '../RejectionModal'; 
import axios from 'axios'; 
import './QADashboard.css';

interface IQATask {
  _id: string;
  wigCode: string;    
  customerName: string; 
  overallStatus: string;
}

export const QADashboard: React.FC = () => {
  const [tasks, setTasks] = useState<IQATask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null);

  const fetchQAItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/repairs/dashboard-view');
      
      const qaItems = response.data.data.filter((item: any) => 
        item.overallStatus === 'בבקרה'
      );
      
      setTasks(qaItems);
    } catch (err) {
      console.error("שגיאה במשיכת נתונים מהשרת", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQAItems();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/repairs/update-status/${id}`, { status: 'מוכן' });
      alert("הפאה אושרה בהצלחה ועברה לסטטוס 'מוכן'! ✅");
      fetchQAItems(); 
    } catch (err) {
      alert("שגיאה בעדכון הסטטוס");
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedTask) return;
    try {
      console.log(`פסילת פאה ${selectedTask.wigCode} מסיבת: ${reason}`);
      setIsModalOpen(false);
      fetchQAItems();
    } catch (err) {
      alert("שגיאה בביצוע הפסילה");
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>טוען נתוני בקרה מהשרת... ⏳</div>;

  return (
    <div className="qa-dashboard-container" dir="rtl">
      <h1 className="qa-title">ניהול בקרת איכות (QA)</h1>
      
      <table className="qa-table">
        <thead>
          <tr>
            <th>קוד פאה</th>
            <th>שם לקוחה</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>{task.wigCode}</td>
              <td>{task.customerName}</td>
              <td>
                <button className="btn-approve" onClick={() => handleApprove(task._id)}>אישור סופי ✅</button>
                <button className="btn-reject" onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}>
                  החזרה לתיקון ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RejectionModal 
        isOpen={isModalOpen} 
        customerName={selectedTask?.customerName || ''}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}