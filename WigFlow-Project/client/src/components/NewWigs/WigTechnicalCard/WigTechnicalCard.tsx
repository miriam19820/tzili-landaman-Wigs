import React from 'react';
import './WigTechnicalCard.css';
import { Router } from 'react-router-dom';

interface WigTechnicalCardProps {
  wig: any; 
  onClose?: () => void; 
}

export const WigTechnicalCard: React.FC<WigTechnicalCardProps> = ({ wig, onClose }) => {
  const [isImageZoomed, setIsImageZoomed] = React.useState(false);
  if (!wig) return null;

  const userString = localStorage.getItem('user');
  const loggedInUser = userString ? JSON.parse(userString) : null;
  const isWorker = loggedInUser?.role === 'Worker'; 

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'לא הוזן';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const currentStageDeadline = wig.stageDeadlines ? wig.stageDeadlines[wig.currentStage] : null;
  const formattedDeadline = currentStageDeadline ? formatDate(currentStageDeadline) : null;

  return (
    <div className="technical-card-overlay">
      <div className="technical-card-container">
        
       <div className="card-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {onClose && (
           <button className="close-btn" onClick={onClose} title="סגירה">✕</button>
            )}
          <h2>מפרט טכני מורחב: {wig.orderCode} {wig.isUrgent ? '(דחוף)' : ''}</h2>
        </div>

        {wig.qaNote && (
          <div className="qa-alert-box">
            <h3>הערות בקרת איכות לתיקון:</h3>
            <p>{wig.qaNote}</p>
          </div>
        )}

        <div className="card-content">
          <div className="info-column">
            <h3>ניהול וזמנים</h3>
            <ul>
              <li><strong>לקוחה:</strong> {wig.customer?.firstName} {wig.customer?.lastName}</li>
              <li><strong>סוג פאה:</strong> {wig.wigType || 'לא צוין'}</li>
              <li><strong>פאנית מטפלת:</strong> {wig.wigMakerName || 'לא צוין'}</li>
              <li><strong>תאריך קבלה:</strong> {formatDate(wig.receivedDate)}</li>
              <li><strong>תאריך יעד סופי:</strong> <span className="target-date-text">{formatDate(wig.targetDate)}</span></li>
              
              <li style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #ccc' }}>
                <strong>שלב נוכחי:</strong> <span className="highlight-badge">{wig.currentStage}</span>
              </li>
              
              {formattedDeadline && formattedDeadline !== 'לא הוזן' && (
                <li>
                  <strong>דד-ליין לשלב:</strong> <span className="deadline-text">{formattedDeadline}</span>
                </li>
              )}
            </ul>

            {!isWorker && (
              <>
                <h3 style={{ marginTop: '20px' }}>תשלום וסטטוס</h3>
                <ul>
                  <li><strong>מחיר סה"כ:</strong> ₪{wig.price?.toLocaleString() || 0}</li>
                  <li><strong>מקדמה:</strong> ₪{wig.advancePayment?.toLocaleString() || 0}</li>
                  <li><strong>יתרה:</strong> <strong style={{ color: '#d32f2f' }}>₪{wig.balancePayment?.toLocaleString() || 0}</strong></li>
                  <li><strong>חתימה:</strong> {wig.customerSignature ? 'חתומה' : 'טרם נחתם'}</li>
                </ul>
              </>
            )}
          </div>

          <div className="info-column">
            <h3>מפרט תפירה ושיער</h3>
            <ul>
              <li><strong>סוג שיער:</strong> {wig.hairType || 'לא צוין'}</li>
              <li><strong>מידת רשת:</strong> {wig.netSize || 'לא צוין'}</li>
              <li><strong>אורך עורף:</strong> {wig.napeLength || 'לא צוין'}</li>
              <li><strong>דירוג עליון:</strong> {wig.topLayering || 'לא צוין'}</li>
            </ul>

            <h3>צבע וגוונים</h3>
            <ul>
              <li><strong>צבע בסיס:</strong> {wig.baseColor || 'לא צוין'}</li>
              <li><strong>גווני טרסים:</strong> {wig.highlightsWefts || 'ללא'}</li>
              <li><strong>גווני סקין:</strong> {wig.highlightsSkin || 'ללא'}</li>
            </ul>

            <h3>מידות ראש (ס"מ)</h3>
            {wig.measurements ? (
              <ul className="measurements-list">
                <li><span>היקף:</span> <strong>{wig.measurements.circumference || '-'}</strong></li>
                <li><span>אוזן לאוזן:</span> <strong>{wig.measurements.earToEar || '-'}</strong></li>
                <li><span>פדחת לעורף:</span> <strong>{wig.measurements.frontToBack || '-'}</strong></li>
              </ul>
            ) : <p>לא הוזנו מידות</p>}
          </div>

          <div className="info-column">
            <h3>סקין ופרונט</h3>
            <ul>
              <li><strong>סוג סקין/טופ:</strong> {wig.topConstruction || 'לא צוין'}</li>
              <li><strong>הערות טופ:</strong> {wig.topNotes || 'ללא'}</li>
              <li><strong>עיצוב פרונט:</strong> {Array.isArray(wig.frontStyle) ? wig.frontStyle.join(', ') : (wig.frontStyle || 'לא צוין')}</li>
              <li><strong>הערות פרונט:</strong> {wig.frontNotes || 'ללא'}</li>
            </ul>

        
             {wig.imageUrl && (
              <div className="inspiration-image">
                <h4>תמונה (לחצי להגדלה):</h4>
                <div className="photo-container" onClick={() => setIsImageZoomed(true)}>
                  <img src={wig.imageUrl} alt="Inspiration" className="repair-img" />
                </div>
              </div>
            )}
                   </div>
        </div> 

        {wig.specialNotes && (
          <div className="special-notes-footer">
            <strong>הערות מיוחדות לצוות:</strong> {wig.specialNotes}
          </div>
        )}

       {isImageZoomed && (
        <div className="fullscreen-photo-overlay" onClick={() => setIsImageZoomed(false)}>
          <button className="fullscreen-close-btn" onClick={() => setIsImageZoomed(false)}>✕</button>
          <img src={wig.imageUrl} alt="Wig Fullscreen" className="fullscreen-target-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

       
     
     
    
      </div>
    </div>
  );
};