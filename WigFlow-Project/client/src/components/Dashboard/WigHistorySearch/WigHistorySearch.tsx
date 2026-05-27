 import React, { useState } from 'react';
 import axios from 'axios';
 import './WigHistorySearch.css';
 import { useLocation } from 'react-router-dom';
 import { WigTechnicalCard } from '../../NewWigs/WigTechnicalCard/WigTechnicalCard';
 export const WigHistorySearch: React.FC = () => {
   const location = useLocation();
  
   
   // 💡 פטנט מובנה ב-JavaScript שקורא ערכים מהכתובת (למשל מתוך ?code=WIG-123)
   const searchParams = new URLSearchParams(location.search);
const incomingCode = searchParams.get('code') || searchParams.get('Code') || '';  const [selectedWigForCard, setSelectedWigForCard] = useState<any>(null);
   const [barcode, setBarcode] = useState(incomingCode);
   const [history, setHistory] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   // 💡 נשנה גם את האינפוט להשתמש ב-onKeyDown המודרני כדי להעיף את הקו המחוק!
   const handleSearch = async (forcedBarcode?: string) => {
     const codeToSearch = forcedBarcode || barcode;
     if (!codeToSearch.trim()) return;
    
     setLoading(true);
     setError('');
    
     try {
       const token = localStorage.getItem('token');
       const response = await axios.get(`http://localhost:5000/api/wigs/history/${codeToSearch}`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       setHistory(response.data.data);
     } catch (err: any) {
       setError(err.response?.data?.message || 'לא נמצאה פאה עם קוד זה במערכת');
       setHistory(null);
     } finally {
       setLoading(false);
     }
   };



  //  💡 החיישן האוטומטי המשודרג - מריץ את החיפוש ומציג שגיאות אם יש
   React.useEffect(() => {
     if (incomingCode) {
       console.log("קוד שהתקבל מהדאשבורד:", incomingCode);
       setBarcode(incomingCode);
      
       // נותנים לדף חלקיק שנייה להתארגן על הטוקן ב-localStorage לפני שרצים לשרת
       const timer = setTimeout(() => {
         handleSearch(incomingCode);
       }, 100);
      
       return () => clearTimeout(timer);
     }
   }, [incomingCode]);

  

   return (
     <div className="search-container" dir="rtl">
       <h3 className="search-title">🔍 חיפוש היסטוריית פאה (ברקוד)</h3>
      
       <div className="search-input-row">
         <input 
           type="text" 
           className="barcode-input"
           placeholder="הזינו קוד פאה (למשל WIG-1234)..." 
           value={barcode}
           onChange={(e) => setBarcode(e.target.value)}
           // onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
           onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />

         <button className="search-button" onClick={() => handleSearch()} disabled={loading}>
            {loading ? 'מחפש...' : 'חפשי היסטוריה'}
         </button>
       </div>

       {error && <p className="error-message">{error}</p>}

       {history && (
         <div className="results-area animate-in">
        
           <div className="header-info-box">
             <div className="main-details">
               <h4 className="wig-type-title">{history.wigDetails.wigType}</h4>
               <p className="order-code">קוד פאה: <strong>{history.wigDetails.orderCode}</strong></p>
               <p>לקוחה: <strong>{history.wigDetails.customer?.firstName} {history.wigDetails.customer?.lastName}</strong></p>
             </div>
             <div className="side-details">
               <span className="date-badge">
                 📅 יצירה: {new Date(history.wigDetails.createdAt).toLocaleDateString('he-IL')}
               </span>
               {history.wigDetails.price && (
                 <span className="price-badge">₪{history.wigDetails.price.toLocaleString()}</span>
               )}
             </div>
           </div>
          
           <div className="history-grid">
            
             <div className="history-section">
               <h5 className="section-title">🛠️ שלבי ייצור מקוריים</h5>
               {history.productionHistory && history.productionHistory.length > 0 ? (
                 history.productionHistory.map((h: any, i: number) => (
                   <div key={i} className="history-item-row">
                     <span className="stage-name">{h.stage}</span>
                     <div className="item-meta">
                       🕒 {new Date(h.date).toLocaleDateString('he-IL')}
                       {h.worker && <span className="worker-tag"> | 👤 {h.worker}</span>}
                     </div>
                   </div>
                 ))
              ) : <p className="no-data">אין נתוני ייצור</p>}
            </div>

            <div className="history-section">
               <h5 className="section-title">🧼 שירותי חפיפה וסירוק</h5>
               {history.serviceHistory && history.serviceHistory.length > 0 ? (
                 history.serviceHistory.map((s: any, i: number) => (
                   <div key={i} className="history-item-row">
                     <span className="service-type">{s.serviceType}</span>
                     <span className="service-status">({s.status})</span>
                    <div className="item-meta">
                       🕒 {new Date(s.createdAt).toLocaleDateString('he-IL')}
                       {s.assignedTo && <span className="worker-tag"> | 👤 {s.assignedTo.username}</span>}
                    </div>
                   </div>
                 ))
               ) : <p className="no-data">אין נתוני חפיפות</p>}
             </div>

             {/* --- היסטוריית תיקונים (החלק המפורט) --- */}
            <div className="history-section full-width">
               <h5 className="section-title">🧵 תיקוני פאה והיסטוריית תחנות</h5>
               {history.repairHistory && history.repairHistory.length > 0 ? (
                history.repairHistory.map((r: any, i: number) => (
                  <div key={i} className="repair-history-card">
                     {/* <div className="repair-card-header">
                       <span className={`repair-status-tag ${r.overallStatus === 'מוכן' ? 'ready' : 'in-work'}`}>
                          {r.overallStatus}
                      </span>
                       <span className="repair-date-label">
                         📅 נפתח: {new Date(r.createdAt).toLocaleDateString('he-IL')}
                       </span>
                     </div> */}

                     <div className="repair-card-header">
  <span className={`repair-status-tag ${r.overallStatus === 'מוכן' ? 'ready' : 'in-work'}`}>
    {r.overallStatus}
  </span>
  {/* 💡 הלחצן החדש שיפתח את המפרט גם מהתיקון! */}
  <button 
    className="search-button" 
    style={{ padding: '4px 10px', fontSize: '12px' }} 
    onClick={() => setSelectedWigForCard(history.wigDetails)}
  >
    👁️ צפייה במפרט
  </button>
  <span className="repair-date-label">
    📅 נפתח: {new Date(r.createdAt).toLocaleDateString('he-IL')}
  </span>
</div>

                     <div className="repair-tasks-detail">
                       <strong>פירוט התיקונים שבוצעו:</strong>
                       <div className="tasks-tags-container">
                         {r.tasks?.map((task: any, idx: number) => (
                           <span key={idx} className="task-tag">
                            {task.subCategory} 
                            <span className="worker-info"> (ע"י {task.assignedTo?.username || 'צוות'})</span>
                           </span>
                         ))}
                       </div>
                    </div>

                     {r.internalNote && (
                      <div className="repair-note-box">
                         <strong>📝 תיעוד מקרה (הערה פנימית):</strong>
                         <p>{r.internalNote}</p>
                       </div>
                     )}

                     <div className="repair-photos-comparison">
                      {r.imageUrl && (
                         <div className="photo-container">
                          <span className="photo-stamp before">לפני</span>
                           <img src={r.imageUrl} alt="לפני התיקון" className="repair-img" />
                        </div>
                       )}
                       {r.afterImageUrl && (
                         <div className="photo-container">
                          <span className="photo-stamp after">אחרי</span>
                          <img src={r.afterImageUrl} alt="אחרי התיקון" className="repair-img" />
                         </div>
                       )}
                     </div>
                   </div>
                 ))
               ) : <p className="no-data">לא בוצעו תיקונים לפאה זו</p>}
            </div>

           </div>
         </div>
       )}

       {/* 💡 כאן הוספנו את הקוד של הכרטיס - ממש בסוף הקונטיינר הראשי! */}
       {selectedWigForCard && (
         <WigTechnicalCard 
           wig={selectedWigForCard} 
           onClose={() => setSelectedWigForCard(null)} 
         />
       )}
     </div>
   );
 };



