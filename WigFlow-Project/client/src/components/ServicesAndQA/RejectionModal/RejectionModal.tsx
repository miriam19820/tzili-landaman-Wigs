import React, { useState, useRef, useEffect } from 'react';
import './RejectionModal.css';

interface RejectionModalProps {
  isOpen: boolean;
  customerName: string;
  wigCode?: string;
  origin?: string;
  onClose: () => void;
  onConfirm: (reason: string, returnStages: string[], photoUrl: string) => void;
}

const REPAIR_CATEGORIES = [
  { id: 'machine', name: 'מכונה', subTypes: ['העברת רשת', 'תיקון רשת', 'התקנת לייס', 'התקנת ריבן', 'התקנת סקין', 'השטחת סקין', 'הארכת פאה', 'דילול טרסים', 'מילוי טרסים', 'קיצור פאה'] },
  { id: 'color', name: 'צבע', subTypes: ['גוונים', 'שורש', 'שטיפה לעש', 'הבהרה לבלונד'] },
  { id: 'hand', name: 'עבודת יד', subTypes: ['מילוי לייס', 'מילוי ריבן', 'בייביהייר', 'ע"י ישנה', 'גובה בקודקוד'] },
  { id: 'wash', name: 'חפיפה', subTypes: ['חלק', 'מוברש', 'גלי', 'תלתלים', 'ייבוש טבעי', 'בייביליס'] }
];

const NEW_WIG_STAGES = ['התאמת שיער', 'תפירת פאה', 'צבע', 'עבודת יד', 'חפיפה'];

export const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, customerName, wigCode, origin, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedTasks, setSelectedTasks] = useState<Record<string, { subTasks: string[], note: string }>>({});

  const isRepair = origin === 'Repair';

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("לא ניתן לגשת למצלמה. יש לאפשר הרשאות בדפדפן.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPhoto(null);
      setReason('');
      setSelectedTasks({});
    }
  }, [isOpen]);

  const handleToggleSubTask = (category: string, subTask: string) => {
    setSelectedTasks(prev => {
      const current = prev[category] || { subTasks: [], note: '' };
      const subTasksArray = current.subTasks || [];
      const hasSubTask = subTasksArray.includes(subTask);
      
      const updatedSubTasks = hasSubTask 
        ? subTasksArray.filter(st => st !== subTask) 
        : [...subTasksArray, subTask];

      if (updatedSubTasks.length === 0 && !current.note) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: { ...current, subTasks: updatedSubTasks } };
    });
  };

  const handleStageNoteChange = (category: string, note: string) => {
    setSelectedTasks(prev => {
      const current = prev[category] || { subTasks: [], note: '' };
      if ((current.subTasks || []).length === 0 && !note) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: { ...current, note } };
    });
  };

  const handleToggleSimpleStage = (stage: string) => {
    setSelectedTasks(prev => {
      if (prev[stage]) {
        const { [stage]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stage]: { subTasks: [], note: '' } };
    });
  };

  const handleConfirmAction = () => {
    const selectedCategories = Object.keys(selectedTasks);
    
    if (!reason.trim()) return alert('חובה להזין סיבת פסילה כללית');
    if (selectedCategories.length === 0) return alert('חובה לבחור לפחות שלב אחד או תת-משימה לחזרה');
    if (!photo) return alert('חובה לצלם את התקלה עבור העובדת!');

    let detailedReason = `${reason}\n\nהנחיות לתחנות השונות:\n`;
    
    selectedCategories.forEach(cat => {
      detailedReason += `- [${cat}]: `;
      const tasks = selectedTasks[cat].subTasks || [];
      if (tasks.length > 0) detailedReason += tasks.join(', ');
      
      const note = selectedTasks[cat].note;
      if (note) detailedReason += (tasks.length > 0 ? ` | הערה: ${note}` : note);
      detailedReason += '\n';
    });

    onConfirm(detailedReason, selectedCategories, photo);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" dir="rtl" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>❌ פסילת פאה לתיקון</h2>
          <div className="modal-customer">{customerName} {wigCode && `— ${wigCode}`}</div>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <div className="modal-section">
            <label>מה הבעיה? (חובה)</label>
            <textarea
              className="modal-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="למשל: השביל לא במקום, חסר שיער בצד ימין, הצבע לא אחיד..."
              rows={2}
            />
          </div>

          <div className="modal-section">
            <label>📸 תמונת התקלה (חובה — תגיע לעובדת)</label>
            {!isCameraOpen && !photo && (
              <button 
                type="button" 
                onClick={startCamera} 
                className="btn-capture" 
                style={{ width: '100%', background: '#f0e8ff', color: '#6f42c1', border: '2px dashed #b39ddb' }}
              >
                📸 צלמי את הבעיה
              </button>
            )}
            
            {/* המצלמה הוקטנה כאן כדי למנוע את פריצתה מהמודל */}
            {isCameraOpen && (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0d0f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', backgroundColor: '#000', display: 'block' }} />
                <div style={{ display: 'flex', width: '100%', gap: '10px', padding: '10px', background: '#f8f9fa' }}>
                  <button type="button" onClick={capturePhoto} style={{ flex: 1, padding: '8px', background: '#4caf50', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>צלמי תקלה</button>
                  <button type="button" onClick={stopCamera} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>ביטול</button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}

            {photo && !isCameraOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <img src={photo} alt="התקלה" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #ffccc7' }} />
                <button type="button" onClick={() => { setPhoto(null); startCamera(); }} className="btn-cancel" style={{ width: '100%' }}>
                  🔄 צלמי מחדש
                </button>
              </div>
            )}
          </div>

          <div className="modal-section">
            <label>מה דורש תיקון? (בחרי תחנות ותתי-סעיפים)</label>
            
            {isRepair ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {REPAIR_CATEGORIES.map(cat => {
                  const isCatSelected = !!selectedTasks[cat.name];
                  
                  return (
                    <div key={cat.id} style={{ background: 'var(--zili-warm)', border: `1px solid ${isCatSelected ? 'var(--zili-mauve)' : 'var(--zili-border)'}`, borderRadius: '8px', padding: '12px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--zili-deep)', display: 'block', marginBottom: '8px' }}>{cat.name}</strong>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {cat.subTypes.map(sub => {
                          const isSelected = selectedTasks[cat.name]?.subTasks?.includes(sub) || false;
                          return (
                            <button
                              key={sub}
                              className={`stage-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => handleToggleSubTask(cat.name, sub)}
                              style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>

                      <input 
                        type="text" 
                        placeholder={`הערה נוספת לתחנת ${cat.name} (אופציונלי)...`}
                        className="modal-textarea"
                        style={{ minHeight: '36px', padding: '6px 10px', fontSize: '12.5px', marginTop: '4px' }}
                        value={selectedTasks[cat.name]?.note || ''}
                        onChange={(e) => handleStageNoteChange(cat.name, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="stages-grid">
                {NEW_WIG_STAGES.map(stage => {
                  const isSelected = !!selectedTasks[stage];
                  return (
                    <div key={stage} style={{ width: '100%', marginBottom: '10px' }}>
                      <button
                        className={`stage-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleSimpleStage(stage)}
                        style={{ width: '100%', textAlign: 'right' }}
                      >
                        {stage}
                      </button>
                      {isSelected && (
                        <input 
                          type="text" 
                          placeholder={`הוראות מדויקות לתחנת ${stage}...`}
                          className="modal-textarea"
                          style={{ marginTop: '8px', minHeight: '36px', fontSize: '12.5px' }}
                          value={selectedTasks[stage]?.note || ''}
                          onChange={(e) => handleStageNoteChange(stage, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--zili-border)' }}>
          <button className="btn-cancel" onClick={onClose}>ביטול</button>
          <button className="btn-confirm-reject" onClick={handleConfirmAction}>אשרי פסילה ושלחי לתיקון</button>
        </div>
      </div>
    </div>
  );
};