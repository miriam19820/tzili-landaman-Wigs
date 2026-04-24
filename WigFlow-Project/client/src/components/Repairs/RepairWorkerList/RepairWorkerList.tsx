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

  useEffect(() => { fetchTasks(); }, [workerId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/repairs/worker-tasks/${workerId}`);
      if (res.data.success) setTasks(res.data.data);
    } catch {
      alert('שגיאה בטעינת המשימות');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (repairId: string, taskIndex: number) => {
    try {
      const res = await axios.patch(`/repairs/${repairId}/task/${taskIndex}`, { status: 'בוצע' });
      if (res.data.success) {
        fetchTasks();
        if (res.data.message) alert(res.data.message);
      }
    } catch {
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const text = date.toLocaleDateString('he-IL');
    if (date < today) return { text: `${text} — באיחור`, cls: 'overdue' };
    if (date.getTime() === today.getTime()) return { text: `${text} — להיום`, cls: 'today' };
    return { text, cls: '' };
  };

  if (loading) return <div className="repair-loading">טוען משימות...</div>;

  return (
    <div className="repair-station-container" dir="rtl">
      <div className="repair-station-header">
        <h2>תחנת תיקונים — משימות פתוחות</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="repair-empty">
          <p>אין משימות פתוחות כרגע</p>
        </div>
      ) : (
        <div className="repair-tasks-grid">
          {tasks.map((taskData) => (
            <div
              key={`${taskData.repairId}-${taskData.taskIndex}`}
              className={`repair-task-card ${taskData.isUrgent ? 'urgent' : ''}`}
            >
              {/* Header */}
              <div className="repair-card-header">
                <div className="repair-card-title">
                  <h3>תיקון</h3>
                  <span className="repair-wig-code">{taskData.wigCode}</span>
                  {taskData.isUrgent && <span className="repair-urgent-badge">דחוף</span>}
                </div>
                <span className="repair-customer-pill">{taskData.customerName}</span>
              </div>

              {/* Body */}
              <div className="repair-card-body">
                {taskData.images && taskData.images.length > 0 && (
                  <div className="repair-images">
                    {taskData.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="לפני התיקון"
                        className="repair-image-thumb"
                        onClick={() => window.open(img, '_blank')}
                        title="לחצי להגדלה"
                      />
                    ))}
                  </div>
                )}

                <div className="repair-task-details">
                  <div className="repair-task-type">
                    {taskData.task.category} — <span>{taskData.task.subCategory}</span>
                  </div>

                  {taskData.internalNote && (
                    <div className="repair-detail-box note">
                      <div className="repair-detail-label">הערת אבחון</div>
                      <p>{taskData.internalNote}</p>
                    </div>
                  )}

                  {taskData.task.notes && (
                    <div className="repair-detail-box instructions">
                      <div className="repair-detail-label">הוראות ביצוע</div>
                      <p>{taskData.task.notes}</p>
                    </div>
                  )}

                  {taskData.task.deadline && (() => {
                    const dl = formatDeadline(taskData.task.deadline!);
                    return (
                      <div className="repair-detail-box deadline">
                        <div className="repair-detail-label">תאריך יעד</div>
                        <span className={`deadline-value ${dl.cls}`}>{dl.text}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="repair-card-footer">
                <button
                  className="btn-complete-repair"
                  onClick={() => handleStatusUpdate(taskData.repairId, taskData.taskIndex)}
                >
                  סיימתי — העבר לבקרה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
