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
      // קריאה ל-Router החדש שבנינו ב-Backend
      const response = await axios.get(`/wig-history/${barcode}`);
      const allEvents = response.data.data;

      if (!allEvents || allEvents.length === 0) {
        throw new Error('לא נמצאה היסטוריה עבור קוד זה');
      }

      // מיון הנתונים לפי הסוגים שהגדרנו ב-Backend (actionType)
      const formattedData = {
        // לוקחים את פרטי הפאה מהאירוע הראשון (כי כולם שייכים לאותה פאה)
        wigDetails: allEvents[0]?.wigId || {}, 
        productionHistory: allEvents.filter((e: any) => e.actionType === 'יצור'),
        serviceHistory: allEvents.filter((e: any) => e.actionType === 'סירוק'),
        repairHistory: allEvents.filter((e: any) => e.actionType === 'תיקון')
      };

      setHistory(formattedData);
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
    if (!noteText.trim()) return;
    try {
      await axios.post('/wig-history/add-note', {
        wigCode: barcode,
        note: noteText,
        workerName: 'מנהלת' 
      });
      alert('הערה נשמרה בהיסטוריה!');
      setIsNoteModalOpen(false);
      handleSearch();
    } catch (error) {
      alert('שגיאה בשמירת ההערה');
    }
  };

  return (
    <div className="history-page-container" dir="rtl">
      
      {/* מודל הערות (נשאר כפי שהיה) */}
      {isNoteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
          <div className="note-modal-content" onClick={e => e.stopPropagation()}>
            <h3>הוספת הערה: {noteTarget?.title}</h3>
            <textarea 
              className="note-modal-textarea"
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
            placeholder="הזינו קוד פאה..."
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
            {/* סרגל צד (Sticky Note) */}
            <aside className="wig-notes-sidebar">
              <div className="sidebar-sticky-content">
                <div className="notes-header">
                  <h4>📝 הערות כלליות</h4>
                  <button onClick={() => openNoteModal('wig', `פאה ${barcode}`)} className="add-sidebar-note">+</button>
                </div>
                <div className="notes-body">
                  <div className="sticky-note-paper">
                    {history.wigDetails.specialNotes || "אין הערות כלליות."}
                  </div>
                </div>
              </div>
            </aside>

            <main className="history-content-main">
              {/* כרטיס סיכום פאה עליון */}
              <div className="wig-summary-card">
                <div className="summary-main-layout">
                  <div className="summary-text-info">
                    <h3>{history.wigDetails.wigType || 'פרטי פאה'} | {barcode}</h3>
                    <div className="summary-grid">
                      <div className="summary-item"><label>לקוחה:</label><span>{history.wigDetails.customer?.firstName} {history.wigDetails.customer?.lastName}</span></div>
                      <div className="summary-item"><label>סטטוס:</label><span className="status-highlight">{history.wigDetails.currentStage}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="history-grid-layout">
                {/* עמודה 1: שלבי ייצור */}
                <div className="history-column">
                  <h4 className="column-title">🛠️ שלבי ייצור</h4>
                  {history.productionHistory.map((h: any, i: number) => (
                    <div key={i} className="history-item-box">
                      <strong>{h.stage}</strong>
                      <div className="item-meta">
                        📅 {new Date(h.createdAt).toLocaleDateString('he-IL')} | 👤 {h.workerName}
                      </div>
                      {h.description && <p className="history-desc">{h.description}</p>}
                    </div>
                  ))}
                </div>

                {/* עמודה 2: שירותים וחפיפות */}
                <div className="history-column">
                  <h4 className="column-title">🧼 שירותים וחפיפות</h4>
                  {history.serviceHistory.map((s: any, i: number) => (
                    <div key={i} className="history-item-box service-box">
                      <strong>{s.stage}</strong>
                      <div className="item-meta">
                        📅 {new Date(s.createdAt).toLocaleDateString('he-IL')}
                      </div>
                      <p>{s.description}</p>
                    </div>
                  ))}
                </div>

                {/* עמודה 3: תיקונים (עם תמונות!) */}
                <div className="history-column">
                  <h4 className="column-title">🧵 היסטוריית תיקונים</h4>
                  {history.repairHistory.map((r: any, i: number) => (
                    <div key={i} className="history-item-box repair-detailed-card">
                      <div className="repair-card-header">
                        <strong>{r.stage}</strong>
                        <span>{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      <p className="repair-desc">{r.description}</p>
                      
                      {/* הצגת תמונות לפני ואחרי */}
                      <div className="repair-images-preview">
                        {r.beforeImageUrl && (
                          <div className="img-container">
                            <label>לפני:</label>
                            <img 
                              src={r.beforeImageUrl} 
                              onClick={() => setFullscreenImage(r.beforeImageUrl)} 
                              alt="לפני" 
                            />
                          </div>
                        )}
                        {r.afterImageUrl && (
                          <div className="img-container">
                            <label>אחרי:</label>
                            <img 
                              src={r.afterImageUrl} 
                              onClick={() => setFullscreenImage(r.afterImageUrl)} 
                              alt="אחרי" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};