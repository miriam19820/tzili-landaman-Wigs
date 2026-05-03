import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './ProductionStation.css';
import { WigTechnicalCard } from '../WigTechnicalCard/WigTechnicalCard';
import { TaskItem, WorkerTask } from '../../Repairs/TaskItem/TaskItem';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const ProductionStation: React.FC = () => {
    const userString = localStorage.getItem('user');
    const loggedInUser = userString ? JSON.parse(userString) : null;
    const isWorker = loggedInUser?.role === 'Worker';
    
    const [currentWorkerId, setCurrentWorkerId] = useState<string>(
        isWorker ? (loggedInUser._id || loggedInUser.id) : ''
    );
    
    const [allWorkers, setAllWorkers] = useState<any[]>([]);
    const [myTasks, setMyTasks] = useState<WorkerTask[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [selectedWigForCard, setSelectedWigForCard] = useState<any>(null);
    const recognitionRef = useRef<any>(null);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchWorkers = useCallback(async () => {
        if (isWorker) return; // התיקון: חוסם את הבקשה לעובדות רגילות למניעת שגיאת 403
        
        try {
            const res = await api.get('/users');
            const workersArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setAllWorkers(workersArray.filter((u: any) => u.role === 'Worker'));
        } catch (error) {
            console.error('Error fetching workers:', error);
            showNotification('error', 'שגיאה בטעינת עובדים');
        }
    }, [isWorker]);

    const fetchStationData = useCallback(async () => {
        if (!currentWorkerId) return;
        try {
            const res = await api.get(`/users/${currentWorkerId}/unified-tasks`);
            const tasksArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setMyTasks(tasksArray);
        } catch (error: any) {
            console.error('Error fetching tasks:', error);
            showNotification('error', 'שגיאה בטעינת משימות');
        }
    }, [currentWorkerId]);

    const openTechnicalCard = async (wigId: string) => {
        if (!wigId) {
            showNotification('error', 'קוד פאה חסר');
            return;
        }
        try {
            const res = await api.get(`/wigs/${wigId}`);
            const data = res.data?.data || res.data;
            setSelectedWigForCard(data);
        } catch (error: any) {
            console.error('שגיאה:', error);
            const errorMsg = error.response?.status === 404 
                  ? 'הפאה לא קיימת במערכת (404). ודאי שה-ID תקין.'
                  : 'שגיאה בהבאת נתוני פאה';
            showNotification('error', errorMsg);
        }
    };

    const handleTaskCompleted = async () => {
        showNotification('success', 'המשימה עודכנה בהצלחה!');
        await fetchStationData();
    };

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    useEffect(() => {
        fetchStationData();
    }, [fetchStationData]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'he-IL';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log("זוהתה פקודה:", command);
            setIsListening(false);
            
            if ((command.includes('בוצע') || command.includes('סיימתי')) && myTasks.length > 0) {
                const task = myTasks[0];
                try {
                    if (task.type === 'חדשה') {
                        await api.patch(`/wigs/${task.repairId}/next-step`, {});
                    } else if (task.taskIndexes && task.taskIndexes.length > 0) {
                        await api.patch(`/repairs/${task.repairId}/task/${task.taskIndexes[0]}`, { status: 'בוצע' });
                    }
                    showNotification('success', 'המשימה קודמה (זיהוי קולי)');
                    fetchStationData();
                } catch (err) {
                    showNotification('error', 'שגיאה בקידום המשימה קולית');
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error("שגיאת זיהוי קולי:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                showNotification('error', 'המיקרופון חסום.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [myTasks, fetchStationData]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("הדפדפן לא תומך בזיהוי קולי (מומלץ Chrome).");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("שגיאה בהפעלת מיקרופון:", err);
            }
        }
    };

    return (
        <div className="station-container" dir="rtl">
            <header className="station-header">
                <div className="header-actions">
                    <h2>תחנת עבודה: {isWorker ? loggedInUser.username : (allWorkers.find(w => (w._id || w.id) === currentWorkerId)?.username || 'כללי')}</h2>
                    <div className="btn-group">
                        <button onClick={toggleListening} className={`voice-btn ${isListening ? 'listening' : ''}`}>
                            {isListening ? 'מקשיב... (אמרי "בוצע")' : 'הפעלת זיהוי קולי'}
                        </button>
                    </div>
                </div>
                {!isWorker && (
                    <div className="worker-selector">
                        <label>צפייה כעובדת:</label>
                        <select 
                            value={currentWorkerId} 
                            onChange={(e) => setCurrentWorkerId(e.target.value)}
                        >
                            <option value="">-- בחרי עובדת --</option>
                            {allWorkers.map(worker => (
                                <option key={worker._id || worker.id} value={worker._id || worker.id}>
                                    {worker.username} ({worker.specialty})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </header>

            {notification && (
                <div className={`notification-toast ${notification.type} animate-in`}>
                    {notification.text}
                </div>
            )}

            <main className="tasks-display-area">
                {!currentWorkerId ? (
                    <div className="empty-view"><h3>אנא בחרי עובדת לצפייה במשימות.</h3></div>
                ) : myTasks.length === 0 ? (
                    <div className="empty-view"><h3>🎉 אין משימות פתוחות כרגע בתחנה זו</h3></div>
                ) : (
                    <div className="wigs-list">
                        {myTasks.map((task, index) => (
                            <TaskItem 
                                key={`${task.type}-${task.repairId}-${index}`}
                                task={task} 
                                onComplete={handleTaskCompleted} 
                                onOpenSpecs={task.type === 'חדשה' ? () => openTechnicalCard(task.repairId) : undefined}
                            />
                        ))}
                    </div>
                )}
            </main>

            {selectedWigForCard && (
                <WigTechnicalCard 
                    wig={selectedWigForCard} 
                    onClose={() => setSelectedWigForCard(null)} 
                />
            )}
        </div>
    );
};