import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ProductionStation.css';
import { WigTechnicalCard } from '../WigTechnicalCard/WigTechnicalCard';
import { TaskItem, WorkerTask } from '../../Repairs/TaskItem/TaskItem';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export const ProductionStation: React.FC = () => {
    // --- State Management ---
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

  
    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };


    const fetchWorkers = useCallback(async () => {
        try {
            const res = await api.get('/users');
            const workersArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setAllWorkers(workersArray.filter((u: any) => u.role === 'Worker'));
        } catch (error) {
            console.error('Error fetching workers:', error);
            showNotification('error', 'שגיאה בטעינת רשימת העובדות');
        }
    }, []);


    const fetchStationData = useCallback(async () => {
        if (!currentWorkerId) return;
        try {
            const res = await api.get(`/users/${currentWorkerId}/unified-tasks`);
            const tasksArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setMyTasks(tasksArray);
        } catch (error: any) {
            console.error('Error fetching tasks:', error);
            showNotification('error', 'שגיאה בטעינת תור העבודה');
        }
    }, [currentWorkerId]);

    const openTechnicalCard = async (wigId: string) => {
        if (!wigId) {
            showNotification('error', 'מזהה פאה לא תקין');
            return;
        }
        try {
            console.log("מנסה למשוך מפרט עבור ID:", wigId);
    
            const res = await api.get(`/wigs/${wigId}`);
            const data = res.data?.data || res.data;
            setSelectedWigForCard(data);
        } catch (error: any) {
            console.error('שגיאה בשליפת מפרט:', error);
            const errorMsg = error.response?.status === 404 
                ? 'המפרט הטכני לא נמצא בשרת (404). ודאי שה-ID תקין.' 
                : 'שגיאה בטעינת המפרט';
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
        if (!recognition) return;

        recognition.lang = 'he-IL';
        recognition.onresult = async (event: any) => {
            const command = event.results[0][0].transcript.toLowerCase();
            setIsListening(false);
            
            if ((command.includes('סיימתי') || command.includes('העבר')) && myTasks.length > 0) {
                const task = myTasks[0];
                try {
                    if (task.type === 'חדשה') {
                        await api.patch(`/wigs/${task.repairId}/next-step`, {});
                    } else if (task.taskIndexes && task.taskIndexes.length > 0) {
                        await api.patch(`/repairs/${task.repairId}/task/${task.taskIndexes[0]}`, { status: 'בוצע' });
                    }
                    showNotification('success', 'עודכן באמצעות פקודה קולית');
                    fetchStationData();
                } catch (err) {
                    showNotification('error', 'נכשל בעדכון קולי');
                }
            }
        };
        recognition.onend = () => setIsListening(false);
    }, [myTasks, fetchStationData]);

    const toggleListening = () => {
        if (!recognition) return alert("הדפדפן לא תומך בזיהוי קולי");
        if (isListening) recognition.stop();
        else {
            setIsListening(true);
            recognition.start();
        }
    };

    return (
        <div className="station-container" dir="rtl">
            <header className="station-header">
                <div className="header-actions">
                    <h2>תחנת עבודה — {isWorker ? loggedInUser.username : (allWorkers.find(w => (w._id || w.id) === currentWorkerId)?.username || 'ניהול משימות')}</h2>
                    <div className="btn-group">
                        <button onClick={toggleListening} className={`voice-btn ${isListening ? 'listening' : ''}`}>
                            {isListening ? 'מקשיב...' : 'פקודה קולית'}
                        </button>
                    </div>
                </div>

                {!isWorker && (
                    <div className="worker-selector">
                        <label>עובדת פעילה:</label>
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
                    <div className="empty-view"><h3>אנא בחרי עובדת לתחילת העבודה</h3></div>
                ) : myTasks.length === 0 ? (
                    <div className="empty-view"><h3>אין פאות שממתינות בתחנה שלך</h3></div>
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