import React, { useState } from 'react';
import axios from 'axios';
import './WigHistorySearch.css';

const TimelineItem: React.FC<{ item: any; type: 'production' | 'service' | 'repair'; onNote: () => void; onImageClick: (url: string) => void }> = ({ item, type, onNote, onImageClick }) => {
  const [open, setOpen] = useState(false);

  const getStageName = () => {
    if (type === 'production') return item.stage;
    if (type === 'service') return item.serviceType;
    return `תיקון — ${item.overallStatus}`;
  };

  const getDate = () => {
    const d = item.entryDate || item.date || item.createdAt;
    return d ? new Date(d).toLocaleDateString('he-IL') : '—';
  };

  const isDone = !!item.exitDate || item.status === 'מוכן' || item.overallStatus === 'הושלם';
  const isActive = !isDone && (item.status === 'בתהליך' || !item.exitDate);

  const dotClass = isDone ? 'done' : isActive ? 'active' : '';
  const pillClass = isDone ? 'done' : isActive ? 'active' : 'pending';
  const pillLabel = isDone ? 'הושלם' : isActive ? 'בתהליך' : 'ממתין';

  return (
    <div className="timeline-item">
      <div className={`timeline-dot ${dotClass}`} />
      <div className="history-item-box">
        <div className="item-header-row" onClick={() => setOpen(o => !o)}>
          <div className="item-header-left">
            <span className="item-stage-name">{getStageName()}</span>
            <span className="item-date-pill">{getDate()}</span>
          </div>
          <span className={`item-status-pill ${pillClass}`}>{pillLabel}</span>
          <span className={`item-expand-icon ${open ? 'open' : ''}`}>▼</span>
        </div>

        {open && (
          <div className="item-body">
            {type === 'production' && (
              <>
                {item.exitDate && (
                  <div className="item-meta-row">
                    <span className="item-meta-label">סיום</span>
                    <span>{new Date(item.exitDate).toLocaleDateString('he-IL')}</span>
                  </div>
                )}
                {!item.exitDate && (
                  <div className="item-meta-row">
                    <span className="item-meta-label">סיום</span>
                    <span style={{ color: 'var(--zili-warning)', fontWeight: 600 }}>בתהליך עבודה</span>
                  </div>
                )}
                <div className="item-meta-row">
                  <span className="item-meta-label">אחראית</span>
                  <span>{item.workerId?.fullName || item.worker || 'לא הוקצה'}</span>
                </div>
                {item.notes && <div className="item-note-box">{item.notes}</div>}
              </>
            )}

            {type === 'service' && (
              <>
                <div className="item-meta-row">
                  <span className="item-meta-label">סוג שירות</span>
                  <span>{item.serviceType || '—'}</span>
                </div>
                
                {item.styleCategory && item.styleCategory !== 'ללא' && (
                  <div className="item-meta-row">
                    <span className="item-meta-label">סגנון</span>
                    <span>{item.styleCategory}</span>
                  </div>
                )}

                {/* בלוק בולט לפסילות QA עם תמונה והערות */}
                {item.status === 'Rejected' && (
                  <div style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', padding: '12px', borderRadius: '6px', marginTop: '10px' }}>
                    <strong style={{ color: '#cf1322', display: 'block', marginBottom: '8px' }}>
                      ⚠️ הפאה נפסלה בבקרת איכות
                    </strong>
                    <p style={{ fontSize: '13px', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', color: '#5c0011', lineHeight: '1.5' }}>
                      {item.notes?.qa || item.note}
                    </p>

                    {item.qaRejectionPhoto && (
                      <img
                        src={item.qaRejectionPhoto}
                        alt="תמונת התקלה מהבקרה"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #ffccc7', cursor: 'zoom-in' }}
                        onClick={() => onImageClick(item.qaRejectionPhoto)}
                      />
                    )}
                  </div>
                )}

                {item.assignedTo && (
                  <div className="item-meta-row" style={{ marginTop: '8px' }}>
                    <span className="item-meta-label">עובדת</span>
                    <span>{item.assignedTo.fullName || item.assignedTo.username}</span>
                  </div>
                )}

                {/* הערה רגילה אם זה לא פסילה */}
                {item.status !== 'Rejected' && item.note && (
                  <div className="item-note-box">{item.note}</div>
                )}

                {/* תמונת אישור סופי אם הפאה אושרה ב-QA */}
                {item.status === 'Ready' && item.afterImageUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <span className="item-meta-label">אושר סופית בבקרת איכות:</span>
                    <img 
                      src={item.afterImageUrl} 
                      alt="תמונת אישור" 
                      style={{ display: 'block', marginTop: '6px', width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #b7eb8f', cursor: 'zoom-in' }} 
                      onClick={() => onImageClick(item.afterImageUrl)}
                    />
                  </div>
                )}
              </>
            )}

            {type === 'repair' && (
              <>
                {/* תמונת ה"לפני" של התיקון */}
                {item.beforeImageUrl && (
                  <div style={{ marginBottom: '12px' }}>
                    <span className="item-meta-label">תמונת הבעיה בקבלת התיקון:</span>
                    <img 
                      src={item.beforeImageUrl} 
                      alt="לפני התיקון" 
                      style={{ display: 'block', marginTop: '6px', width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--zili-border)', cursor: 'zoom-in' }} 
                      onClick={() => onImageClick(item.beforeImageUrl)}
                    />
                  </div>
                )}
                
                <ul className="tasks-bullet-list">
                  {item.tasks?.map((t: any, idx: number) => (
                    <li key={idx} className="task-line-item">
                      <div className="task-header-row">
                        <span><strong>{t.subCategory}</strong> — {t.assignedTo?.fullName || 'לא שובץ'}</span>
                      </div>
                      {t.notes && <div className="history-task-note">{t.notes}</div>}
                    </li>
                  ))}
                </ul>
                {item.internalNote && (
                  <div className="internal-note-area">
                    <strong>הערה פנימית</strong>
                    <p className="note-text">{item.internalNote}</p>
                  </div>
                )}
              </>
            )}

            <button className="add-note-btn-small" onClick={onNote} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              + הוסף הערה
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WigHistorySearch: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTarget, setNoteTarget] = useState<{ type: string; id?: string; title: string } | null>(null);

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/wigs/history/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'לא נמצאה פאה עם קוד זה');
      setHistory(null);
    } finally { setLoading(false); }
  };

  const openNoteModal = (type: string, title: string, id?: string) => {
    setNoteTarget({ type, id, title });
    setNoteText('');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) { alert('נא להזין תוכן להערה'); return; }

    const customerId = history?.wigDetails?.customer?._id;
    if (!customerId) {
      alert('לא ניתן לשמור הערה: לא נמצא מזהה לקוחה.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/customers/${customerId}/notes`,
        {
          content: noteText,
          context: noteTarget?.title || 'הערת היסטוריה'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`ההערה עבור "${noteTarget?.title}" נשמרה בהצלחה`);
      setIsNoteModalOpen(false);
      handleSearch(); 
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת ההערה');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!noteId) return;
    if (!window.confirm('האם את בטוחה שברצונך למחוק הערה זו?')) return;

    const customerId = history?.wigDetails?.customer?._id;
    if (!customerId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/customers/${customerId}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleSearch();
    } catch (err) {
      console.error(err);
      alert('שגיאה במחיקת ההערה');
    }
  };

  return (
    <div className="history-page-container" dir="rtl">

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
          <div className="note-modal-content" onClick={e => e.stopPropagation()}>
            <h3>הוספת הערה — {noteTarget?.title}</h3>
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

      {/* Fullscreen Image */}
      {fullscreenImage && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(61, 43, 46, 0.88)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt="תמונה מוגדלת" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} 
          />
          <button style={{ position: 'absolute', top: '20px', left: '20px', background: 'var(--zili-white)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', color: 'var(--zili-deep)', cursor: 'pointer' }} onClick={() => setFullscreenImage(null)}>✕</button>
        </div>
      )}

      <div className="history-header">
        <h2 className="history-title">היסטוריית פאה</h2>
        <p className="history-subtitle">חיפוש לפי קוד פאה — כל הטיפולים, השלבים וההערות במקום אחד</p>
      </div>

      {/* Search */}
      <div className="history-search-bar">
        <input
          type="text"
          className="history-input"
          placeholder="קוד פאה (למשל: WIG-1234)..."
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

          {/* Sidebar */}
          <aside className="wig-notes-sidebar">
            <div className="sidebar-sticky-content">
              <div className="notes-header">
                <h4>הערות כלליות</h4>
                <button onClick={() => openNoteModal('wig', `פאה (${history.wigDetails.orderCode})`)} className="add-sidebar-note">+</button>
              </div>
              <div className="notes-body">
                {history.wigDetails.specialNotes
                  ? <div className="sticky-note-paper">{history.wigDetails.specialNotes}</div>
                  : <p className="no-notes-placeholder">אין הערות כלליות</p>
                }
              </div>

              {history.wigDetails.customer?.internalNotes && history.wigDetails.customer.internalNotes.length > 0 && (
                <div className="customer-internal-notes" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--zili-border)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zili-muted)', marginBottom: '10px' }}>היסטוריית הערות לקוחה:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...history.wigDetails.customer.internalNotes].reverse().map((note: any, index: number) => (
                      <div key={note._id || index} className="sticky-note-paper" style={{ background: '#fff3cd', borderColor: '#ffc107', position: 'relative' }}>
                        
                        {note._id && (
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: '#856404',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              opacity: 0.5,
                              padding: '2px 6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            title="מחק הערה"
                          >
                            ✕
                          </button>
                        )}

                        <div style={{ fontSize: '10.5px', color: '#856404', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px', paddingLeft: '20px' }}>
                          <strong style={{ opacity: 0.8 }}>{note.context || 'הערה'}</strong>
                          <span>{new Date(note.createdAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="sidebar-quick-info">
                <div className="quick-item">
                  <label>סטטוס נוכחי</label>
                  <span className="status-highlight">{history.wigDetails.currentStage || 'בייצור'}</span>
                </div>
                {history.wigDetails.isUrgent && <div className="urgent-tag-sidebar">דחוף</div>}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="history-content-main">

            {/* Summary Card */}
            <div className="wig-summary-card">
              <div className="summary-main-layout">
                <div className="summary-text-info" style={{ flex: 1 }}>
                  <div className="summary-header">
                    <h3>{history.wigDetails.wigType || history.wigDetails.wigModel || 'פאה'}</h3>
                    <span className="barcode-badge">{history.wigDetails.orderCode}</span>
                  </div>
                  <div className="summary-grid">
                    <div className="summary-item"><label>לקוחה</label><span>{history.wigDetails.customer?.firstName} {history.wigDetails.customer?.lastName}</span></div>
                    <div className="summary-item"><label>תאריך יצירה</label><span>{new Date(history.wigDetails.createdAt).toLocaleDateString('he-IL')}</span></div>
                    <div className="summary-item"><label>סוג רשת</label><span>{history.wigDetails.topConstruction || '—'}</span></div>
                    <div className="summary-item"><label>צבע</label><span>{history.wigDetails.color || '—'}</span></div>
                    {history.wigDetails.price && (
                      <div className="summary-item"><label>מחיר</label><span className="price-tag">₪{history.wigDetails.price.toLocaleString()}</span></div>
                    )}
                  </div>
                </div>
                {history.wigDetails.images?.[0] && (
                  <div className="summary-reference-photo">
                    <p className="micro-label">תמונת ייחוס</p>
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

            {/* Timeline Columns */}
            <div className="history-grid-layout">

              {/* Production */}
              <div className="history-column">
                <div className="column-title">שלבי ייצור</div>
                {history.productionHistory?.length > 0 ? (
                  <div className="timeline">
                    {history.productionHistory.map((h: any, i: number) => (
                      <TimelineItem key={i} item={h} type="production"
                        onNote={() => openNoteModal('production_stage', `שלב ${h.stage}`)}
                        onImageClick={(url) => setFullscreenImage(url)} />
                    ))}
                  </div>
                ) : <p className="no-data">אין נתוני ייצור</p>}
              </div>

              {/* Services */}
              <div className="history-column">
                <div className="column-title">שירותים וחפיפות</div>
                {history.serviceHistory?.length > 0 ? (
                  <div className="timeline">
                    {history.serviceHistory.map((s: any, i: number) => (
                      <TimelineItem key={i} item={s} type="service"
                        onNote={() => openNoteModal('service', `שירות ${s.serviceType}`)}
                        onImageClick={(url) => setFullscreenImage(url)} />
                    ))}
                  </div>
                ) : <p className="no-data">אין נתוני שירות</p>}
              </div>

              {/* Repairs */}
              <div className="history-column">
                <div className="column-title">תיקונים</div>
                {history.repairHistory?.length > 0 ? (
                  <div className="timeline">
                    {history.repairHistory.map((r: any, i: number) => (
                      <TimelineItem key={i} item={r} type="repair"
                        onNote={() => openNoteModal('repair', `תיקון ${r.overallStatus}`)}
                        onImageClick={(url) => setFullscreenImage(url)} />
                    ))}
                  </div>
                ) : <p className="no-data">אין נתוני תיקונים</p>}
              </div>

            </div>
          </main>
        </div>
      )}
    </div>
  );
};