import React, { useState, useEffect } from 'react';
import './ProductionStation.css';

const STAGES_FLOW = ['התאמת שיער', 'תפירת פאה', 'צבע', 'עבודת יד', 'חפיפה', 'בקרה'];
const SPECIALTY_MAP: Record<string, string> = {
  'התאמת שיער': 'התאמת שיער',
  'תפירת פאה': 'תפירה',
  'צבע': 'צבע',
  'עבודת יד': 'עבודת יד',
  'חפיפה': 'חפיפה',
  'בקרה': 'בקרת איכות'
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.lang = 'he-IL';
  recognition.continuous = false;
  recognition.interimResults = false;
}

export const ProductionStation: React.FC = () => {
  const [currentWorkerId, setCurrentWorkerId] = useState<string>('');
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [myWigs, setMyWigs] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedNextWorker, setSelectedNextWorker] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false); // שדרוג QR

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users');
        if (res.ok) {
          const users = await res.json();
          setAllWorkers(users.filter((u: any) => u.role === 'Worker'));
        }
      } catch (error) {
        showNotification('error', 'שגיאה בטעינת רשימת העובדות');
      }
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (!currentWorkerId) {
      setMyWigs([]);
      return;
    }
    const fetchStationData = async () => {
      try {
        const wigsRes = await fetch(`http://localhost:3000/api/wigs/work-station/${currentWorkerId}`);
        if (wigsRes.ok) {
          const wigsData = await wigsRes.json();
          setMyWigs(wigsData.data || []);
        }
      } catch (error) {
        showNotification('error', 'שגיאת תקשורת עם השרת');
      }
    };
    fetchStationData();
  }, [currentWorkerId]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCompleteTask = async (wig: any) => {
    // וידוא שליחת ה-ID כטקסט למניעת שגיאת 404 שראינו בצילום המסך
    const wigId = typeof wig === 'string' ? wig : wig._id;
    const currentWig = typeof wig === 'string' ? myWigs.find(w => w._id === wig) : wig;

    if (!currentWig) return;

    const nextStageWorkers = getAvailableWorkersForNextStage(currentWig.currentStage);
    const nextStage = STAGES_FLOW[STAGES_FLOW.indexOf(currentWig.currentStage) + 1];

    if (nextStageWorkers.length > 1 && !selectedNextWorker[wigId] && nextStage !== 'בקרה') {
      showNotification('error', 'יש לבחור עובדת לשלב הבא מתוך הרשימה.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/wigs/${wigId}/next-step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextWorkerId: selectedNextWorker[wigId] }) 
      });

      if (response.ok) {
        showNotification('success', 'הפאה עברה בהצלחה לתחנה הבאה!');
        setMyWigs(prev => prev.filter(w => w._id !== wigId));
        const newSelectedWorkers = { ...selectedNextWorker };
        delete newSelectedWorkers[wigId];
        setSelectedNextWorker(newSelectedWorkers);
      } else {
        const errorData = await response.json();
        showNotification('error', `שגיאה: ${errorData.message}`);
      }
    } catch (error) {
      showNotification('error', 'שגיאת רשת בשליחת הנתונים');
    }
  };

  const getAvailableWorkersForNextStage = (currentStage: string) => {
    const currentStageIndex = STAGES_FLOW.indexOf(currentStage);
    const nextStage = STAGES_FLOW[currentStageIndex + 1];
    if (!nextStage) return [];
    return allWorkers.filter(w => w.specialty === SPECIALTY_MAP[nextStage]);
  };

  // לוגיקת סריקת QR (שדרוג מפתחת 2)
  const handleScanClick = () => {
    setIsScannerOpen(!isScannerOpen);
    // כאן תבוא הקריאה לרכיב הסריקה שמפתחת 1 תספק
    console.log("Scanner toggled");
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("הדפדפן שלך לא תומך בזיהוי קולי");
      return;
    }
    isListening ? recognition.stop() : (setIsListening(true), recognition.start());
  };

  if (recognition) {
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      if (command.includes('סיימתי') || command.includes('העבר')) {
        if (myWigs.length > 0) handleCompleteTask(myWigs[0]);
        else showNotification('error', 'לא נמצאה פאה פעילה');
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
  }

  return (
    <div className="station-container" dir="rtl">
      <div className="station-header">
        <div className="header-actions">
          <h2>ניהול ייצור - המשימות שלי</h2>
          <div className="btn-group">
            <button 
              onClick={toggleListening}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
            >
              {isListening ? '🎤 מקשיב...' : '🎙️ פקודה קולית'}
            </button>
            
            {/* כפתור סריקה חדש - שדרוג מפתחת 2 */}
            <button onClick={handleScanClick} className="scan-btn">
              📷 סרקי ברקוד (QR)
            </button>
          </div>
        </div>
        
        <div className="worker-selector">
          <label>עובדת:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחרי שם --</option>
            {allWorkers.map(worker => (
              <option key={worker._id} value={worker._id}>{worker.username} ({worker.specialty})</option>
            ))}
          </select>
        </div>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.text}</div>}

      {isScannerOpen && (
        <div className="qr-placeholder">
          <p>המצלמה נפתחת... (כאן יופיע רכיב הסריקה של מפתחת 1)</p>
          <button onClick={() => setIsScannerOpen(false)}>סגור מצלמה</button>
        </div>
      )}

      {!currentWorkerId ? (
        <div className="empty-state"><h3>אנא בחרי שם מהרשימה למעלה 👋</h3></div>
      ) : myWigs.length === 0 ? (
        <div className="empty-state"><h3>אין פאות שממתינות לביצוע.</h3></div>
      ) : (
        <div className="wigs-grid">
          {myWigs.map(wig => {
            const nextStageWorkers = getAvailableWorkersForNextStage(wig.currentStage);
            return (
              <div key={wig._id} className="wig-card">
                <div className="wig-card-header">
                  <h3>לקוחה: {wig.customer?.firstName} {wig.customer?.lastName}</h3>
                  <span className="badge">{wig.currentStage}</span>
                </div>
                <div className="wig-card-body">
                  <p><strong>קוד הזמנה:</strong> {wig.orderCode}</p>
                  <p><strong>סוג שיער:</strong> {wig.hairType}</p>
                  
                  {nextStageWorkers.length > 1 && (
                    <div className="next-worker-selection">
                      <label>העברי לטיפול אצל:</label>
                      <select 
                        value={selectedNextWorker[wig._id] || ''} 
                        onChange={(e) => setSelectedNextWorker({ ...selectedNextWorker, [wig._id]: e.target.value })}
                      >
                        <option value="">-- בחרי עובדת --</option>
                        {nextStageWorkers.map(w => <option key={w._id} value={w._id}>{w.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="wig-card-actions">
                  <button className="complete-btn" onClick={() => handleCompleteTask(wig)}>סיימתי את השלב ✔️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};