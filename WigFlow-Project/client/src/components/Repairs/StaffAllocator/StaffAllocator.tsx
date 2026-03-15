import React, { useState, useEffect } from 'react';
import './StaffAllocator.css';
interface StaffAllocatorProps {
  category: string;
  onSelect: (workerId: string) => void;
}

export const StaffAllocator: React.FC<StaffAllocatorProps> = ({ category, onSelect }) => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // פנייה ל-API שסופר משימות פתוחות לכל עובדת [cite: 15, 35]
    fetch(`http://localhost:3000/api/repairs/available-workers/${category}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setWorkers(result.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <select onChange={(e) => onSelect(e.target.value)} className="staff-select" disabled={loading}>
      <option value="">{loading ? 'טוען עובדות...' : `בחרי עובדת ל${category}...`}</option>
      {workers.map(w => (
        <option key={w.workerId} value={w.workerId}>
          {w.workerName} (עומס: {w.load} משימות)
        </option>
      ))}
    </select>
  );
};