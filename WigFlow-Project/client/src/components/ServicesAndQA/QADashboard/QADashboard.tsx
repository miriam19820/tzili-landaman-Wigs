import React, { useState, useEffect } from 'react';
import { RejectionModal } from '../RejectionModal'; 
import './QADashboard.css'; // הייבוא של העיצוב ששמנו למעלה

interface IQATask {
  _id: string;
  customer: { name: string };
  serviceType: string;
  origin: 'Service' | 'NewWig' | 'Repair';
  status: string;
}

export const QADashboard: React.FC = () => {
  const [tasks, setTasks] = useState<IQATask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null);

  useEffect(() => {
    const mockTasks: IQATask[] = [
      { _id: '1', customer: { name: 'מרים כהן' }, serviceType: 'חפיפה וסירוק', origin: 'Service', status: 'בבדיקה' },
      { _id: '2', customer: { name: 'חנה לוי' }, serviceType: 'בקרת ייצור', origin: 'NewWig', status: 'בבדיקה' }
    ];
    setTasks(mockTasks);
  }, []);

  const openRejectionModal = (task: IQATask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    console.log(`פסילת פאה ${selectedTask?._id} מסיבת: ${reason}`);
    setIsModalOpen(false);
    setTasks(tasks.filter(t => t._id !== selectedTask?._id));
  };

  return (
    <div className="qa-dashboard-container">
      <h1 className="qa-title">ניהול בקרת איכות</h1>
      
      <table className="qa-table">
        <thead>
          <tr>
            <th>שם לקוחה</th>
            <th>סוג שירות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>{task.customer.name}</td>
              <td>{task.serviceType}</td>
              <td>
                <button className="btn-approve" onClick={() => console.log('Approved')}>אישור</button>
                <button 
                  className="btn-reject"
                  onClick={() => openRejectionModal(task)}
                >
                  החזרה לתיקון
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RejectionModal 
        isOpen={isModalOpen} 
        customerName={selectedTask?.customer.name || ''}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}