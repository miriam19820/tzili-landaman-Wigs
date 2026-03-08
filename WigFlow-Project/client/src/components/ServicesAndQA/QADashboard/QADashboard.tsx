import React, { useState, useEffect } from 'react';
import { RejectionModal } from '../RejectionModal'; // ייבוא המודאל שיצרת

interface IQATask {
  _id: string;
  customer: { name: string };
  serviceType: string;
  origin: 'Service' | 'NewWig' | 'Repair';
  status: string;
}

export const QADashboard: React.FC = () => {
  const [tasks, setTasks] = useState<IQATask[]>([]);
  
  // --- כאן הוספתי את ה-STATE החדש ---
  const [isModalOpen, setIsModalOpen] = useState(false); // האם המודאל פתוח?
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null); // איזו פאה בחרנו לפסול?

  useEffect(() => {
    const mockTasks: IQATask[] = [
      { _id: '1', customer: { name: 'מרים כהן' }, serviceType: 'חפיפה וסירוק', origin: 'Service', status: 'בבדיקה' },
      { _id: '2', customer: { name: 'חנה לוי' }, serviceType: 'בקרת ייצור', origin: 'NewWig', status: 'בבדיקה' }
    ];
    setTasks(mockTasks);
  }, []);

  // פונקציה לפתיחת המודאל
  const openRejectionModal = (task: IQATask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // פונקציה שמופעלת כשהמבקרת מאשרת את הפסילה בתוך המודאל
  const handleRejectConfirm = (reason: string) => {
    console.log(`פסילת פאה ${selectedTask?._id} מסיבת: ${reason}`);
    // כאן יבוא ה-API של ה-Reject בשבוע 4
    setIsModalOpen(false); // סגירת המודאל
    setTasks(tasks.filter(t => t._id !== selectedTask?._id)); // הסרה מהרשימה
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <h1>ניהול בקרת איכות</h1>
      
      <table>
        {/* ... הראש של הטבלה ... */}
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>{task.customer.name}</td>
              <td>
                <button onClick={() => console.log('Approved')}>אישור</button>
                
                {/* לחיצה כאן פותחת את המודאל */}
                <button 
                  style={{ backgroundColor: 'red', color: 'white' }}
                  onClick={() => openRejectionModal(task)}
                >
                  החזרה לתיקון
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- כאן אנחנו "שותלים" את המודאל בתוך הדף --- */}
      <RejectionModal 
        isOpen={isModalOpen} 
        customerName={selectedTask?.customer.name || ''}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}