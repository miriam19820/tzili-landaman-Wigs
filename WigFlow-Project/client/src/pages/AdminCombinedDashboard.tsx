import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminCombinedDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
               
                const response = await axios.get('/api/repairs/dashboard-view');
                setData(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error("שגיאה בטעינת נתונים משולבים", err);
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'50px'}}>טוען את כל נתוני העסק... ⏳</div>;

    return (
        <div dir="rtl" style={{ padding: '30px', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#6f42c1', borderBottom: '2px solid #6f42c1', paddingBottom: '10px' }}>
                לוח בקרה מרכזי - WigFlow
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                
                {/* 1. צד ימין: תיקונים פעילים */}
                <section style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ color: '#d63384', fontSize: '1.2rem' }}>🛠️ תיקונים בתהליך ({data?.activeRepairs?.length || 0})</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#dee2e6' }}>
                                <th style={{ padding: '8px', textAlign: 'right' }}>קוד</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>לקוחה</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>סטטוס</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.activeRepairs?.map((repair: any) => (
                                <tr 
                                    key={repair._id} 
                                    style={{ 
                                        borderBottom: '1px solid #ddd', 
                                        backgroundColor: repair.isUrgent ? '#ffcccc' : 'transparent',
                                        color: repair.isUrgent ? '#b22222' : 'inherit',
                                        fontWeight: repair.isUrgent ? 'bold' : 'normal'
                                    }}
                                >
                                    <td style={{ padding: '8px' }}>{repair.wigCode} {repair.isUrgent && '🔴'}</td>
                                    <td style={{ padding: '8px' }}>{repair.customerId?.name || 'לא ידוע'}</td>
                                    <td style={{ padding: '8px' }}>{repair.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* 2. עמודה אמצעית: חפיפה וסטיילינג */}
                <section style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ color: '#0d6efd', fontSize: '1.2rem' }}>🧼 חפיפה וסטיילינג ({data?.activeServices?.length || 0})</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#dee2e6' }}>
                                <th style={{ padding: '8px', textAlign: 'right' }}>קוד פאה</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>שירות</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>סטטוס</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.activeServices?.map((service: any) => (
                                <tr key={service._id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '8px' }}>{service.wigId?.wigCode || 'חדשה'}</td>
                                    <td style={{ padding: '8px' }}>{service.serviceType}</td>
                                    <td style={{ padding: '8px' }}>{service.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* 3. עמודה שמאלית: פאות בייצור חדש (החלק שביקשת להוסיף) */}
                <section style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #bbf7d0' }}>
                    <h2 style={{ color: '#16a34a', fontSize: '1.2rem' }}>🚀 ייצור פאות חדשות ({data?.production?.length || 0})</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#dcfce7' }}>
                                <th style={{ padding: '8px', textAlign: 'right' }}>קוד</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>לקוחה</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>שלב</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.production?.map((wig: any) => (
                                <tr 
                                    key={wig._id} 
                                    style={{ 
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: wig.isUrgent ? '#ffcccc' : 'transparent',
                                        color: wig.isUrgent ? '#b22222' : 'inherit',
                                        fontWeight: wig.isUrgent ? 'bold' : 'normal'
                                    }}
                                >
                                    <td style={{ padding: '8px' }}>{wig.orderCode} {wig.isUrgent && '🔴'}</td>
                                    <td style={{ padding: '8px' }}>{wig.customer?.firstName} {wig.customer?.lastName}</td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {wig.currentStage}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

            </div>
        </div>
    );
};

export default AdminCombinedDashboard;