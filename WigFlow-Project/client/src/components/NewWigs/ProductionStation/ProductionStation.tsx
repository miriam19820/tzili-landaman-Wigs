import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode'; //
import './ProductionStation.css';

<<<<<<< Updated upstream
const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];
=======
// הגדרת השלבים ומיפוי התמחויות
const STAGES_FLOW = ['התאמת שיער', 'תפירת פאה', 'צבע', 'עבודת יד', 'חפיפה', 'בקרה'];
>>>>>>> Stashed changes
const SPECIALTY_MAP: Record<string, string> = {
  'התאמת שיער': 'התאמת שיער',
  'תפירת פאה': 'תפירה',
  'צבע': 'צבע',
  'עבודת יד': 'עבודת יד',
  'חפיפה': 'חפיפה',
  'בקרה': 'בקרת איכות'
};

<<<<<<< Updated upstream
=======
// הגדרת זיהוי קולי
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.lang = 'he-IL';
  recognition.continuous = false;
  recognition.interimResults = false;
}

>>>>>>> Stashed changes
export const ProductionStation: React.FC = () => {
  const [currentWorkerId, setCurrentWorkerId] = useState<string>('');
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [myWigs, setMyWigs] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedNextWorker, setSelectedNextWorker] = useState<Record<string, string>>({});
<<<<<<< Updated upstream
=======
  const [isListening, setIsListening] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // רפרנס לשליטה על המופע של הסורק
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
>>>>>>> Stashed changes

  // טעינת רשימת עובדות
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users');
        if (res.ok) {
          const users = await res.json();
          setAllWorkers(users.filter((u: any) => u.role === 'Worker'));
        }
      } catch (error) {
        showNotification('error', 'שגיאה בתקשורת בטעינת עובדות');
      }
    };
    fetchWorkers();
  }, []);

<<<<<<< Updated upstream
  // טעינת הפאות שמחכות לעובדת הספציפית שנבחרה
=======
  // טעינת הפאות המשויכות לעובדת
>>>>>>> Stashed changes
  useEffect(() => {
    if (!currentWorkerId) {
      setMyWigs([]);
      return;
    }
    fetchStationData();
  }, [currentWorkerId]);

<<<<<<< Updated upstream
  const handleCompleteTask = async (wig: any) => {
    const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
    const nextStage = STAGES_FLOW[currentStageIndex + 1];
    const neededSpecialty = nextStage ? SPECIALTY_MAP[nextStage] : null;
    const availableWorkers = allWorkers.filter(w => w.specialty === neededSpecialty);
=======
  // ניהול פתיחת וסגירת המצלמה
  useEffect(() => {
    if (isScannerOpen) {
      // יצירת הסורק בתוך ה-Div עם ה-ID "qr-reader"
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(onScanSuccess, (err) => { /* שגיאות סריקה רגעיות נתעלם */ });
    }

    // ניקוי המצלמה כשהקומפוננטה נסגרת או כשהסורק נסגר
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [isScannerOpen]);

  const fetchStationData = async () => {
    try {
      const wigsRes = await fetch(`http://localhost:3000/api/wigs/work-station/${currentWorkerId}`);
      if (wigsRes.ok) {
        const wigsData = await wigsRes.json();
        setMyWigs(wigsData.data || []);
      }
    } catch (error) {
      showNotification('error', 'שגיאה בטעינת המשימות');
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const onScanSuccess = (decodedText: string) => {
    // הפורמט שלנו הוא: wigflow://scan/ID
    const wigId = decodedText.split('/').pop();
    
    if (wigId) {
      const foundWig = myWigs.find(w => w._id === wigId);
      if (foundWig) {
        showNotification('success', `נמצאה פאה: ${foundWig.orderCode}. מעדכן סטטוס...`);
        handleCompleteTask(foundWig);
        setIsScannerOpen(false); // סגירת הסורק לאחר הצלחה
      } else {
        showNotification('error', 'הפאה שנסרקה לא נמצאה ברשימה שלך. וודאי שבחרת את העובדת הנכונה.');
      }
    }
  };

  const handleCompleteTask = async (wig: any) => {
    const wigId = typeof wig === 'string' ? wig : wig._id;
    const currentWig = typeof wig === 'string' ? myWigs.find(w => w._id === wig) : wig;
>>>>>>> Stashed changes

    // בדיקה אם יש צורך לבחור עובדת ספציפית לשלב הבא
    if (availableWorkers.length > 1 && !selectedNextWorker[wig._id] && nextStage !== 'בקרה') {
      showNotification('error', 'יש לבחור עובדת לשלב הבא מתוך הרשימה.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/wigs/${wig._id}/next-step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextWorkerId: selectedNextWorker[wig._id] }) 
      });

      if (response.ok) {
<<<<<<< Updated upstream
        showNotification('success', 'הפאה עברה בהצלחה לתחנה הבאה!');
        setMyWigs(prev => prev.filter(w => w._id !== wig._id));
=======
        const updatedData = await response.json();
        const customerName = updatedData.customer?.firstName || currentWig.customer?.firstName || "הלקוחה";
        
        showNotification('success', 
          `הפאה עברה בהצלחה לשלב ${updatedData.currentStage}! ✨ שלחנו כרגע עדכון ל${customerName} ב-WhatsApp ובמייל. 📱📧`
        );

        setMyWigs(prev => prev.filter(w => w._id !== wigId));
        const newSelectedWorkers = { ...selectedNextWorker };
        delete newSelectedWorkers[wigId];
        setSelectedNextWorker(newSelectedWorkers);
>>>>>>> Stashed changes
      } else {
        const errorData = await response.json();
        showNotification('error', `שגיאה: ${errorData.message}`);
      }
    } catch (error) {
      showNotification('error', 'שגיאת רשת בעדכון הסטטוס');
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const getAvailableWorkersForNextStage = (currentStage: string) => {
    const currentStageIndex = STAGES_FLOW.indexOf(currentStage);
    const nextStage = STAGES_FLOW[currentStageIndex + 1];
    if (!nextStage) return [];
    const neededSpecialty = SPECIALTY_MAP[nextStage];
    return allWorkers.filter(w => w.specialty === neededSpecialty);
  };

<<<<<<< Updated upstream
  return (
    <div className="station-container" dir="rtl">
      <div className="station-header">
        <h2>ניהול ייצור פאות - המשימות שלי</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>בחר עובדת:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחר שם מהרשימה --</option>
=======
  const toggleListening = () => {
    if (!recognition) {
      alert("הדפנפן שלך לא תומך בזיהוי קולי");
      return;
    }
    if (isListening) recognition.stop();
    else {
      setIsListening(true);
      recognition.start();
    }
  };

  if (recognition) {
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      if (command.includes('סיימתי') || command.includes('העבר')) {
        if (myWigs.length > 0) handleCompleteTask(myWigs[0]);
        else showNotification('error', 'לא נמצאה פאה פעילה לביצוע פקודה');
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
  }

  return (
    <div className="station-container" dir="rtl">
      <div className="station-header">
        <div className="header-actions">
          <h2>תחנת ייצור: {allWorkers.find(w => w._id === currentWorkerId)?.username || 'ניהול משימות'}</h2>
          <div className="btn-group">
            <button onClick={toggleListening} className={`voice-btn ${isListening ? 'listening' : ''}`}>
              {isListening ? '🎤 מקשיב...' : '🎙️ פקודה קולית'}
            </button>
            <button onClick={() => setIsScannerOpen(!isScannerOpen)} className="scan-btn">
              📷 סריקת QR
            </button>
          </div>
        </div>
        
        <div className="worker-selector">
          <label>עובדת פעילה:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחרי עובדת --</option>
>>>>>>> Stashed changes
            {allWorkers.map(worker => (
              <option key={worker._id} value={worker._id}>
                {worker.username} ({worker.specialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className={`notification-toast ${notification.type} animate-in`}>
          {notification.text}
        </div>
      )}

<<<<<<< Updated upstream
=======
      {isScannerOpen && (
        <div className="qr-overlay animate-in">
          <div className="qr-window">
            <h3>סריקת פאה לייצור</h3>
            {/* האלמנט בו תוזרק המצלמה */}
            <div id="qr-reader" style={{ width: '100%' }}></div>
            <button onClick={() => setIsScannerOpen(false)} className="close-btn" style={{ marginTop: '15px' }}>ביטול סריקה</button>
          </div>
        </div>
      )}

>>>>>>> Stashed changes
      {!currentWorkerId ? (
        <div className="empty-view"><h3>אנא בחרי עובדת לתחילת העבודה 👋</h3></div>
      ) : myWigs.length === 0 ? (
<<<<<<< Updated upstream
        <div className="empty-state"><h3>אין פאות שממתינות לביצוע בתחנה זו.</h3></div>
=======
        <div className="empty-view"><h3>אין פאות שממתינות בתחנה שלך.</h3></div>
>>>>>>> Stashed changes
      ) : (
        <div className="wigs-list">
          {myWigs.map(wig => {
            const nextStageWorkers = getAvailableWorkersForNextStage(wig.currentStage);
            return (
              <div key={wig._id} className="wig-task-card">
                <div className="card-top">
                  <div className="customer-info">
                    <h4>{wig.customer?.firstName} {wig.customer?.lastName}</h4>
                    <span className="order-tag">#{wig.orderCode}</span>
                  </div>
                  <div className="stage-badge">{wig.currentStage}</div>
                </div>
                <div className="card-details">
                  <p><strong>סוג שיער:</strong> {wig.hairType}</p>
                  {nextStageWorkers.length > 1 && (
<<<<<<< Updated upstream
                    <div className="next-worker-selection" style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>העבר להמשך טיפול אצל:</label>
=======
                    <div className="worker-assign">
                      <label>העבירי ל:</label>
>>>>>>> Stashed changes
                      <select 
                        style={{ width: '100%', padding: '5px' }}
                        value={selectedNextWorker[wig._id] || ''} 
                        onChange={(e) => setSelectedNextWorker({ ...selectedNextWorker, [wig._id]: e.target.value })}
                      >
<<<<<<< Updated upstream
                        <option value="">-- בחר עובדת לשלב הבא --</option>
=======
                        <option value="">בחר עובדת לשלב הבא</option>
>>>>>>> Stashed changes
                        {nextStageWorkers.map(w => <option key={w._id} value={w._id}>{w.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button className="done-button" onClick={() => handleCompleteTask(wig)}>
                    סיימתי והעברתי הלאה ✔️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
