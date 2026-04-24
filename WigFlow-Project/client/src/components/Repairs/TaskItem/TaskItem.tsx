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

  // שדות בקרת איכות (QA) - התוספת החדשה
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
  const [showRejectionImageFull, setShowRejectionImageFull] = useState(false); // הגדלת תמונת פסילה

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleCompleteClick = async () => {
    setIsUpdating(true);
    try {
      if (task.type === 'חדשה') {
          const response = await axios.patch(`/wigs/${task.repairId}/next-step`, {}, {
              headers: getAuthHeader()
          });
          
          const updatedWig = response.data;
          const nextStage = updatedWig.currentStage || 'לא ידוע';
          const nextWorkers = updatedWig.assignedWorkers && updatedWig.assignedWorkers.length > 0 
              ? updatedWig.assignedWorkers.map((w: any) => w.username || w.fullName || 'עובדת').join(', ') 
              : 'הנהלה (ממתין להקצאה או לבקרה)';

          alert(`🎉 מעולה!\nהפאה עברה לשלב: ${nextStage}\nהועברה לטיפול של: ${nextWorkers}`);
          await onComplete(task.repairId); 
      } else {
          let lastMessage = "המשימה עודכנה בהצלחה!";
          if (task.taskIndexes && task.taskIndexes.length > 0) {
              for (const index of task.taskIndexes) {
                  const response = await axios.patch(`/repairs/${task.repairId}/task/${index}`, {
                    status: 'בוצע'
                  }, { headers: getAuthHeader() });
                  if (response.data.message) lastMessage = response.data.message;
              }
          } else if (task.taskIndex !== undefined) {
              const response = await axios.patch(`/repairs/${task.repairId}/task/${task.taskIndex}`, {
                 status: 'בוצע'
              }, { headers: getAuthHeader() });
              if (response.data.message) lastMessage = response.data.message;
          }
          alert(`✅ ${lastMessage}`);
          await onComplete(task.repairId, task.taskIndexes ? task.taskIndexes[0] : task.taskIndex);
      }
    } catch (error: any) {
      console.error("Complete task error:", error);
      alert(`שגיאה מול השרת: ${error.response?.data?.message || 'לא ניתן לעדכן את הסטטוס'}`);
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
    if (date < today) { color = '#ef4444'; text += ' (באיחור!)'; }
    else if (date.getTime() === today.getTime()) { color = '#f59e0b'; text += ' (להיום)'; }
    return <span style={{ color, fontWeight: 'bold' }}>{text}</span>;
  };

  return (
    <>
      {/* Overlay לתמונת מקור */}
      {showImageFull && task.imageUrl && (
        <div className="task-image-overlay" onClick={() => setShowImageFull(false)}>
            <img src={task.imageUrl} alt="תמונת פאה מוגדלת" />
        </div>
      )}

      {/* Overlay לתמונת פסילה של המבקרת */}
      {showRejectionImageFull && task.qaRejectionPhoto && (
        <div className="task-image-overlay qa-overlay" onClick={() => setShowRejectionImageFull(false)}>
            <img src={task.qaRejectionPhoto} alt="תמונת פסילה מוגדלת" />
            <div className="qa-overlay-caption">צילום התקלה מהמבקרת</div>
        </div>
      )}

      <div className={`task-card ${task.isUrgent ? 'urgent-card' : ''} ${task.qaRejectionPhoto ? 'rejection-border' : ''}`}>
        
        {task.imageUrl && (
            <div className="task-image-container" onClick={() => setShowImageFull(true)}>
                <img src={task.imageUrl} alt="מצב הפאה" className="task-thumbnail" />
        <div className="zoom-hint">תמונת מקור</div>
            </div>
        )}

        <div className="task-content">
            <div className="task-header">
                <div className="task-titles">
                    {task.type === 'חדשה' ? (
                        <span className="type-badge-new">✨ ייצור</span>
                    ) : (
                        <span className="type-badge-repair">🔧 תיקון</span>
                    )}
                    
                    {task.type === 'חדשה' ? (
                        <h3>{task.category} <span className="arrow">←</span> {task.subCategory}</h3>
                    ) : (
                        <h3>תיקונים: <span className="repair-tasks-inline">{task.subCategories?.join(' | ')}</span></h3>
                    )}
                    
                    {task.isUrgent && <span className="urgent-badge">דחוף</span>}
                    {task.qaRejectionPhoto && <span className="re-work-badge">סבב תיקון חוזר</span>}
                </div>
                <div className="task-meta">
                    <span className="wig-code-pill">{task.wigCode}</span>
                    <span className="customer-name-pill">👤 {task.customerName}</span>
                </div>
            </div>

            <div className="task-details-grid">
                {/* --- בלוק בקרת איכות - מוצג רק אם המשימה נפסלה --- */}
                {task.qaRejectionPhoto && (
                    <div className="detail-box qa-rejection-box">
                        <div className="qa-rejection-header">המבקרת החזירה את הפאה לתיקון</div>
                        <div className="qa-rejection-content">
                            <p className="qa-note-text">"{task.qaNote}"</p>
                            <div className="qa-thumbnail-wrapper" onClick={() => setShowRejectionImageFull(true)}>
                                <img src={task.qaRejectionPhoto} alt="צילום תקלה" className="qa-mini-thumbnail" />
                                <div className="zoom-hint-mini">🔍 הגדילי צילום תקלה</div>
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
                        <strong>רקע מהקבלה:</strong>
                        <p>{task.internalNote}</p>
                    </div>
                )}

                {task.type === 'חדשה' && task.notes && (
                    <div className="detail-box specific-note-box">
                        <strong>הוראות לשלב:</strong>
                        <p>{task.notes}</p>
                    </div>
                )}

                {task.type === 'תיקון' && task.groupedNotes && task.groupedNotes.length > 0 && (
                    <div className="detail-box specific-note-box">
                        <strong>הוראות לתיקונים:</strong>
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
                    {isUpdating ? 'מעדכן...' : 'סיימתי — העבר לבקרה'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
};