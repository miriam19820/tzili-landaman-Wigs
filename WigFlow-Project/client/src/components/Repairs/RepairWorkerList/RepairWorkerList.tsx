import React, { useEffect, useState } from 'react';

interface Task {
  _id: string;
  category: string;
  subCategory: string;
  status: 'ממתין' | 'בוצע';
  notes: string;
}

interface RepairWithTask {
  repairId: string;
  wigCode: string;
  customerName: string;
  isUrgent: boolean;
  taskIndex: number;
  task: Task;
}

interface Props {
  workerId: string;
}

export const RepairWorkerList: React.FC<Props> = ({ workerId }) => {
  const [tasks, setTasks] = useState<RepairWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/repairs/worker-tasks/${workerId}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (error) {
      console.error('שגיאה בשליפת משימות', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) fetchTasks();
  }, [workerId]);

  const handleComplete = async (repairId: string, taskIndex: number) => {
    try {
      await fetch(`http://localhost:3000/api/repairs/${repairId}/task/${taskIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'בוצע' })
      });
      fetchTasks();
    } catch (error) {
      console.error('שגיאה בעדכון משימה', error);
    }
  };

  if (loading) return <div dir="rtl" style={{ padding: '20px' }}>טוען משימות...</div>;

  return (
    <div dir="rtl" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '3px solid #6f42c1', paddingBottom: '10px' }}>המשימות שלי</h2>

      {tasks.length === 0 ? (
        <p style={{ color: '#6c757d', textAlign: 'center', marginTop: '40px' }}>אין משימות פתוחות כרגע ✅</p>
      ) : (
        tasks.map((item) => (
          <div key={item.repairId + item.taskIndex} style={{
            border: `2px solid ${item.isUrgent ? '#dc3545' : '#dee2e6'}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px',
            background: item.isUrgent ? '#fff5f5' : '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {item.isUrgent && <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '10px' }}>🔴 דחוף</span>}
                <strong>{item.wigCode}</strong> — {item.customerName}
              </div>
              <span style={{ background: '#6f42c1', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                {item.task.category}
              </span>
            </div>
            <div style={{ marginTop: '10px', color: '#495057' }}>
              משימה: <strong>{item.task.subCategory}</strong>
              {item.task.notes && <span style={{ marginRight: '10px', color: '#6c757d' }}>({item.task.notes})</span>}
            </div>
            <button
              onClick={() => handleComplete(item.repairId, item.taskIndex)}
              style={{ marginTop: '10px', padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              סמני כבוצע ✓
            </button>
          </div>
        ))
      )}
    </div>
  );
};
