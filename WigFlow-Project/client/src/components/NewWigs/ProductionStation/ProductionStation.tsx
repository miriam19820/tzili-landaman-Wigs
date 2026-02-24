import React, { useState, useEffect } from 'react';
import './ProductionStation.css';

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];
const SPECIALTY_MAP: Record<string, string> = {
  'התאמת שיער': 'התאמת שיער',
  'תפירת פאה': 'תפירה',
  'צבע': 'צבע',
  'עבודת יד': 'עבודת יד',
  'חפיפה': 'חפיפה',
  'בקרה': 'בקרת איכות'
};

export const ProductionStation: React.FC = () => {
  const [currentWorkerId, setCurrentWorkerId] = useState<string>('');
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [myWigs, setMyWigs] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedNextWorker, setSelectedNextWorker] = useState<Record<string, string>>({});

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

  // טעינת הפאות שמחכות לעובדת הספציפית שנבחרה
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

  const handleCompleteTask = async (wig: any) => {
    const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
    const nextStage = STAGES_FLOW[currentStageIndex + 1];
    const neededSpecialty = nextStage ? SPECIALTY_MAP[nextStage] : null;
    const availableWorkers = allWorkers.filter(w => w.specialty === neededSpecialty);

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
        showNotification('success', 'הפאה עברה בהצלחה לתחנה הבאה!');
        setMyWigs(prev => prev.filter(w => w._id !== wig._id));
      } else {
        const errorData = await response.json();
        showNotification('error', `שגיאה: ${errorData.message}`);
      }
    } catch (error) {
      showNotification('error', 'שגיאת רשת בשליחת הנתונים');
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

  return (
    <div className="station-container" dir="rtl">
      <div className="station-header">
        <h2>ניהול ייצור פאות - המשימות שלי</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>בחר עובדת:</label>
          <select value={currentWorkerId} onChange={(e) => setCurrentWorkerId(e.target.value)}>
            <option value="">-- בחר שם מהרשימה --</option>
            {allWorkers.map(worker => (
              <option key={worker._id} value={worker._id}>
                {worker.username} ({worker.specialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && <div className={`notification ${notification.type}`}>{notification.text}</div>}

      {!currentWorkerId ? (
        <div className="empty-state"><h3>אנא בחרי שם מהרשימה למעלה 👋</h3></div>
      ) : myWigs.length === 0 ? (
        <div className="empty-state"><h3>אין פאות שממתינות לביצוע בתחנה זו.</h3></div>
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
                    <div className="next-worker-selection" style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>העבר להמשך טיפול אצל:</label>
                      <select 
                        style={{ width: '100%', padding: '5px' }}
                        value={selectedNextWorker[wig._id] || ''} 
                        onChange={(e) => setSelectedNextWorker({ ...selectedNextWorker, [wig._id]: e.target.value })}
                      >
                        <option value="">-- בחר עובדת לשלב הבא --</option>
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