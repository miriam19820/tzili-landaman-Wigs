import React, { useState, useEffect, useRef } from 'react';
import { RejectionModal } from '../RejectionModal/RejectionModal';
import './QADashboard.css';
import axios from 'axios';

interface IQATask {
  _id: string;
  customer?: { firstName: string; lastName: string };
  serviceType: string;
  origin: 'Service' | 'NewWig' | 'Repair';
  status: string;
  beforeImageUrl?: string;
  newWigReference?: { orderCode?: string };
  repairReference?: { wigCode?: string };
}

export const QADashboard: React.FC = () => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [tasks, setTasks] = useState<IQATask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IQATask | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [approvePhoto, setApprovePhoto] = useState<{ [id: string]: string }>({});
  
  const [activeCameraTaskId, setActiveCameraTaskId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchQATasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/services/qa-tasks', {
        headers: getAuthHeader()
      });
      const tasksData = res.data?.data || res.data;
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('שגיאה בטעינת משימות בקרת איכות', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQATasks(); }, []);

  const startCamera = async (taskId: string) => {
    setActiveCameraTaskId(taskId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("לא ניתן לגשת למצלמה. יש לאפשר הרשאות מצלמה בדפדפן.");
      setActiveCameraTaskId(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setActiveCameraTaskId(null);
  };

  const capturePhoto = (taskId: string) => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        
        setApprovePhoto(prev => ({ ...prev, [taskId]: dataUrl }));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleApprove = async (taskId: string) => {
    const photo = approvePhoto[taskId];
    if (!photo) {
      alert('חובה לצלם את הפאה לפני אישור סופי!');
      startCamera(taskId);
      return;
    }
    try {
      setUploading(taskId);
      await axios.patch(`http://localhost:5000/api/services/${taskId}/approve`, {
        photoUrl: photo
      }, { headers: getAuthHeader() });
      alert('✅ הפאה אושרה בהצלחה! התמונה נשמרה בהיסטוריה.');
      fetchQATasks();
    } catch {
      alert('שגיאה באישור הפאה.');
    } finally {
      setUploading(null);
    }
  };

  const handleRejectConfirm = async (reason: string, returnStages: string[], photoUrl: string) => {
    if (!selectedTask) return;
    try {
      await axios.patch(`http://localhost:5000/api/services/${selectedTask._id}/reject`, {
        qaNote: reason,
        returnStages,
        photoUrl
      }, { headers: getAuthHeader() });
      alert('❌ הפאה נפסלה. התמונה וההערות נשלחו לעובדת.');
      setIsModalOpen(false);
      fetchQATasks();
    } catch {
      alert('שגיאה בפסילת הפאה.');
    }
  };

  const getWigCode = (task: IQATask) => {
    if (task.newWigReference && typeof task.newWigReference === 'object') {
      return (task.newWigReference as any).orderCode || '';
    }
    if (task.repairReference && typeof task.repairReference === 'object') {
      return (task.repairReference as any).wigCode || '';
    }
    return '';
  };

  return (
    <div className="qa-dashboard-container page-container" dir="rtl">

      {fullscreenImage && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(61, 43, 46, 0.88)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt="תמונה מוגדלת" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius-md)', boxShadow: 'var(--zili-shadow-lg)' }} 
          />
          <button style={{ position: 'absolute', top: '20px', left: '20px', background: 'var(--zili-white)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', color: 'var(--zili-deep)', cursor: 'pointer' }} onClick={() => setFullscreenImage(null)}>✕</button>
        </div>
      )}

      {/* העיצוב היוקרתי המקורי שלך (ללא האייקון זכוכית מגדלת) */}
      <div className="page-header">
        <h1>בקרת איכות</h1>
        <p style={{ color: 'var(--zili-muted)', fontSize: '14px' }}>בדיקה סופית לפני מסירה ללקוחה</p>
      </div>

      {loading ? (
        <div className="loading-state">טוען פאות לבדיקה...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--zili-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--zili-border)' }}>
          <h3 style={{ color: 'var(--zili-deep)' }}>🎉 אין פאות שממתינות לבקרה</h3>
          <p style={{ color: 'var(--zili-muted)' }}>כל הפאות בייצור או מוכנות למסירה</p>
        </div>
      ) : (
        <div className="qa-grid">
          {tasks.map(task => {
            const wigCode = getWigCode(task);
            const customerName = task.customer
              ? `${task.customer.firstName} ${task.customer.lastName}`
              : 'לקוחה כללית';
            const hasApprovePhoto = !!approvePhoto[task._id];

            return (
              <div key={task._id} className="zili-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--zili-blush)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-stage" style={{ background: task.origin === 'NewWig' ? 'var(--zili-blush)' : '#fff3e0', color: task.origin === 'NewWig' ? 'var(--zili-deep)' : 'var(--zili-warning)' }}>
                      {task.origin === 'NewWig' ? 'פאה חדשה' : 'תיקון'}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{customerName}</h3>
                  </div>
                  {wigCode && <span className="badge" style={{ background: 'var(--zili-warm)', color: 'var(--zili-deep)' }}>{wigCode}</span>}
                </div>

                {task.beforeImageUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zili-muted)', margin: 0 }}>תמונת הבעיה / תמונת לפני (לחצי להגדלה):</p>
                    <img 
                      src={task.beforeImageUrl} 
                      alt="לפני" 
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--zili-border)', cursor: 'zoom-in' }}
                      onClick={() => setFullscreenImage(task.beforeImageUrl!)} 
                    />
                  </div>
                )}

                <div style={{ background: 'var(--zili-warm)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--zili-border)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zili-deep)', margin: '0 0 10px 0' }}>📸 תמונת אישור סופי:</p>
                  
                  {activeCameraTaskId === task._id ? (
                    <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--zili-border)' }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'var(--zili-white)' }}>
                        <button onClick={() => capturePhoto(task._id)} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                          צלמי אישור
                        </button>
                        <button onClick={stopCamera} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                          ביטול
                        </button>
                      </div>
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                  ) : (
                    <>
                      {!hasApprovePhoto ? (
                        <button className="btn-secondary" onClick={() => startCamera(task._id)} style={{ width: '100%', display: 'block', textAlign: 'center', background: 'var(--zili-white)' }}>
                          📸 פתחי מצלמה לאישור
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={approvePhoto[task._id]} alt="אחרי" onClick={() => setFullscreenImage(approvePhoto[task._id])} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--zili-success)', cursor: 'zoom-in' }} />
                          <button onClick={() => startCamera(task._id)} className="btn-secondary" style={{ padding: '6px 12px' }}>
                            🔄 צלמי מחדש
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, background: 'var(--zili-success)', opacity: (!hasApprovePhoto || uploading === task._id) ? 0.6 : 1 }}
                    onClick={() => handleApprove(task._id)}
                    disabled={uploading === task._id || !hasApprovePhoto}
                  >
                    {uploading === task._id ? 'שומר...' : '✅ אשרי — הפאה תקינה'}
                  </button>

                  <button
                    className="btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                  >
                    ❌ פסלי — החזר לתיקון
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <RejectionModal
        isOpen={isModalOpen}
        customerName={selectedTask?.customer
          ? `${selectedTask.customer.firstName} ${selectedTask.customer.lastName}`
          : ''}
        wigCode={selectedTask ? getWigCode(selectedTask) : ''}
        origin={selectedTask?.origin}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleRejectConfirm}
      />

    </div>
  );
};