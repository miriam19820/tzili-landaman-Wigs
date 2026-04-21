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
  beforeImageUrl?: string; // תמונת "לפני" להשוואה
}

export const QADashboard: React.FC = () => {
  const [tasks, setTasks] = useState<IQATask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ניהול צילום תמונת אישור
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchQATasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/services/qa-tasks'); // נתיב מעודכן לפי הראוטר
      if (res.data) {
        setTasks(res.data);
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

  // פתיחת מודל פסילה - מחייב תמונה בתוך המודל
  const openRejectionModal = (task: IQATask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  /**
   * טיפול באישור סופי - מחייב צילום "אחרי"
   */
  const handleApprove = async (taskId: string, photoUrl: string) => {
    if (!photoUrl) {
        alert('חובה לצלם את הפאה לפני אישור סופי!');
        return;
    }

    try {
      setUploading(taskId);
      // שליחה לשרת כולל התמונה והמזהה של המבקרת (נלקח מהטוקן בשרת)
      await axios.patch(`/api/services/${taskId}/approve`, { 
        photoUrl: photoUrl 
      });
      
      alert('הפאה אושרה בהצלחה, צילום "אחרי" נשמר במערכת! ✅');
      fetchQATasks(); 
    } catch (error) {
      alert('שגיאה באישור הפאה.');
    } finally {
      setUploading(null);
    }
  };

  /**
   * פונקציית עזר להמרת תמונה ל-Base64 או העלאה לשרת
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // כאן ניתן להוסיף לוגיקה להעלאה ל-Cloudinary/S3. 
    // כרגע נשתמש ב-Base64 כיוון שהגדרנו בשרת תמיכה ב-50MB
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        handleApprove(taskId, base64String);
    };
    reader.readAsDataURL(file);
  };

  /**
   * פסילה והחזרה לתיקון - המודל מקבל כעת גם צילום
   */
  const handleRejectConfirm = async (reason: string, returnStages: string[], photoUrl: string) => {
    if (!selectedTask) return;
    if (!photoUrl) {
        alert('חובה לצלם את התקלה כדי שהעובדת תבין מה לתקן!');
        return;
    }
    
    try {
      await axios.patch(`/api/services/${selectedTask._id}/reject`, { 
        qaNote: reason,
        returnStages: returnStages,
        photoUrl: photoUrl // תמונת הפסילה שתגיע לעובדת
      });
      
      alert(`הפאה נפסלה. התמונה וההערות נשלחו לעובדת. ❌`);
      setIsModalOpen(false);
      fetchQATasks(); 
    } catch (error) {
      console.error(error);
      alert('שגיאה בפסילת הפאה.');
    }
  };

  return (
    <div className="qa-dashboard-container" dir="rtl">
      <div className="qa-header">
        <h1 className="qa-title">מרכז בקרת איכות - WigFlow 🔍</h1>
        <p className="qa-subtitle">אישור פאות מוכנות ותיעוד ויזואלי של יציאה מהסלון</p>
      </div>
      
      {loading ? (
        <div className="loader-container">
            <div className="spinner"></div>
            <p>סורק פאות בבדיקה...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>אין כרגע פאות שממתינות לבקרה. 🎉</h3>
          <p>כל הפאות בייצור או מוכנות למסירה.</p>
        </div>
      ) : (
        <div className="qa-grid">
          {tasks.map(task => (
            <div key={task._id} className="qa-card">
              <div className="card-header">
                <span className={`origin-badge ${task.origin}`}>{task.origin === 'NewWig' ? 'פאה חדשה' : 'תיקון'}</span>
                {task.beforeImageUrl && <img src={task.beforeImageUrl} alt="מקור" className="thumb-preview" title="צפה בתמונת המקור" />}
              </div>
              
              <div className="card-body">
                <h3>{task.customer ? `${task.customer.firstName} ${task.customer.lastName}` : 'לקוחה כללית'}</h3>
                <p className="service-type">{task.serviceType}</p>
              </div>

              <div className="card-actions">
                {/* כפתור אישור סופי שמפעיל את המצלמה */}
                <div className="upload-wrapper">
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        id={`capture-${task._id}`}
                        className="hidden-input"
                        onChange={(e) => handleFileUpload(e, task._id)}
                    />
                    <label htmlFor={`capture-${task._id}`} className={`btn-approve ${uploading === task._id ? 'loading' : ''}`}>
                        {uploading === task._id ? 'מעלה...' : 'צלמי ואשרי ✅'}
                    </label>
                </div>

                <button 
                  className="btn-reject"
                  onClick={() => openRejectionModal(task)}
                >
                  פסילה לתיקון ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* מודל הפסילה המעודכן - ודאי שעדכנת גם את הקומפוננטה הזו לקבל צילום */}
      <RejectionModal 
        isOpen={isModalOpen} 
        customerName={selectedTask?.customer ? `${selectedTask.customer.firstName} ${selectedTask.customer.lastName}` : ''}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}