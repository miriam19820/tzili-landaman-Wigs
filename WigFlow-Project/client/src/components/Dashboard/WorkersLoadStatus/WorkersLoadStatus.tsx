import React, { useEffect, useState } from 'react';
import './WorkersLoadStatus.css';
import { EditWorkerModal } from '../EditWorkerModal'; // וודאי שהנתיב נכון אצלך

interface Worker {
  _id: string;
  fullName: string;
  specialty: string;
  workload?: number;
  isActive: boolean;
}

export const WorkersLoadStatus: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  
  // המצב ששומר איזו עובדת אנחנו עורכים כרגע
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const fetchWorkers = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/users/workload', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { 
        setWorkers(data || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const workersOnly = workers.filter(w => w.specialty !== 'ניהול');

  return (
    <div className="workers-container">
      <h2 className="workers-title">👩‍💼 עומס עבודה - צוות</h2>
      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : (
        <div className="workers-grid">
          {workersOnly.map(worker => (
            <div key={worker._id} className={`worker-card ${!worker.isActive ? 'inactive' : ''}`}>
              <div className="worker-name">{worker.fullName}</div>
              <div className="worker-specialty">{worker.specialty}</div>
              <span className="worker-count">{worker.workload ?? 0} פאות בטיפול</span>
              
              {/* כפתור העריכה שפותח את המודל */}
              <button 
                className="edit-btn" 
                onClick={() => setSelectedWorker(worker)}
              >
                עריכה
              </button>
            </div>
          ))}
        </div>
      )}

      {/* אם יש עובדת נבחרת - נציג את המודל */}
      {selectedWorker && (
        <EditWorkerModal 
          worker={selectedWorker} 
          onClose={() => setSelectedWorker(null)} 
          onUpdate={fetchWorkers} 
        />
      )}
    </div>
  );
};