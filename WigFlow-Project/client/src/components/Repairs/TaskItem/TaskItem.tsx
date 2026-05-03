import React, { useState } from 'react';
import axios from 'axios';
import './TaskItem.css';

export interface WorkerTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  type: 'חדשה' | 'תיקון';
  imageUrl?: string; 
  internalNote?: string; 
  deadline?: string;
  category?: string;
  subCategory?: string;
  notes?: string;
  qaNote?: string;            
  qaRejectionPhoto?: string;
  subCategories?: string[];
  groupedNotes?: string[];
  taskIndexes?: number[];
  taskIndex?: number; 
}

interface TaskItemProps {
  task: WorkerTask;
  onComplete: (repairId: string, taskIndex?: number) => Promise<void>;
  onOpenSpecs?: () => void; 
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onOpenSpecs }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImageFull, setShowImageFull] = useState(false);
  const [showRejectionImageFull, setShowRejectionImageFull] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleCompleteClick = async () => {
    // חסימת כפילויות לחיצה
    if (isUpdating) return; 
    setIsUpdating(true);
    
    try {
      if (task.type === 'חדשה') {
          // שימוש בכתובת המלאה של השרת!
          const response = await axios.patch(`http://localhost:5000/api/wigs/${task.repairId}/next-step`, {}, {
              headers: getAuthHeader()
          });
          
          const updatedWig = response.data;
          const nextStage = updatedWig.currentStage || 'לא ידוע';
          const nextWorkers = updatedWig.assignedWorkers && updatedWig.assignedWorkers.length > 0 
               ? updatedWig.assignedWorkers.map((w: any) => w.username || w.fullName || 'לא ידוע').join(', ') 
               : 'לא שובץ';
               
          alert(`המשימה הושלמה בהצלחה!\nהתחנה הבאה: ${nextStage}\nאחראית: ${nextWorkers}`);
          await onComplete(task.repairId); 
       } else {
          let lastMessage = "המשימה עודכנה בהצלחה";
          if (task.taskIndexes && task.taskIndexes.length > 0) {
              for (const index of task.taskIndexes) {
                  // שימוש בכתובת המלאה של השרת!
                  const response = await axios.patch(`http://localhost:5000/api/repairs/${task.repairId}/task/${index}`, {
                    status: 'בוצע'
                  }, { headers: getAuthHeader() });
                  if (response.data.message) lastMessage = response.data.message;
              }
          } else if (task.taskIndex !== undefined) {
              // שימוש בכתובת המלאה של השרת!
              const response = await axios.patch(`http://localhost:5000/api/repairs/${task.repairId}/task/${task.taskIndex}`, { 
                 status: 'בוצע' 
              }, { headers: getAuthHeader() });
              if (response.data.message) lastMessage = response.data.message;
          }
          alert(`הצלחה: ${lastMessage}`);
          await onComplete(task.repairId, task.taskIndexes ? task.taskIndexes[0] : task.taskIndex);
      }
    } catch (error: any) {
      console.error("Complete task error:", error);
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאה כללית'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDeadline = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let color = '#64748b'; 
    let text = date.toLocaleDateString('he-IL');
    
    if (date < today) { color = '#ef4444'; text += ' (איחור!)'; }
    else if (date.getTime() === today.getTime()) { color = '#f59e0b'; text += ' (היום)'; }
    
    return <span style={{ color, fontWeight: 'bold' }}>{text}</span>;
  };

  return (
    <>
      {showImageFull && task.imageUrl && (
        <div className="task-image-overlay" onClick={() => setShowImageFull(false)}>
            <img src={task.imageUrl} alt="מקור" />
        </div>
      )}

      {showRejectionImageFull && task.qaRejectionPhoto && (
        <div className="task-image-overlay qa-overlay" onClick={() => setShowRejectionImageFull(false)}>
            <img src={task.qaRejectionPhoto} alt="תקלה" />
            <div className="qa-overlay-caption">לחצי בכל מקום כדי לסגור</div>
        </div>
      )}

      <div className={`task-card ${task.isUrgent ? 'urgent-card' : ''} ${task.qaRejectionPhoto ? 'rejection-border' : ''}`}>
         
        {task.imageUrl && (
            <div className="task-image-container" onClick={() => setShowImageFull(true)}>
                <img src={task.imageUrl} alt="תקלה" className="task-thumbnail" />
                <div className="zoom-hint">לחצי להגדלה</div>
            </div>
        )}

        <div className="task-content">
            <div className="task-header">
                <div className="task-titles">
                    {task.type === 'חדשה' ? (
                        <span className="type-badge-new">ייצור פאה</span>
                    ) : (
                        <span className="type-badge-repair">תיקון שוטף</span>
                    )}
                    
                    {task.type === 'חדשה' ? (
                        <h3>{task.category} <span className="arrow">←</span> {task.subCategory}</h3>
                    ) : (
                        <h3>ביצוע: <span className="repair-tasks-inline">{task.subCategories?.join(' | ')}</span></h3>
                    )}
                    
                    {task.isUrgent && <span className="urgent-badge">דחוף!</span>}
                    {task.qaRejectionPhoto && <span className="re-work-badge">חזר מ-QA</span>}
                </div>
                <div className="task-meta">
                    <span className="wig-code-pill">{task.wigCode}</span>
                    <span className="customer-name-pill">לקוחה: {task.customerName}</span>
                </div>
            </div>

            <div className="task-details-grid">
                {task.qaRejectionPhoto && (
                    <div className="detail-box qa-rejection-box">
                        <div className="qa-rejection-header">הערת בקרת איכות לתיקון:</div>
                        <div className="qa-rejection-content">
                            <p className="qa-note-text">"{task.qaNote}"</p>
                            <div className="qa-thumbnail-wrapper" onClick={() => setShowRejectionImageFull(true)}>
                                <img src={task.qaRejectionPhoto} alt="תקלת QA" className="qa-mini-thumbnail" />
                                <div className="zoom-hint-mini">הגדלה</div>
                            </div>
                        </div>
                    </div>
                )}

                {task.deadline && (
                    <div className="detail-box deadline-box">
                        <strong>תאריך יעד:</strong> {formatDeadline(task.deadline)}
                    </div>
                )}
                {task.internalNote && (
                    <div className="detail-box general-note-box">
                        <strong>הערה כללית לפאה:</strong>
                        <p>{task.internalNote}</p>
                    </div>
                )}
                {task.type === 'חדשה' && task.notes && (
                    <div className="detail-box specific-note-box">
                        <strong>דגשים מיוחדים:</strong>
                        <p>{task.notes}</p>
                    </div>
                )}
                {task.type === 'תיקון' && task.groupedNotes && task.groupedNotes.length > 0 && (
                    <div className="detail-box specific-note-box">
                        <strong>הוראות תיקון:</strong>
                        {task.groupedNotes.map((note, idx) => (
                            <p key={idx}>• {note}</p>
                        ))}
                    </div>
                )}
            </div>

            <div className="task-actions">
                {onOpenSpecs && (
                    <button onClick={onOpenSpecs} className="specs-btn">מפרט טכני</button>
                )}
                <button onClick={handleCompleteClick} disabled={isUpdating} className="complete-btn">
                    {isUpdating ? 'מעדכן...' : 'סיימתי-העבר לשלב הבא'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};