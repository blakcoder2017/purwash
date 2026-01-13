import React, { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import AuditTimeline from '../components/logs/AuditTimeline';
import adminApi from '../api/client';
import type { AuditLog } from '../types';

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await adminApi.get<AuditLog[]>('/admin/logs');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to fetch audit logs.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <>
            <PageHeader
                title="Audit Trail"
                subtitle="Review all administrative actions performed in the system."
            />
            <Card>
                {isLoading ? (
                    <p>Loading audit logs...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <AuditTimeline logs={logs} />
                )}
            </Card>
        </>
    );
};

export default Logs;
