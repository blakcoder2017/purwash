import React, { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import MetricCard from '../components/stats/MetricCard';
import adminApi from '../api/client';
import type { DashboardStats, InvestorMetrics } from '../types';
import Card from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, metricsRes] = await Promise.all([
                    adminApi.get<DashboardStats>('/admin/stats'),
                    adminApi.get<InvestorMetrics>('/admin/investor-metrics')
                ]);
                setStats(statsRes.data);
                setMetrics(metricsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome back, Admin! Here's a summary of weWash activity."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 <MetricCard label="Total Orders" value={stats?.totalOrders.toLocaleString() || '...'} isLoading={isLoading} />
                 <MetricCard label="Pending Orders" value={stats?.pendingOrders.toLocaleString() || '...'} isLoading={isLoading} />
                 <MetricCard label="Active Riders" value={stats?.activeRiders.toLocaleString() || '...'} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <MetricCard label="Monthly Recurring Revenue" value={formatCurrency(metrics?.mrr || 0)} isLoading={isLoading} />
                <MetricCard label="Annual Run Rate" value={formatCurrency(metrics?.arr || 0)} isLoading={isLoading} />
                <MetricCard label="Average Revenue / Order" value={formatCurrency(metrics?.arpo || 0)} isLoading={isLoading} />
                <MetricCard label="Growth Rate" value={metrics?.growthRate || '...'} change={`+${metrics?.growthRate}`} isLoading={isLoading} />
            </div>

            <Card title="Revenue Overview (Last 6 Months)">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" stroke="#334155" />
                            <YAxis stroke="#334155" />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#272757" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </>
    );
};

export default Dashboard;
