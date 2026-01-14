import axios from 'axios';
import type { DashboardStats, InvestorMetrics, Order, Partner, AuditLog } from '../types';

const VITE_API_URL = process.env.VITE_API_URL;
const VITE_ADMIN_SECRET_KEY = process.env.VITE_ADMIN_SECRET_KEY;

const adminApi = axios.create({
  baseURL: VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'x-admin-secret': VITE_ADMIN_SECRET_KEY || 'PurWash_Tamale_2026_XYZ',
    'Content-Type': 'application/json',
  },
});

// --- MOCK API INTERCEPTOR ---
// If VITE_API_URL is not set, this interceptor will return mock data.
if (!VITE_API_URL) {
  adminApi.interceptors.request.use(
    (config) => {
      console.log(`[Mock API] Request: ${config.method?.toUpperCase()} ${config.url}`);
      return Promise.reject({ config, isMock: true });
    },
    (error) => Promise.reject(error)
  );

  adminApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.isMock) {
        const { config } = error;
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

        if (config.url.endsWith('/admin/stats') && config.method === 'get') {
            return Promise.resolve({ data: { totalOrders: 1397, pendingOrders: 18, activeRiders: 52 } as DashboardStats });
        }
        if (config.url.endsWith('/admin/investor-metrics') && config.method === 'get') {
            return Promise.resolve({ data: { mrr: 22450.75, arr: 269409.00, arpo: 142.15, growthRate: "12%" } as InvestorMetrics });
        }
        if (config.url.includes('/admin/search/orders') && config.method === 'get') {
            const mockOrders: Order[] = Array.from({ length: 15 }, (_, i) => ({
                _id: `order_${i}`, friendlyId: `ORD-00${1234 + i}`,
                customer: { name: `Customer ${i+1}`, address: `${i+1} Laundry Lane` },
                status: (['created', 'assigned', 'in_progress', 'completed'] as const)[i % 4],
                createdAt: new Date(Date.now() - i * 3600000).toISOString(),
                itemCount: Math.floor(Math.random() * 10) + 1,
                totalValue: Math.floor(Math.random() * 50) + 20,
            }));
            return Promise.resolve({ data: mockOrders });
        }
        if (config.url.includes('/admin/search/users') && config.method === 'get') {
            const role = config.url.includes('role=rider') ? 'rider' : 'laundry';
            const mockPartners: Partner[] = Array.from({ length: 10 }, (_, i) => ({
                _id: `${role}_${i}`, name: `${role === 'rider' ? 'Rider' : 'Laundry'} ${i+1}`,
                email: `${role}${i+1}@PurWash.com`, phone: `555-010${i}`, role,
                status: (['active', 'inactive', 'banned'] as const)[i % 3],
                createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            }));
            return Promise.resolve({ data: mockPartners });
        }
        if (config.url.endsWith('/admin/logs') && config.method === 'get') {
            const mockLogs: AuditLog[] = [
                { _id: 'log_1', action: 'ORDER_ASSIGN', performedBy: { name: 'Admin User' }, orderId: { friendlyId: 'ORD-001234' }, createdAt: new Date().toISOString() },
                { _id: 'log_2', action: 'USER_BAN', performedBy: { name: 'Admin User' }, metadata: { reason: 'Poor service quality' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
                { _id: 'log_3', action: 'FORCE_CONFIRM', performedBy: { name: 'Admin User' }, orderId: { friendlyId: 'ORD-001230' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
                { _id: 'log_4', action: 'CONFIG_UPDATE', performedBy: { name: 'Admin User' }, metadata: { changed: ['serviceFeePercent'] }, createdAt: new Date(Date.now() - 10800000).toISOString() },
            ];
            return Promise.resolve({ data: mockLogs });
        }
        if (config.url.endsWith('/admin/assign') && config.method === 'post') {
            return Promise.resolve({ data: { success: true, message: 'Order assigned successfully' } });
        }
        if (config.url.endsWith('/admin/ban-partner') && config.method === 'post') {
            return Promise.resolve({ data: { success: true, message: 'User banned and logged.' } });
        }
        if (config.url.match(/\/admin\/force-confirm\/.+/) && config.method === 'patch') {
            return Promise.resolve({ data: { success: true, message: 'Admin forced confirmation' } });
        }
        
        console.error(`[Mock API] No mock handler for: ${config.url}`);
        return Promise.reject(new Error('Mock API call not handled'));
      }
      return Promise.reject(error);
    }
  );
}


export default adminApi;