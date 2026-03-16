import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './ProductionStation.css';
import { WigTechnicalCard } from '../WigTechnicalCard/WigTechnicalCard';

<<<<<<< HEAD
// הגדרת השלבים ומיפוי התמחויות
const STAGES_FLOW = ['התאמת שיער', 'תפירת פאה', 'צבע', 'עבודת יד', 'חפיפה', 'בקרה'];
=======
const STAGES_FLOW = ['התאמת שיער', 'תפירת פאה', 'צבע', 'עבודת יד', 'חפיפה', 'בקרה'];

>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
const SPECIALTY_MAP: Record<string, string> = {
  'התאמת שיער': 'התאמת שיער',
  'תפירת פאה': 'תפירה',
  'צבע': 'צבע',
  'עבודת יד': 'עבודת יד',
  'חפיפה': 'חפיפה',
  'בקרה': 'בקרת איכות'
};

<<<<<<< HEAD
// הגדרת זיהוי קולי
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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
<<<<<<< HEAD
  
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
  const [isListening, setIsListening] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false); // שדרוג QR
  const [selectedWigForCard, setSelectedWigForCard] = useState<any>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

<<<<<<< HEAD
  // טעינת רשימת עובדות מפורט 5000
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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

<<<<<<< HEAD
  // טעינת הפאות המשויכות לעובדת
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
  useEffect(() => {
    if (!currentWorkerId) {
      setMyWigs([]);
      return;
    }
    fetchStationData();
  }, [currentWorkerId]);

<<<<<<< HEAD
  // ניהול פתיחת וסגירת המצלמה (QR)
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
  useEffect(() => {
    if (isScannerOpen) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
<<<<<<< HEAD
      scannerRef.current.render(onScanSuccess, (err) => { /* התעלמות משגיאות סריקה רגעיות */ });
=======
      scannerRef.current.render(onScanSuccess, (err) => {});
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    }

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
    setTimeout(() => setNotification(null), 4000);
  };

  const onScanSuccess = (decodedText: string) => {
    const wigId = decodedText.split('/').pop();
    
    if (wigId) {
      const foundWig = myWigs.find(w => w._id === wigId);
      if (foundWig) {
        showNotification('success', `נמצאה פאה: ${foundWig.orderCode}. מעדכן סטטוס...`);
        handleCompleteTask(foundWig);
        setIsScannerOpen(false);
      } else {
        showNotification('error', 'הפאה שנסרקה לא נמצאה ברשימה שלך. וודאי שבחרת את העובדת הנכונה.');
      }
    }
  };

  const handleCompleteTask = async (wig: any) => {
<<<<<<< HEAD
    // וידוא שליחת ה-ID כטקסט
=======
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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
        const updatedData = await response.json();
        const customerName = updatedData.customer?.firstName || currentWig.customer?.firstName || "הלקוחה";
        
        showNotification('success', 
          `הפאה עברה בהצלחה לשלב הבא! ✨ שלחנו כרגע עדכון ל${customerName} ב-WhatsApp ובמייל. 📱📧`
        );

        setMyWigs(prev => prev.filter(w => w._id !== wigId));
        const newSelectedWorkers = { ...selectedNextWorker };
        delete newSelectedWorkers[wigId];
        setSelectedNextWorker(newSelectedWorkers);
      } else {
        const errorData = await response.json();
        showNotification('error', `שגיאה: ${errorData.message}`);
      }
    } catch (error) {
      showNotification('error', 'שגיאת רשת בעדכון הסטטוס');
    }
  };

  const getAvailableWorkersForNextStage = (currentStage: string) => {
    const currentStageIndex = STAGES_FLOW.indexOf(currentStage);
    const nextStage = STAGES_FLOW[currentStageIndex + 1];
    if (!nextStage) return [];
    return allWorkers.filter(w => w.specialty === SPECIALTY_MAP[nextStage]);
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("הדפדפן שלך לא תומך בזיהוי קולי");
      return;
    }
<<<<<<< HEAD
    if (isListening) recognition.stop();
    else {
      setIsListening(true);
      recognition.start();
    }
=======
    isListening ? recognition.stop() : (setIsListening(true), recognition.start());
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
  };

  if (recognition) {
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      if (command.includes('סיימתי') || command.includes('העבר')) {
        if (myWigs.length > 0) handleCompleteTask(myWigs[0]);
<<<<<<< HEAD
        else showNotification('error', 'לא נמצאה פאה פעילה לביצוע פקודה');
=======
        else showNotification('error', 'לא נמצאה פאה פעילה');
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
  }

  return (
    <div className="station-container" dir="rtl">
      <div className="station-header">
        <div className="header-actions">
<<<<<<< HEAD
          <h2>תחנת ייצור: {allWorkers.find(w => w._id === currentWorkerId)?.username || 'ניהול משימות'}</h2>
          <div className="btn-group">
            <button onClick={toggleListening} className={`voice-btn ${isListening ? 'listening' : ''}`}>
              {isListening ? '🎤 מקשיב...' : '🎙️ פקודה קולית'}
            </button>
            <button onClick={() => setIsScannerOpen(!isScannerOpen)} className="scan-btn">
              📷 סריקת QR
=======
          <h2>ניהול ייצור - המשימות שלי</h2>
          <div className="btn-group">
            <button 
              onClick={toggleListening}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
            >
              {isListening ? '🎤 מקשיב...' : '🎙️ פקודה קולית'}
            </button>
            
            <button onClick={() => setIsScannerOpen(!isScannerOpen)} className="scan-btn">
              📷 סרקי ברקוד (QR)
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
            </button>
          </div>
        </div>
        
        <div className="worker-selector">
<<<<<<< HEAD
          <label>עובדת פעילה:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחרי עובדת --</option>
=======
          <label>עובדת:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחר שם מהרשימה --</option>
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
            {allWorkers.map(worker => (
              <option key={worker._id} value={worker._id}>{worker.username} ({worker.specialty})</option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className={`notification-toast ${notification.type} animate-in`}>
          {notification.text}
        </div>
      )}

      {isScannerOpen && (
        <div className="qr-overlay animate-in">
          <div className="qr-window">
            <h3>סריקת פאה לייצור</h3>
            <div id="qr-reader" style={{ width: '100%' }}></div>
            <button onClick={() => setIsScannerOpen(false)} className="close-btn" style={{ marginTop: '15px' }}>ביטול סריקה</button>
          </div>
        </div>
      )}

      {!currentWorkerId ? (
        <div className="empty-view"><h3>אנא בחרי עובדת לתחילת העבודה 👋</h3></div>
      ) : myWigs.length === 0 ? (
<<<<<<< HEAD
        <div className="empty-view"><h3>אין פאות שממתינות בתחנה שלך.</h3></div>
=======
        <div className="empty-state"><h3>אין פאות שממתינות לביצוע בתחנה זו.</h3></div>
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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
<<<<<<< HEAD
                    <div className="worker-assign">
                      <label>העבירי ל:</label>
=======
                    <div className="next-worker-selection" style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>העבר להמשך טיפול אצל:</label>
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
                      <select 
                        value={selectedNextWorker[wig._id] || ''} 
                        onChange={(e) => setSelectedNextWorker({ ...selectedNextWorker, [wig._id]: e.target.value })}
                      >
<<<<<<< HEAD
                        <option value="">בחר עובדת לשלב הבא</option>
=======
                        <option value="">-- בחר עובדת לשלב הבא --</option>
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
                        {nextStageWorkers.map(w => <option key={w._id} value={w._id}>{w.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: '10px', padding: '15px' }}>
                  <button 
                    className="done-button" 
                    onClick={() => handleCompleteTask(wig)}
                    style={{ flex: 1 }}
                  >
                    סיימתי והעברתי הלאה ✔️
                  </button>
                  <button 
                    className="view-details-btn" 
                    onClick={() => setSelectedWigForCard(wig)} 
                    style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    📋 צפי במפרט
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedWigForCard && (
        <WigTechnicalCard 
          wig={selectedWigForCard} 
          onClose={() => setSelectedWigForCard(null)} 
        />
      )}
    </div>
  );
};
