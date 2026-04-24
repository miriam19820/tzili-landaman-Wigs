import React, { useState, useEffect, useRef } from 'react';
import { StaffAllocator } from '../StaffAllocator/StaffAllocator';
import './DiagnosisChecklist.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
const REPAIR_CATEGORIES = [
  { id: 'machine', name: 'מכונה', subTypes: ['העברת רשת', 'תיקון רשת', 'התקנת לייס', 'התקנת ריבן', 'השטחת סקין', 'הארכת פאה', 'דילול טרסים', 'מילוי טרסים', 'קיצור פאה'] },
  { id: 'color', name: 'צבע', subTypes: ['גוונים', 'שורש', 'שטיפה לעש', 'הבהרה לבלונד'] },
  { id: 'hand', name: 'עבודת יד', subTypes: ['מילוי לייס', 'מילוי ריבן', 'בייביהייר', 'ע"י ישנה', 'גובה בקודקוד'] }
];

export const DiagnosisChecklist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [customerSearch, setCustomerSearch] = useState(''); 
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerGeneralNote, setCustomerGeneralNote] = useState(''); // שדה להערה כללית על הלקוחה
  const [wigCode, setWigCode] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  
  const [categoryWorkers, setCategoryWorkers] = useState<Record<string, string>>({});
  const [categoryDeadlines, setCategoryDeadlines] = useState<Record<string, string>>({}); 
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});

  const [washerId, setWasherId] = useState('');
  const [adminId, setAdminId] = useState('');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (location.state?.idNumber) {
      const returnedId = location.state.idNumber;
      setCustomerSearch(returnedId);
      handleSearchById(returnedId);
    }
    return () => stopCamera(); 
  }, [location.state]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { 
      alert("לא הצלחנו לגשת למצלמה.");
      setIsCameraOpen(false); 
    }
  };

  const capturePhoto = () => {
    if (capturedImages.length >= 2) return;
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8); 
        setCapturedImages(prev => [...prev, dataUrl]);
        if (capturedImages.length === 1) stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const removePhoto = (index: number) => setCapturedImages(prev => prev.filter((_, i) => i !== index));

  const handleSearchById = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${encodeURIComponent(id)}`);
      const responseData = response.data !== undefined ? response.data : response;
      if (responseData.exists) {
        setCustomerId(responseData.customer._id);
        setCustomerName(`${responseData.customer.firstName} ${responseData.customer.lastName}`);
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const handleSearchCustomer = async () => {
    if (!customerSearch.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`/customers/search/${encodeURIComponent(customerSearch)}`);
      const responseData = response.data !== undefined ? response.data : response;
      if (responseData.exists) {
        setCustomerId(responseData.customer._id);
        setCustomerName(`${responseData.customer.firstName} ${responseData.customer.lastName}`);
      } else {
        if (window.confirm("לקוחה לא נמצאה. תרצי לרשום אותה?")) {
          navigate('/repairs/quick-customer', { state: { idNumber: customerSearch } });
        }
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const handleCategoryWorkerChange = (categoryName: string, workerId: string) => {
    setCategoryWorkers(prev => ({ ...prev, [categoryName]: workerId }));
    setSelectedTasks(prev => prev.map(t => t.category === categoryName ? { ...t, assignedTo: workerId } : t));
  };

  const handleCategoryDeadlineChange = (categoryName: string, deadline: string) => {
    setCategoryDeadlines(prev => ({ ...prev, [categoryName]: deadline }));
    setSelectedTasks(prev => prev.map(t => t.category === categoryName ? { ...t, deadline } : t));
  };

  const handleCategoryNoteChange = (categoryName: string, note: string) => {
    setCategoryNotes(prev => ({ ...prev, [categoryName]: note }));
    setSelectedTasks(prev => prev.map(t => t.category === categoryName ? { ...t, notes: note } : t));
  };

  const toggleTask = (category: string, subCategory: string) => {
    const exists = selectedTasks.find(t => t.category === category && t.subCategory === subCategory);
    if (exists) {
      setSelectedTasks(selectedTasks.filter(t => t !== exists));
    } else {
      setSelectedTasks([...selectedTasks, { 
        category, 
        subCategory, 
        assignedTo: categoryWorkers[category] || '', 
        deadline: categoryDeadlines[category] || undefined, 
        notes: categoryNotes[category] || '', 
        status: 'ממתין' 
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!customerId || !wigCode || selectedTasks.length === 0) {
      alert("נא לוודא זיהוי לקוחה, קוד פאה ובחירת תיקונים");
      return;
    }

    if (!washerId || !adminId) {
      alert("נא לשבץ עובדת לחפיפה ומבקרת איכות לסיום התהליך");
      return;
    }

    const unassigned = selectedTasks.find(t => !t.assignedTo);
    if (unassigned) {
      alert(`נא לבחור עובדת עבור קטגוריית ${unassigned.category}`);
      return;
    }

    setLoading(true);

    const repairData = {
      customerId,
      wigCode,
      isUrgent,
      tasks: selectedTasks,
      washerId, 
      adminId,  
      images: capturedImages,
      overallStatus: 'בתיקון',
      internalNote: `${customerGeneralNote ? `[הערת לקוחה]: ${customerGeneralNote} \n` : ''}${internalNote}`
    };

    try {
      const response = await axios.post('/repairs', repairData);

      if (response.status === 201 || response.status === 200) {
        alert('✅ התיקון נשמר בהצלחה והועבר לתחנות!');
        setSelectedTasks([]);
        setCategoryWorkers({});
        setCategoryDeadlines({});
        setCategoryNotes({});
        setWigCode('');
        setCustomerId('');
        setCustomerName('');
        setCustomerSearch('');
        setCustomerGeneralNote('');
        setCapturedImages([]);
        setInternalNote('');
        setIsUrgent(false);
        setWasherId('');
        setAdminId('');
      }
    } catch (error: any) {
      alert(`שגיאה: ${error.response?.data?.message || 'שגיאת תקשורת'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diagnosis-container" dir="rtl">
      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Full" className="fullscreen-img" />
        </div>
      )}

      <h2 className="diagnosis-title">קבלת פאה לתיקון</h2>
      
      {/* אזור לקוחה מרווח ובולט */}
      <div className="card-section customer-section">
        <div className="section-subtitle">פרטי הלקוחה</div>
        
        <div className="search-controls">
          <input type="text" placeholder="חיפוש לקוחה לפי שם או ת.ז..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
          <button className="search-btn" onClick={handleSearchCustomer} disabled={loading}>{loading ? 'מחפש...' : 'חפשי'}</button>
        </div>
        
        {customerName && <p className="customer-found-msg">לקוחה נבחרה: <strong>{customerName}</strong></p>}
        
        <div className="customer-note-wrapper">
          <label className="big-label">דגשים מיוחדים על הלקוחה:</label>
          <textarea 
            className="huge-textarea general-note" 
            placeholder="לדוגמה: לקוחה רגישה מאוד, חשוב לה יחס אישי, לשים לב ש..."
            value={customerGeneralNote}
            onChange={(e) => setCustomerGeneralNote(e.target.value)}
          />
        </div>
      </div>

      <div className="card-section basic-info-row">
        <div className="input-group">
           <label className="big-label">קוד הפאה במערכת:</label>
           <input className="wig-code-input" placeholder="למשל: REP-12345" value={wigCode} onChange={e => setWigCode(e.target.value)} />
        </div>
        <label className={`urgent-toggle ${isUrgent ? 'is-urgent' : ''}`}>
          <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
          דחוף
        </label>
      </div>


      <div className="card-section camera-section">
        <div className="section-subtitle">תמונת מצב</div>
        {!isCameraOpen && capturedImages.length < 2 && (
          <button onClick={startCamera} className="camera-open-btn">+ צלמי מצב פאה מהנייד/טאבלט</button>
        )}
        {isCameraOpen && (
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay playsInline className="video-preview"></video>
            <div className="camera-actions">
          <button onClick={capturePhoto} className="btn-capture">צלמי</button>
              <button onClick={stopCamera} className="btn-close">סגור מצלמה</button>
            </div>
          </div>
        )}
        <div className="captured-photos">
          {capturedImages.map((img, idx) => (
            <div key={idx} className="photo-thumb-container">
              <img src={img} alt="captured" onClick={() => setFullscreenImage(img)} className="photo-thumb" />
              <button onClick={() => removePhoto(idx)} className="btn-remove-photo">X</button>
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>


      <div className="categories-grid">
        {REPAIR_CATEGORIES.map(cat => (
          <div key={cat.id} className="category-card">
            <h3 className="category-title">{cat.name}</h3>
            
            <div className="category-worker-box">
              <label className="small-label">עובדת:</label>
              <StaffAllocator category={cat.name} onSelect={(workerId) => handleCategoryWorkerChange(cat.name, workerId)} />
              
              <label className="small-label">תאריך יעד:</label>
              <input type="date" className="deadline-input" onChange={(e) => handleCategoryDeadlineChange(cat.name, e.target.value)} />
            </div>

            <div className="tasks-list">
              <label className="small-label">משימות לביצוע:</label>
              {cat.subTypes.map(sub => {
                const isSelected = selectedTasks.find(t => t.subCategory === sub);
                return (
                  <label key={sub} className={`task-row ${isSelected ? 'active' : ''}`}>
                    <input type="checkbox" checked={!!isSelected} onChange={() => toggleTask(cat.name, sub)} />
                    <span className="task-name">{sub}</span>
                  </label>
                );
              })}
            </div>

            <div className="category-note-box">
                <label className="small-label">הוראות והערות לשלב {cat.name}:</label>
                <textarea 
                  className="huge-textarea category-note-input" 
                  placeholder={`פרטי במדויק מה העובדת צריכה לעשות בשלב ה${cat.name}...`}
                  value={categoryNotes[cat.name] || ''}
                  onChange={(e) => handleCategoryNoteChange(cat.name, e.target.value)}
                />
            </div>
          </div>
        ))}
      </div>


      <div className="card-section final-stages-section">
        <div className="section-subtitle">שלבי סיום — חפיפה ובקרת איכות</div>
        <div className="final-stages-grid">
          <div className="final-stage-box">
            <label className="big-label">חופפת וספרית</label>
            <StaffAllocator category="חפיפה" onSelect={(id) => setWasherId(id)} />
          </div>
          <div className="final-stage-box">
            <label className="big-label">מבקרת איכות</label>
            <StaffAllocator category="בקרה" onSelect={(id) => setAdminId(id)} />
          </div>
        </div>
      </div>

   

      <button className="main-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'שומר ומעביר לתחנות...' : 'שמירה ושליחה לביצוע התיקון'}
      </button>
    </div>
  );
};