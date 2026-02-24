import React from 'react';
import './WigTechnicalCard.css';


interface WigTechnicalCardProps {
  wig: any; 
  onClose?: () => void; 
}

export const WigTechnicalCard: React.FC<WigTechnicalCardProps> = ({ wig, onClose }) => {
  if (!wig) return null;

  return (
    <div className="technical-card-overlay">
      <div className="technical-card-container">
        
   
        <div className="card-header">
          <h2>מפרט טכני לפאה: {wig.orderCode}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✖</button>
          )}
        </div>

        <div className="card-content">
          
          <div className="info-column">
            <h3>📌 פרטים כלליים</h3>
            <ul>
              <li><strong>לקוחה:</strong> {wig.customer?.firstName} {wig.customer?.lastName}</li>
              <li><strong>מקבלת הזמנה:</strong> {wig.receivedBy || 'לא צוין'}</li>
              <li><strong>שלב נוכחי:</strong> <span className="highlight-badge">{wig.currentStage}</span></li>
            </ul>

            <h3>📏 מידות ראש (ס"מ)</h3>
            {wig.measurements ? (
              <ul className="measurements-list">
                <li><span>היקף:</span> <strong>{wig.measurements.circumference}</strong></li>
                <li><span>מאוזן לאוזן:</span> <strong>{wig.measurements.earToEar}</strong></li>
                <li><span>פדחת לעורף:</span> <strong>{wig.measurements.frontToBack}</strong></li>
              </ul>
            ) : (
              <p>לא הוזנו מידות</p>
            )}
          </div>

          {/* עמודה אמצעית - מפרט שיער ורשת */}
          <div className="info-column">
            <h3>✂️ מפרט תפירה ושיער</h3>
            <ul>
              <li><strong>מידת רשת:</strong> {wig.netSize || 'לא צוין'}</li>
              <li><strong>סוג שיער:</strong> {wig.hairType || 'לא צוין'}</li>
              <li><strong>אורך עורף:</strong> {wig.napeLength || 'לא צוין'}</li>
              <li><strong>דירוג עליון:</strong> {wig.topLayering || 'לא צוין'}</li>
            </ul>

            <h3>🎨 צבע וגוונים</h3>
            <ul>
              <li><strong>צבע בסיס:</strong> {wig.baseColor || 'לא צוין'}</li>
              <li><strong>גווני טרסים:</strong> {wig.highlightsWefts || 'ללא'}</li>
              <li><strong>גווני סקין:</strong> {wig.highlightsSkin || 'ללא'}</li>
            </ul>
          </div>

          {/* עמודה שמאלית - סקין, פרונט והערות */}
          <div className="info-column">
            <h3>👑 סקין ופרונט</h3>
            <ul>
              <li><strong>סוג סקין:</strong> {wig.topConstruction || 'לא צוין'}</li>
              <li><strong>הערות טופ:</strong> {wig.topNotes || 'ללא'}</li>
              <li><strong>עיצוב פרונט (ע"י):</strong> {wig.frontStyle || 'לא צוין'}</li>
              <li><strong>הערות פרונט:</strong> {wig.frontNotes || 'ללא'}</li>
            </ul>

            {/* שדרוג תמונה! אם יש תמונה, היא תוצג כאן */}
            {wig.imageUrl && (
              <div className="inspiration-image">
                <h4>תמונת השראה / מבנה פנים:</h4>
                <img src={wig.imageUrl} alt="Inspiration" />
              </div>
            )}
          </div>

        </div>

        {wig.specialNotes && (
          <div className="special-notes-footer">
            <strong>⚠️ הערות מיוחדות לצוות הייצור:</strong> {wig.specialNotes}
          </div>
        )}

      </div>
    </div>
  );
};
