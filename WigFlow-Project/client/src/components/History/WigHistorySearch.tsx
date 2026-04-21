import React, { useState } from 'react';
import axios from 'axios';
import './WigHistorySearch.css';

export const WigHistorySearch: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTarget, setNoteTarget] = useState<{ type: string, id?: string, title: string } | null>(null);

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
  
      const response = await axios.get(`http://localhost:5000/api/wigs/history/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'לא נמצאה פאה עם קוד זה');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const openNoteModal = (type: string, title: string, id?: string) => {
    setNoteTarget({ type, id, title });
    setNoteText('');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      alert('נא להזין תוכן להערה');
      return;
    }
    
    try {
      // כאן תבוא הקריאה לשרת לשמירת ההערה (לפי הלוגיקה שלך)
      alert(`✅ ההערה עבור "${noteTarget?.title}" נשמרה בהצלחה!`);
      setIsNoteModalOpen(false);
      handleSearch();
    } catch (error) {
      alert('שגיאה בשמירת ההערה');
    }
  };

  return (
    <div className="history-page-container" dir="rtl">
      
      {/* מודל הערות */}
      {isNoteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
          <div className="note-modal-content" onClick={e => e.stopPropagation()}>
            <h3>הוספת הערה: {noteTarget?.title}</h3>
            <textarea 
              className="note-modal-textarea"
              placeholder="הקלידי את ההערה כאן..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-save-note" onClick={handleSaveNote}>שמור הערה</button>
              <button className="btn-cancel-note" onClick={() => setIsNoteModalOpen(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* תצוגת תמונה במסך מלא */}
      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          <div className="fullscreen-content" onClick={e => e.stopPropagation()}>
            <img src={fullscreenImage} alt="Fullscreen" />
            <button className="close-btn" onClick={() => setFullscreenImage(null)}>&times;</button>
          </div>
        </div>
      )}

      <div className="history-search-card">
        <h2 className="history-title">חיפוש היסטוריית פאה 🔍</h2>
        
        <div className="history-search-wrapper">
          <input
            type="text"
            className="history-input"
            placeholder="הזינו קוד פאה (למשל WIG-1234)..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="history-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'מחפש...' : 'חפשי היסטוריה'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {history && (
          <div className="history-layout-wrapper animate-in">
            
            {/* --- סרגל צד: הערות פאה כלליות (Sticky Note) --- */}
            <aside className="wig-notes-sidebar">
              <div className="sidebar-sticky-content">
                <div className="notes-header">
                  <h4>📝 הערות פאה כלליות</h4>
                  <button 
                    onClick={() => openNoteModal('wig', `פאה (${history.wigDetails.orderCode})`)} 
                    className="add-sidebar-note"
                  >
                    +
                  </button>
                </div>
                
                <div className="notes-body">
                  {history.wigDetails.specialNotes ? (
                    <div className="sticky-note-paper">
                      {history.wigDetails.specialNotes}
                    </div>
                  ) : (
                    <p className="no-notes-placeholder">אין הערות כלליות לפאה זו.</p>
                  )}
                </div>

                <div className="sidebar-quick-info">
                  <div className="quick-item">
                    <label>סטטוס נוכחי:</label>
                    <span className="status-highlight">{history.wigDetails.currentStage || 'בייצור'}</span>
                  </div>
                  {history.wigDetails.isUrgent && <div className="urgent-tag-sidebar">🔥 טיפול דחוף</div>}
                </div>
              </div>
            </aside>

            {/* --- התוכן המרכזי: סיכום והיסטוריה --- */}
            <main className="history-content-main">
              {/* כרטיס סיכום פאה עליון */}
              <div className="wig-summary-card">
                <div className="summary-main-layout">
                  <div className="summary-text-info">
                    <div className="summary-header">
                      <div className="title-with-btn">
                         <h3>{history.wigDetails.wigType || history.wigDetails.wigModel || 'פאה כללית'}</h3>
                      </div>
                      <span className="barcode-badge">{history.wigDetails.orderCode}</span>
                    </div>
                    <div className="summary-grid">
                      <div className="summary-item"><label>לקוחה:</label><span>{history.wigDetails.customer?.firstName} {history.wigDetails.customer?.lastName}</span></div>
                      <div className="summary-item"><label>תאריך יצירה:</label><span>{new Date(history.wigDetails.createdAt).toLocaleDateString('he-IL')}</span></div>
                      <div className="summary-item"><label>סוג רשת:</label><span>{history.wigDetails.topConstruction || 'לא צוין'}</span></div>
                      <div className="summary-item"><label>דגם/סגנון:</label><span>{history.wigDetails.wigModel || 'לא צוין'}</span></div>
                      <div className="summary-item"><label>צבע:</label><span>{history.wigDetails.color || 'לא צוין'}</span></div>
                      <div className="summary-item"><label>אורך:</label><span>{history.wigDetails.length ? `${history.wigDetails.length} ס"מ` : 'לא צוין'}</span></div>
                      
                      {history.wigDetails.price && <div className="summary-item"><label>מחיר:</label><span className="price-tag">₪{history.wigDetails.price.toLocaleString()}</span></div>}
                    </div>
                  </div>

                  {history.wigDetails.images && history.wigDetails.images.length > 0 && (
                    <div className="summary-reference-photo">
                      <p className="micro-label">תמונת ייחוס:</p>
                      <img 
                        src={history.wigDetails.images[0]} 
                        alt="Reference" 
                        className="history-thumb-reference"
                        onClick={() => setFullscreenImage(history.wigDetails.images[0])}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="history-grid-layout">
                {/* עמודה 1: שלבי ייצור */}
                <div className="history-column">
                  <h4 className="column-title">🛠️ שלבי ייצור</h4>
                  {history.productionHistory?.length > 0 ? (
                    history.productionHistory.map((h: any, i: number) => (
                      <div key={i} className="history-item-box">
                        <div className="item-header-row">
                            <strong>{h.stage}</strong>
                            <button onClick={() => openNoteModal('production_stage', `שלב ${h.stage}`)} className="add-note-btn-small">+ הערה</button>
                        </div>
                        <div className="item-meta" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                          <div>📥 <strong>כניסה:</strong> {h.entryDate ? new Date(h.entryDate).toLocaleDateString('he-IL') : (h.date ? new Date(h.date).toLocaleDateString('he-IL') : '-')}</div>
                          <div>📤 <strong>סיום:</strong> <span style={{ color: h.exitDate ? 'inherit' : '#e67e22', fontWeight: h.exitDate ? 'normal' : 'bold' }}>{h.exitDate ? new Date(h.exitDate).toLocaleDateString('he-IL') : 'בתהליך עבודה'}</span></div>
                          <div>👤 <strong>אחראית:</strong> {h.workerId?.fullName || h.worker || 'לא הוקצה'}</div>
                          {h.notes && <div className="history-task-note"><strong>✍️ הערת שלב:</strong> {h.notes}</div>}
                        </div>
                      </div>
                    ))
                  ) : <p className="no-data">אין נתוני ייצור</p>}
                </div>

                {/* עמודה 2: שירותים וחפיפות */}
                <div className="history-column">
                  <h4 className="column-title">🧼 שירותים וחפיפות</h4>
                  {history.serviceHistory?.length > 0 ? (
                    history.serviceHistory.map((s: any, i: number) => (
                      <div key={i} className="history-item-box service-box">
                        <div className="status-row">
                          <strong>{s.serviceType}</strong>
                          <span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status}</span>
                        </div>
                        <div className="item-meta">
                          📅 {new Date(s.createdAt).toLocaleDateString('he-IL')}
                          {s.assignedTo && <span> | 👤 {s.assignedTo.fullName || s.assignedTo.username}</span>}
                        </div>
                        <button onClick={() => openNoteModal('service', `שירות ${s.serviceType}`)} className="add-note-btn-small" style={{marginTop: '10px'}}>+ הערה</button>
                      </div>
                    ))
                  ) : <p className="no-data">אין נתוני שירות</p>}
                </div>

                {/* עמודה 3: תיקונים */}
                <div className="history-column">
                  <h4 className="column-title">🧵 היסטוריית תיקונים</h4>
                  {history.repairHistory?.length > 0 ? (
                    history.repairHistory.map((r: any, i: number) => (
                      <div key={i} className="history-item-box repair-detailed-card">
                        <div className="repair-card-header">
                           <strong>סטטוס: {r.overallStatus}</strong>
                           <span className="date-label">📅 {new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                        <div className="repair-tasks-section">
                          <ul className="tasks-bullet-list">
                            {r.tasks?.map((t: any, idx: number) => (
                              <li key={idx} className="task-line-item">
                                <div className="task-header-row">
                                    <span>• <strong>{t.subCategory}</strong> - 👤 {t.assignedTo?.fullName || 'לא שובץ'}</span>
                                    <button onClick={() => openNoteModal('repair_task', `תיקון ${t.subCategory}`)} className="add-note-btn-small">+</button>
                                </div>
                                {t.notes && <div className="history-task-note"><strong>✍️ הערות:</strong> {t.notes}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {r.internalNote && (
                          <div className="internal-note-area">
                            <strong>📝 הערות פנימיות:</strong>
                            <p className="note-text">{r.internalNote}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : <p className="no-data">אין נתוני תיקונים</p>}
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};