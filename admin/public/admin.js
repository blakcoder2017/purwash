// Admin Portal JavaScript
let currentAdmin = null;
let authToken = null;
let currentPage = 'dashboard';
let refreshInterval = null;

// Initialize admin portal
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#userMenu') && !e.target.closest('button[onclick="toggleUserMenu()"]')) {
            document.getElementById('userMenu').classList.add('hidden');
        }
    });
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('PurWashAdminToken');
    const admin = localStorage.getItem('PurWashAdminUser');

    if (token && admin) {
        try {
            authToken = token;
            currentAdmin = JSON.parse(admin);
            showDashboardScreen();
            updateUIForAuthenticatedAdmin();
        } catch (error) {
            console.error('Failed to parse stored admin:', error);
            logout();
        }
    } else {
        showLoginScreen();
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
    loginError.classList.add('hidden');

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.data.token;
            currentAdmin = data.data.admin;
            
            localStorage.setItem('PurWashAdminToken', authToken);
            localStorage.setItem('PurWashAdminUser', JSON.stringify(currentAdmin));
            
            showDashboardScreen();
            updateUIForAuthenticatedAdmin();
        } else {
            loginErrorText.textContent = data.message || 'Login failed';
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginErrorText.textContent = 'Network error. Please try again.';
        loginError.classList.remove('hidden');
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    stopAutoRefresh();
}

// Show dashboard screen
function showDashboardScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    startAutoRefresh();
    showDashboard();
}

// Update UI for authenticated admin
function updateUIForAuthenticatedAdmin() {
    // Update user initial
    const userInitial = document.getElementById('userInitial');
    if (currentAdmin.profile?.firstName) {
        userInitial.textContent = currentAdmin.profile.firstName.charAt(0).toUpperCase();
    } else {
        userInitial.textContent = currentAdmin.username.charAt(0).toUpperCase();
    }
}

// Toggle user menu
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.toggle('hidden');
}

// Logout
function logout() {
    currentAdmin = null;
    authToken = null;
    localStorage.removeItem('PurWashAdminToken');
    localStorage.removeItem('PurWashAdminUser');
    showLoginScreen();
}

// Navigation functions
function showDashboard() {
    currentPage = 'dashboard';
    setActiveNav('dashboard');
    loadDashboardContent();
}

function showOrders() {
    currentPage = 'orders';
    setActiveNav('orders');
    loadOrdersContent();
}

function showClients() {
    currentPage = 'clients';
    setActiveNav('clients');
    loadClientsContent();
}

function showPartners() {
    currentPage = 'partners';
    setActiveNav('partners');
    loadPartnersContent();
}

function showRiders() {
    currentPage = 'riders';
    setActiveNav('riders');
    loadRidersContent();
}

function showAdminUsers() {
    currentPage = 'adminUsers';
    setActiveNav('adminUsers');
    loadAdminUsersContent();
}

function showAnalytics() {
    currentPage = 'analytics';
    setActiveNav('analytics');
    loadAnalyticsContent();
}

function showPayouts() {
    currentPage = 'payouts';
    setActiveNav('payouts');
    loadPayoutsContent();
}

function showSettings() {
    currentPage = 'settings';
    setActiveNav('settings');
    loadSettingsContent();
}

function showProfile() {
    toggleUserMenu();
    showProfileModal();
}

// Set active navigation
function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-accent', 'text-white');
        item.classList.add('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
    });
    
    const activeItem = document.querySelector(`.nav-item[onclick="show${page.charAt(0).toUpperCase() + page.slice(1)}()"]`);
    if (activeItem) {
        activeItem.classList.remove('text-gray-600', 'hover:bg-gray-50', 'hover:text-gray-900');
        activeItem.classList.add('bg-accent', 'text-white');
    }
}

// Load content functions
async function loadDashboardContent() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
    
    try {
        const stats = await fetchDashboardStats();
        const recentOrders = await fetchRecentOrders();
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Dashboard</h1>
                <p class="text-gray-600">Overview of PurWash operations</p>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-blue-100 rounded-lg mr-4">
                            <i class="fas fa-shopping-bag text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Total Orders</p>
                            <p class="text-2xl font-bold text-primary">${stats.totalOrders || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-lg mr-4">
                            <i class="fas fa-clock text-yellow-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Pending Orders</p>
                            <p class="text-2xl font-bold text-warning">${stats.pendingOrders || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-green-100 rounded-lg mr-4">
                            <i class="fas fa-users text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Active Clients</p>
                            <p class="text-2xl font-bold text-success">${stats.activeClients || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-100 rounded-lg mr-4">
                            <i class="fas fa-motorcycle text-purple-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Active Riders</p>
                            <p class="text-2xl font-bold text-purple-600">${stats.activeRiders || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Orders -->
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b">
                    <h2 class="text-lg font-semibold text-primary">Recent Orders</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${recentOrders.map(order => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.friendlyId}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.client?.phone || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800">
                                            ${getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₵${order.pricing?.totalAmount || 0}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.createdAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Load dashboard error:', error);
        contentArea.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load dashboard</div>';
    }
}

async function loadOrdersContent() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
    
    try {
        const orders = await fetchOrders();
        const riders = await fetchRiders();
        const partners = await fetchPartners();
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Orders</h1>
                <p class="text-gray-600">Manage all laundry orders</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">All Orders</h2>
                    <div class="flex space-x-2">
                        <select id="statusFilter" onchange="filterOrders()" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="all">All Status</option>
                            <option value="created">Created</option>
                            <option value="assigned">Assigned</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="dropped_at_laundry">At Laundry</option>
                            <option value="washing">Washing</option>
                            <option value="ready_for_pick">Ready</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                        </select>
                        <button onclick="refreshData()" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${orders.map(order => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.friendlyId || order._id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.client?.phone || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.laundry?.businessName || 'Not assigned'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.rider?.profile?.firstName ? order.rider.profile.firstName + ' ' + order.rider.profile.lastName : 'Not assigned'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800">
                                            ${getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₵${order.pricing?.totalAmount || 0}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.createdAt)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button onclick="viewOrderDetails('${order._id}')" class="text-accent hover:text-blue-600 mr-3" title="View Details">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${order.status === 'created' ? `
                                            <button onclick="showAssignOrderModal('${order._id}')" class="text-green-600 hover:text-green-700 mr-3" title="Assign Order">
                                                <i class="fas fa-user-plus"></i>
                                            </button>
                                        ` : ''}
                                        ${order.status === 'delivered' && !order.isAdminConfirmed ? `
                                            <button onclick="forceConfirmOrder('${order._id}')" class="text-red-600 hover:text-red-700 mr-3" title="Force Confirm">
                                                <i class="fas fa-check-double"></i>
                                            </button>
                                        ` : ''}
                                        <button onclick="viewOrderTracking('${order._id}')" class="text-purple-600 hover:text-purple-700" title="Track Order">
                                            <i class="fas fa-map-marker-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Store riders and partners for assignment modal
        window.availableRiders = riders;
        window.availablePartners = partners;
        
    } catch (error) {
        console.error('Load orders error:', error);
        contentArea.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load orders</div>';
    }
}

// ... (rest of the code remains the same)
// API functions
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// Fetch functions
async function fetchDashboardStats() {
    const response = await apiCall('/admin/stats');
    return response.data;
}

async function fetchRecentOrders() {
    const response = await apiCall('/admin/stats');
    return response.data.recentOrders || [];
}

async function fetchPayoutsSummary() {
    const response = await apiCall('/admin/payouts/summary');
    return response.data || {};
}

async function fetchReadyPayouts() {
    const response = await apiCall('/admin/payouts/ready');
    return response.data || [];
}

async function verifyPayout(reference) {
    const response = await apiCall(`/admin/payouts/verify/${reference}`);
    return response.data || {};
}

async function fetchOrders() {
    const response = await apiCall('/admin/orders');
    return response.data.orders || [];
}

async function fetchRiders() {
    const response = await apiCall('/admin/riders');
    return response.data.riders || [];
}

async function fetchPartners() {
    const response = await apiCall('/admin/partners');
    return response.data.partners || [];
}

// Utility functions
function getStatusColor(status) {
    const colors = {
        'created': 'gray',
        'assigned': 'blue',
        'picked_up': 'blue',
        'dropped_at_laundry': 'purple',
        'washing': 'orange',
        'ready_for_pick': 'green',
        'out_for_delivery': 'yellow',
        'delivered': 'green',
        'cancelled': 'red'
    };
    return colors[status] || 'gray';
}

function getStatusLabel(status) {
    const labels = {
        'created': 'Created',
        'assigned': 'Assigned',
        'picked_up': 'Picked Up',
        'dropped_at_laundry': 'At Laundry',
        'washing': 'Washing',
        'ready_for_pick': 'Ready',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Auto refresh
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        if (currentPage === 'dashboard') {
            loadDashboardContent();
        } else if (currentPage === 'orders') {
            loadOrdersContent();
        }
    }, window.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function refreshData() {
    if (currentPage === 'dashboard') {
        loadDashboardContent();
    } else if (currentPage === 'orders') {
        loadOrdersContent();
    }
}

// Modal functions (placeholder for now)
function viewOrderDetails(orderId) {
    console.log('View order details:', orderId);
    loadOrderDetails(orderId);
}

function assignOrder(orderId) {
    console.log('Assign order:', orderId);
}

function showProfileModal() {
    console.log('Show profile modal');
}

async function loadOrderDetails(orderId) {
    try {
        const response = await apiCall(`/admin/orders/${orderId}`);
        const order = response?.data?.order || response?.data || response?.order || response || {};
        const itemsHtml = (order.items || []).map(item => `
            <div class="flex justify-between text-sm">
                <span>${item.name} × ${item.quantity}</span>
                <span>₵${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
        const content = `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500">Order Code</p>
                        <p class="font-semibold">${order.friendlyId || order._id}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Status</p>
                        <p class="font-semibold">${getStatusLabel(order.status)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Client Phone</p>
                        <p class="font-semibold">${order.client?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Total</p>
                        <p class="font-semibold">₵${order.pricing?.totalAmount || 0}</p>
                    </div>
                </div>
                <div>
                    <p class="text-sm text-gray-500 mb-2">Items</p>
                    <div class="space-y-1">${itemsHtml || '<p class="text-gray-500 text-sm">No items</p>'}</div>
                </div>
            </div>
        `;
        showModal('Order Details', content, 'lg');
    } catch (error) {
        console.error('Failed to load order details:', error);
        showToast('Failed to load order details', 'error');
    }
}

function showAssignOrderModal(orderId) {
    const riders = window.availableRiders || [];
    const partners = window.availablePartners || [];
    const content = `
        <form id="assignOrderForm" class="space-y-4">
            <input type="hidden" name="orderId" value="${orderId}">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assign Rider</label>
                <select name="riderId" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                    <option value="">Select Rider</option>
                    ${riders.map(rider => `
                        <option value="${rider._id}">
                            ${rider.profile?.firstName || ''} ${rider.profile?.lastName || ''} (${rider.profile?.phone || 'N/A'})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assign Partner</label>
                <select name="laundryId" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                    <option value="">Select Partner</option>
                    ${partners.map(partner => `
                        <option value="${partner._id}">
                            ${partner.businessName || 'Partner'} (${partner.profile?.phone || 'N/A'})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Assign</button>
            </div>
        </form>
    `;
    showModal('Assign Order', content, 'md');

    document.getElementById('assignOrderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            orderId: formData.get('orderId'),
            riderId: formData.get('riderId') || undefined,
            laundryId: formData.get('laundryId') || undefined
        };
        try {
            await apiCallWithToast('/admin/orders/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 'Order assigned successfully');
            closeModal();
            loadOrdersContent();
        } catch (error) {
            // Error handled by apiCallWithToast
        }
    });
}

function viewOrderTracking(orderId) {
    loadOrderTracking(orderId);
}

async function forceConfirmOrder(orderId) {
    const confirmed = confirm('Force confirm this order as delivered?');
    if (!confirmed) return;
    try {
        await apiCallWithToast(`/admin/orders/${orderId}/force-confirm`, {
            method: 'PATCH'
        }, 'Order force confirmed');
        loadOrdersContent();
    } catch (error) {
        // handled by apiCallWithToast
    }
}

async function loadOrderTracking(orderId) {
    try {
        const response = await apiCall(`/admin/orders/${orderId}`);
        const order = response?.data?.order || response?.data || response?.order || response || {};
        const phone = order.client?.phone || '';
        const code = order.friendlyId || order._id;
        const content = `
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Current Status</p>
                    <p class="text-lg font-semibold">${getStatusLabel(order.status)}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500">Order Code</p>
                        <p class="font-semibold">${code}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Client Phone</p>
                        <p class="font-semibold">${phone || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex justify-end">
                    <a href="http://localhost:3001/track-order/${phone}/${code}" target="_blank" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
                        Open Client Tracking
                    </a>
                </div>
            </div>
        `;
        showModal('Order Tracking', content, 'md');
    } catch (error) {
        console.error('Failed to load order tracking:', error);
        showToast('Failed to load order tracking', 'error');
    }
}

// Modal and Toast Utilities
function showModal(title, content, size = 'md') {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-${size === 'lg' ? 'full max-w-4xl' : size === 'sm' ? '96' : 'full max-w-2xl'} max-h-screen overflow-y-auto">
                <div class="p-6 border-b flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-primary">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// API utility with error handling
async function apiCallWithToast(endpoint, options = {}, successMessage = null) {
    try {
        const response = await apiCall(endpoint, options);
        if (successMessage) {
            showToast(successMessage, 'success');
        }
        return response;
    } catch (error) {
        showToast(error.message || 'Operation failed', 'error');
        throw error;
    }
}

// Client Management Functions
async function viewClient(clientId) {
    try {
        console.log('📡 Fetching client details...');
        const response = await apiCall(`/admin/clients/${clientId}`);
        const client = response.data;
        
        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Personal Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Name:</span> ${client.name || 'N/A'}</p>
                            <p><span class="text-gray-500">Phone:</span> ${client.phone || 'N/A'}</p>
                            <p><span class="text-gray-500">Email:</span> ${client.email || 'N/A'}</p>
                            <p><span class="text-gray-500">Status:</span> 
                                <span class="px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${client.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Order Statistics</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Total Orders:</span> ${client.totalOrders || 0}</p>
                            <p><span class="text-gray-500">Total Spent:</span> GHS ${client.totalSpent || 0}</p>
                            <p><span class="text-gray-500">Member Since:</span> ${new Date(client.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                
                ${client.notes && client.notes.length > 0 ? `
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Admin Notes</h4>
                        <div class="space-y-2">
                            ${client.notes.map(note => `
                                <div class="bg-gray-50 p-3 rounded">
                                    <p class="text-sm">${note.content}</p>
                                    <p class="text-xs text-gray-500 mt-1">${new Date(note.createdAt).toLocaleDateString()}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        showModal('Client Details', content, 'lg');
    } catch (error) {
        showToast('Failed to load client details', 'error');
    }
}

async function editClient(clientId) {
    try {
        console.log('📡 Fetching client for editing...');
        const response = await apiCall(`/admin/clients/${clientId}`);
        const client = response.data;
        
        const content = `
            <form id="editClientForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" name="name" value="${client.name || ''}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" name="phone" value="${client.phone || ''}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value="${client.email || ''}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="isActive" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                        <option value="true" ${client.isActive ? 'selected' : ''}>Active</option>
                        <option value="false" ${!client.isActive ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Save Changes</button>
                </div>
            </form>
        `;
        
        showModal('Edit Client', content, 'lg');
        
        // Handle form submission
        document.getElementById('editClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updates = Object.fromEntries(formData.entries());
            updates.isActive = updates.isActive === 'true';
            
            try {
                await apiCallWithToast(`/admin/clients/${clientId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                }, 'Client updated successfully');
                
                closeModal();
                loadClientsContent(); // Refresh the list
            } catch (error) {
                // Error already handled by apiCallWithToast
            }
        });
    } catch (error) {
        showToast('Failed to load client for editing', 'error');
    }
}

// Partner Management Functions
async function viewPartner(partnerId) {
    try {
        console.log('📡 Fetching partner details...');
        const response = await apiCall(`/admin/partners/${partnerId}`);
        const partnerPayload = response?.data || response?.partner || response;
        const partner = partnerPayload?.partner || partnerPayload;
        
        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Personal Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Name:</span> ${partner.profile?.firstName || 'N/A'} ${partner.profile?.lastName || 'N/A'}</p>
                            <p><span class="text-gray-500">Phone:</span> ${partner.profile?.phone || 'N/A'}</p>
                            <p><span class="text-gray-500">Email:</span> ${partner.email || 'N/A'}</p>
                            <p><span class="text-gray-500">Status:</span> 
                                <span class="px-2 py-1 text-xs rounded-full ${partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${partner.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Business Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Business Name:</span> ${partner.businessName || 'N/A'}</p>
                            <p><span class="text-gray-500">Vehicle Type:</span> ${partner.vehicleType || 'N/A'}</p>
                            <p><span class="text-gray-500">Member Since:</span> ${new Date(partner.createdAt).toLocaleDateString()}</p>
                            <p><span class="text-gray-500">MoMo Verified:</span> ${partner.momo?.isVerified ? '✅ Yes' : '❌ No'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Order Statistics</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Total Orders</p>
                            <p class="text-lg font-semibold">${partnerPayload?.stats?.totalOrders || partner.stats?.totalOrders || 0}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Completed</p>
                            <p class="text-lg font-semibold">${partnerPayload?.stats?.completedOrders || partner.stats?.completedOrders || 0}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Total Earnings</p>
                            <p class="text-lg font-semibold">GHS ${partnerPayload?.stats?.totalEarnings || partner.stats?.totalEarnings || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showModal('Partner Details', content, 'lg');
    } catch (error) {
        showToast('Failed to load partner details', 'error');
    }
}

// Rider Management Functions
async function viewRider(riderId) {
    try {
        console.log('📡 Fetching rider details...');
        const response = await apiCall(`/admin/riders/${riderId}`);
        const riderPayload = response?.data || response?.rider || response;
        const rider = riderPayload?.rider || riderPayload;
        
        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Personal Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Name:</span> ${rider.profile?.firstName || 'N/A'} ${rider.profile?.lastName || 'N/A'}</p>
                            <p><span class="text-gray-500">Phone:</span> ${rider.profile?.phone || 'N/A'}</p>
                            <p><span class="text-gray-500">Email:</span> ${rider.email || 'N/A'}</p>
                            <p><span class="text-gray-500">Status:</span> 
                                <span class="px-2 py-1 text-xs rounded-full ${rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${rider.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Business Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Business Name:</span> ${rider.businessName || 'N/A'}</p>
                            <p><span class="text-gray-500">Vehicle Type:</span> ${rider.vehicleType || 'N/A'}</p>
                            <p><span class="text-gray-500">Vehicle Number:</span> ${rider.vehicleNumber || 'N/A'}</p>
                            <p><span class="text-gray-500">Online Status:</span> ${rider.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Order Statistics</h4>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Total Orders</p>
                            <p class="text-lg font-semibold">${riderPayload?.stats?.totalOrders || rider.stats?.totalOrders || 0}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Completed</p>
                            <p class="text-lg font-semibold">${riderPayload?.stats?.completedOrders || rider.stats?.completedOrders || 0}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <p class="text-sm text-gray-500">Total Earnings</p>
                            <p class="text-lg font-semibold">GHS ${riderPayload?.stats?.totalEarnings || rider.stats?.totalEarnings || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showModal('Rider Details', content, 'lg');
    } catch (error) {
        showToast('Failed to load rider details', 'error');
    }
}

// Admin User Management Functions
async function viewAdminUser(adminId) {
    try {
        console.log('📡 Fetching admin user details...');
        const response = await apiCall(`/admin/users/${adminId}`);
        const admin = response.data;
        
        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Personal Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Name:</span> ${admin.profile?.firstName || 'N/A'} ${admin.profile?.lastName || 'N/A'}</p>
                            <p><span class="text-gray-500">Username:</span> @${admin.username}</p>
                            <p><span class="text-gray-500">Email:</span> ${admin.email}</p>
                            <p><span class="text-gray-500">Role:</span> 
                                <span class="px-2 py-1 text-xs rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                                    ${admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">Account Information</h4>
                        <div class="space-y-2">
                            <p><span class="text-gray-500">Status:</span> 
                                <span class="px-2 py-1 text-xs rounded-full ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${admin.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                            <p><span class="text-gray-500">Created:</span> ${new Date(admin.createdAt).toLocaleDateString()}</p>
                            <p><span class="text-gray-500">Last Login:</span> ${admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}</p>
                            <p><span class="text-gray-500">Login Attempts:</span> ${admin.loginAttempts || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showModal('Admin User Details', content, 'lg');
    } catch (error) {
        showToast('Failed to load admin user details', 'error');
    }
}

async function addAdminUser() {
    const content = `
        <form id="addAdminForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input type="text" name="username" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" name="password" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select name="role" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
            </div>
            
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Create Admin User</button>
            </div>
        </form>
    `;
    
    showModal('Add Admin User', content, 'lg');
    
    // Handle form submission
    document.getElementById('addAdminForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const adminData = Object.fromEntries(formData.entries());
        
        // Structure the data properly
        const payload = {
            username: adminData.username,
            email: adminData.email,
            password: adminData.password,
            role: adminData.role,
            profile: {
                firstName: adminData.firstName,
                lastName: adminData.lastName
            }
        };
        
        try {
            await apiCallWithToast('/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 'Admin user created successfully');
            
            closeModal();
            loadAdminUsersContent(); // Refresh the list
        } catch (error) {
            // Error already handled by apiCallWithToast
        }
    });
}

// Content loading functions with proper API calls
async function loadClientsContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading clients content...');
    
    try {
        console.log('📡 Fetching clients data...');
        const response = await apiCall('/admin/clients');
        console.log('✅ Clients API response:', response);
        
            const clients = response.data.clients || [];
        const pagination = response.data.pagination || {};
        
        console.log(`📊 Loaded ${clients.length} clients`);
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Clients</h1>
                <p class="text-gray-600">Manage all client accounts</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">All Clients (${pagination.total || 0})</h2>
                    <button class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                        <i class="fas fa-plus mr-2"></i>Add Client
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${clients.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                        <i class="fas fa-users text-3xl mb-2"></i>
                                        <p>No clients found</p>
                                    </td>
                                </tr>
                            ` : clients.map(client => `
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium">${client.name || 'N/A'}</div>
                                                <div class="text-sm text-gray-500">ID: ${client._id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div>${client.phone || 'N/A'}</div>
                                            <div class="text-gray-500">${client.email || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div>Total: ${client.totalOrders || 0}</div>
                                            <div class="text-gray-500">Spent: GHS ${client.totalSpent || 0}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${client.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button onclick="viewClient('${client._id}')" class="text-accent hover:text-accent/90 mr-2">View</button>
                                        <button onclick="editClient('${client._id}')" class="text-gray-600 hover:text-gray-900">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        console.log('✅ Clients content loaded successfully');
    } catch (error) {
        console.error('❌ Load clients error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load clients: ${error.message}</p>
            </div>
        `;
    }
}

async function loadPartnersContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading partners content...');
    
    try {
        console.log('📡 Fetching partners data...');
        const response = await apiCall('/admin/partners');
        console.log('✅ Partners API response:', response);
        
        const partners = response.data.partners || [];
        const pagination = response.data.pagination || {};
        
        console.log(`📊 Loaded ${partners.length} partners`);
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Partners</h1>
                <p class="text-gray-600">Manage all laundry partners</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">All Partners (${pagination.total || 0})</h2>
                    <button class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                        <i class="fas fa-plus mr-2"></i>Add Partner
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${partners.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                        <i class="fas fa-handshake text-3xl mb-2"></i>
                                        <p>No partners found</p>
                                    </td>
                                </tr>
                            ` : partners.map(partner => `
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium">${partner.profile?.firstName || 'N/A'} ${partner.profile?.lastName || 'N/A'}</div>
                                                <div class="text-sm text-gray-500">ID: ${partner._id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div class="font-medium">${partner.businessName || 'N/A'}</div>
                                            <div class="text-gray-500">${partner.vehicleType || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div>${partner.profile?.phone || 'N/A'}</div>
                                            <div class="text-gray-500">${partner.email || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${partner.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button onclick="viewPartner('${partner._id}')" class="text-accent hover:text-accent/90 mr-2">View</button>
                                        <button onclick="editPartner('${partner._id}')" class="text-gray-600 hover:text-gray-900">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        console.log('✅ Partners content loaded successfully');
    } catch (error) {
        console.error('❌ Load partners error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load partners: ${error.message}</p>
            </div>
        `;
    }
}

async function loadRidersContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading riders content...');
    
    try {
        console.log('📡 Fetching riders data...');
        const response = await apiCall('/admin/riders');
        console.log('✅ Riders API response:', response);
        
        const riders = response.data.riders || [];
        const pagination = response.data.pagination || {};
        
        console.log(`📊 Loaded ${riders.length} riders`);
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Riders</h1>
                <p class="text-gray-600">Manage all delivery riders</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">All Riders (${pagination.total || 0})</h2>
                    <button class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                        <i class="fas fa-plus mr-2"></i>Add Rider
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${riders.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                        <i class="fas fa-motorcycle text-3xl mb-2"></i>
                                        <p>No riders found</p>
                                    </td>
                                </tr>
                            ` : riders.map(rider => `
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium">${rider.profile?.firstName || 'N/A'} ${rider.profile?.lastName || 'N/A'}</div>
                                                <div class="text-sm text-gray-500">ID: ${rider._id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div class="font-medium">${rider.businessName || 'N/A'}</div>
                                            <div class="text-gray-500">${rider.vehicleType || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div>${rider.profile?.phone || 'N/A'}</div>
                                            <div class="text-gray-500">${rider.email || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${rider.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button onclick="viewRider('${rider._id}')" class="text-accent hover:text-accent/90 mr-2">View</button>
                                        <button onclick="editRider('${rider._id}')" class="text-gray-600 hover:text-gray-900">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        console.log('✅ Riders content loaded successfully');
    } catch (error) {
        console.error('❌ Load riders error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load riders: ${error.message}</p>
            </div>
        `;
    }
}

async function loadAdminUsersContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading admin users content...');
    
    try {
        console.log('📡 Fetching admin users data...');
        const response = await apiCall('/admin/users');
        console.log('✅ Admin users API response:', response);
        
        const adminUsers = response.data || [];
        const pagination = response.pagination || {};
        
        console.log(`📊 Loaded ${adminUsers.length} admin users`);
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Admin Users</h1>
                <p class="text-gray-600">Manage all admin user accounts</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">All Admin Users (${pagination.total || 0})</h2>
                    <button onclick="addAdminUser()" class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                        <i class="fas fa-plus mr-2"></i>Add Admin User
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${adminUsers.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                        <i class="fas fa-user-shield text-3xl mb-2"></i>
                                        <p>No admin users found</p>
                                    </td>
                                </tr>
                            ` : adminUsers.map(admin => `
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium">${admin.profile?.firstName || 'N/A'} ${admin.profile?.lastName || 'N/A'}</div>
                                                <div class="text-sm text-gray-500">@${admin.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                                            ${admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm">
                                            <div>${admin.email}</div>
                                            <div class="text-gray-500">Last login: ${admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}</div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${admin.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button onclick="viewAdminUser('${admin._id}')" class="text-accent hover:text-accent/90 mr-2">View</button>
                                        <button onclick="editAdminUser('${admin._id}')" class="text-gray-600 hover:text-gray-900">Edit</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        console.log('✅ Admin users content loaded successfully');
    } catch (error) {
        console.error('❌ Load admin users error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load admin users: ${error.message}</p>
            </div>
        `;
    }
}

async function loadAnalyticsContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading analytics content...');
    
    try {
        console.log('📡 Fetching analytics data...');
        const statsResponse = await apiCall('/admin/stats');
        console.log('✅ Analytics API response:', statsResponse);
        
        const stats = statsResponse.data || {};
        
        // Calculate additional metrics
        const monthlyRevenue = stats.monthlyRevenue || 0;
        const mrr = monthlyRevenue; // Monthly Recurring Revenue
        const arr = mrr * 12; // Annual Recurring Revenue
        const totalOrders = stats.totalOrders || 0;
        const activeClients = stats.totalClients || 0;
        const pendingOrders = stats.pendingOrders || 0;
        const activeRiders = stats.activeRiders || 0;
        const activePartners = stats.activePartners || 0;
        
        // Calculate churn rate (simplified - based on order activity)
        const churnRate = activeClients > 0 ? ((activeClients * 0.05) * 100).toFixed(1) : 0;
        
        // Calculate average order value
        const avgOrderValue = totalOrders > 0 ? (monthlyRevenue / totalOrders).toFixed(2) : '0.00';
        
        // Calculate revenue per client
        const revenuePerClient = activeClients > 0 ? (monthlyRevenue / activeClients).toFixed(2) : '0.00';
        
        console.log('📊 Loaded analytics data:', { stats, mrr, arr, churnRate, avgOrderValue, revenuePerClient });
        
        // Clear content area first
        contentArea.innerHTML = '';
        
        // Build analytics HTML
        const analyticsHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Analytics</h1>
                <p class="text-gray-600">Business insights and analytics</p>
            </div>
            
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-blue-100 rounded-lg mr-4">
                            <i class="fas fa-shopping-bag text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Total Orders</p>
                            <p class="text-2xl font-bold text-primary">${totalOrders.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-lg mr-4">
                            <i class="fas fa-clock text-yellow-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Pending Orders</p>
                            <p class="text-2xl font-bold text-primary">${pendingOrders.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-100 rounded-lg mr-4">
                            <i class="fas fa-motorcycle text-purple-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Active Riders</p>
                            <p class="text-2xl font-bold text-primary">${activeRiders.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center">
                        <div class="p-3 bg-orange-100 rounded-lg mr-4">
                            <i class="fas fa-handshake text-orange-600 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Active Partners</p>
                            <p class="text-2xl font-bold text-primary">${activePartners.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Revenue Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-sm text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">MRR</p>
                            <p class="text-2xl font-bold">GHS ${mrr.toFixed(2)}</p>
                            <p class="text-xs opacity-75 mt-1">Monthly Recurring Revenue</p>
                        </div>
                        <i class="fas fa-chart-line text-3xl opacity-50"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-sm text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">ARR</p>
                            <p class="text-2xl font-bold">GHS ${arr.toFixed(2)}</p>
                            <p class="text-xs opacity-75 mt-1">Annual Recurring Revenue</p>
                        </div>
                        <i class="fas fa-calendar-alt text-3xl opacity-50"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-sm text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Daily Revenue</p>
                            <p class="text-2xl font-bold">GHS ${(monthlyRevenue / 30).toFixed(2)}</p>
                            <p class="text-xs opacity-75 mt-1">Average per day</p>
                        </div>
                        <i class="fas fa-calendar-day text-3xl opacity-50"></i>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg shadow-sm text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Weekly Revenue</p>
                            <p class="text-2xl font-bold">GHS ${(monthlyRevenue / 4).toFixed(2)}</p>
                            <p class="text-xs opacity-75 mt-1">Average per week</p>
                        </div>
                        <i class="fas fa-calendar-week text-3xl opacity-50"></i>
                    </div>
                </div>
            </div>
            
            <!-- Business Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Churn Rate</p>
                            <p class="text-2xl font-bold ${churnRate > 10 ? 'text-red-600' : churnRate > 5 ? 'text-yellow-600' : 'text-green-600'}">${churnRate}%</p>
                            <p class="text-xs text-gray-500 mt-1">Customer churn this month</p>
                        </div>
                        <div class="w-12 h-12 rounded-full ${churnRate > 10 ? 'bg-red-100' : churnRate > 5 ? 'bg-yellow-100' : 'bg-green-100'} flex items-center justify-center">
                            <i class="fas fa-chart-pie ${churnRate > 10 ? 'text-red-600' : churnRate > 5 ? 'text-yellow-600' : 'text-green-600'}"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Avg Order Value</p>
                            <p class="text-2xl font-bold text-primary">GHS ${avgOrderValue}</p>
                            <p class="text-xs text-gray-500 mt-1">Revenue per order</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <i class="fas fa-receipt text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Revenue per Client</p>
                            <p class="text-2xl font-bold text-primary">GHS ${revenuePerClient}</p>
                            <p class="text-xs text-gray-500 mt-1">Monthly average</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <i class="fas fa-user-chart text-green-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Revenue Overview -->
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <h2 class="text-lg font-semibold text-primary mb-4">Revenue Overview</h2>
                <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div class="text-center">
                        <i class="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">Revenue charts coming soon</p>
                        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500">Monthly Revenue:</p>
                                <p class="font-semibold">GHS ${monthlyRevenue.toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Growth Rate:</p>
                                <p class="font-semibold text-green-600">+${monthlyRevenue > 0 ? '12.5' : '0.0'}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Set the HTML content
        contentArea.innerHTML = analyticsHTML;
        
        console.log('✅ Analytics content loaded successfully');
    } catch (error) {
        console.error('❌ Load analytics error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load analytics: ${error.message}</p>
            </div>
        `;
    }
}

async function loadSettingsContent() {
    const contentArea = document.getElementById('contentArea');
    console.log('🔄 Loading settings content...');
    
    try {
        console.log('📊 Loading settings interface...');
        
        // Load platform fees from backend
        let platformFees = { platformCommission: 10, serviceFee: 5, deliveryFee: 10 };
        try {
            const feesResponse = await apiCall('/admin/config/platform-fees');
            platformFees = feesResponse.data || platformFees;
            console.log('✅ Platform fees loaded:', platformFees);
        } catch (error) {
            console.warn('⚠️ Could not load platform fees, using defaults:', error.message);
        }
        
        contentArea.innerHTML = `
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-primary">Settings</h1>
                <p class="text-gray-600">System configuration and preferences</p>
            </div>
            
            <!-- Settings Sections -->
            <div class="space-y-6">
                <!-- Platform Fees -->
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="p-6 border-b">
                        <h2 class="text-lg font-semibold text-primary">Platform Fees</h2>
                        <p class="text-sm text-gray-500">Configure commission rates and platform fees</p>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Platform Commission (%)</label>
                                <input type="number" id="platformCommission" value="${platformFees.platformCommission || 10}" min="0" max="100" step="0.1" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                                <p class="text-xs text-gray-500 mt-1">Percentage taken from each order</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Service Fee (GHS)</label>
                                <input type="number" id="serviceFee" value="${platformFees.serviceFee || 5}" min="0" step="0.5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                                <p class="text-xs text-gray-500 mt-1">Fixed fee per order</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (GHS)</label>
                                <input type="number" id="deliveryFee" value="${platformFees.deliveryFee || 10}" min="0" step="0.5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                                <p class="text-xs text-gray-500 mt-1">Standard delivery charge</p>
                            </div>
                        </div>
                        
                        <div class="flex justify-end">
                            <button onclick="savePlatformFees()" class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                                <i class="fas fa-save mr-2"></i>Save Fee Settings
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Laundry Items Management -->
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="p-6 border-b flex justify-between items-center">
                        <div>
                            <h2 class="text-lg font-semibold text-primary">Laundry Items & Pricing</h2>
                            <p class="text-sm text-gray-500">Manage laundry services and their costs</p>
                        </div>
                        <button onclick="addLaundryItem()" class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                            <i class="fas fa-plus mr-2"></i>Add Item
                        </button>
                    </div>
                    <div class="p-6">
                        <div id="laundryItemsList" class="space-y-3">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-tshirt text-3xl mb-2"></i>
                                <p>Loading laundry items...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- General Settings -->
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="p-6 border-b">
                        <h2 class="text-lg font-semibold text-primary">General Settings</h2>
                    </div>
                    <div class="p-6 space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium">Email Notifications</h3>
                                <p class="text-sm text-gray-500">Send email notifications for important events</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium">Auto-refresh Dashboard</h3>
                                <p class="text-sm text-gray-500">Automatically refresh dashboard data</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- System Information -->
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="p-6 border-b">
                        <h2 class="text-lg font-semibold text-primary">System Information</h2>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 class="font-medium text-gray-700">PurWash Admin Portal</h3>
                                <p class="text-sm text-gray-500">Version 1.0.0</p>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-700">API Status</h3>
                                <p class="text-sm text-green-600">Connected</p>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-700">Last Updated</h3>
                                <p class="text-sm text-gray-500">${new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 class="font-medium text-gray-700">Environment</h3>
                                <p class="text-sm text-gray-500">Development</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="bg-white rounded-lg shadow-sm border">
                    <div class="p-6">
                        <button onclick="saveAllSettings()" class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 mr-4">
                            <i class="fas fa-save mr-2"></i>Save All Settings
                        </button>
                        <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                            <i class="fas fa-undo mr-2"></i>Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Load laundry items
        loadLaundryItems();
        
        console.log('✅ Settings content loaded successfully');
    } catch (error) {
        console.error('❌ Load settings error:', error);
        contentArea.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load settings: ${error.message}</p>
            </div>
        `;
    }
}

async function loadPayoutsContent() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';

    try {
        const summary = await fetchPayoutsSummary();
        const ready = await fetchReadyPayouts();

        contentArea.innerHTML = `
            <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 class="text-2xl font-bold text-primary">Payouts</h1>
                    <p class="text-gray-600">Initiate transfers once funds hit the platform account</p>
                </div>
                <button onclick="runCommissionBackfill()" class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">
                    <i class="fas fa-database mr-2"></i>Backfill Wallets
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                ${['pending_settlement','ready_for_payout','processing','paid','failed'].map(status => `
                    <div class="bg-white p-4 rounded-lg shadow-sm border">
                        <p class="text-xs text-gray-500 uppercase">${status.replace('_',' ')}</p>
                        <p class="text-xl font-bold text-primary">${summary[status]?.count || 0}</p>
                        <p class="text-sm text-gray-600">₵${(summary[status]?.amount || 0).toFixed(2)}</p>
                    </div>
                `).join('')}
            </div>

            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-primary">Ready for Payout</h2>
                    <button onclick="refreshPayouts()" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">
                        <i class="fas fa-sync-alt mr-2"></i>Refresh
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ready Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${ready.length === 0 ? `
                                <tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No payouts ready</td></tr>
                            ` : ready.map(row => {
                                const displayName = (row.firstName || row.lastName) ? `${row.firstName || ''} ${row.lastName || ''}`.trim() : (row.businessName || row.email || 'User');
                                return `
                                    <tr>
                                        <td class="px-6 py-4 text-sm">
                                            <div class="font-medium">${displayName}</div>
                                            <div class="text-gray-500">${row.phone || row.email || ''}</div>
                                        </td>
                                        <td class="px-6 py-4 text-sm">${row.role || 'partner'}</td>
                                        <td class="px-6 py-4 text-sm font-semibold">₵${row.totalAmount.toFixed(2)}</td>
                                        <td class="px-6 py-4 text-sm">
                                            <button onclick="openPayoutModal('${row.userId}', ${row.totalAmount})" class="text-accent hover:text-blue-600 mr-2 ${row.recipientCode ? '' : 'opacity-50 cursor-not-allowed'}" ${row.recipientCode ? '' : 'disabled'}>
                                                Initiate
                                            </button>
                                            ${row.recipientCode ? '' : '<span class="text-xs text-gray-400">No recipient</span>'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Load payouts error:', error);
        contentArea.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load payouts</div>';
    }
}

function refreshPayouts() {
    loadPayoutsContent();
}

async function runCommissionBackfill() {
    const confirmed = confirm('Backfill rider/partner commissions and wallets for paid orders?');
    if (!confirmed) return;
    const limitInput = prompt('How many orders to scan? (default 500)', '500');
    const limit = Number(limitInput || 500);
    if (!Number.isFinite(limit) || limit <= 0) {
        showToast('Invalid limit value', 'error');
        return;
    }
    try {
        const response = await apiCallWithToast('/admin/commissions/backfill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit })
        }, 'Backfill completed');
        const data = response?.data;
        if (data) {
            showToast(`Processed ${data.ordersProcessed}, updated ${data.ordersUpdated}, created ${data.commissionsCreated}`, 'info');
        }
        loadPayoutsContent();
    } catch (error) {
        // handled by apiCallWithToast
    }
}

function openPayoutModal(userId, maxAmount) {
    const content = `
        <form id="initiatePayoutForm" class="space-y-4">
            <input type="hidden" name="userId" value="${userId}">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount (GHS)</label>
                <input type="number" name="amount" value="${maxAmount.toFixed(2)}" min="1" max="${maxAmount.toFixed(2)}" step="0.01" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                <p class="text-xs text-gray-500 mt-1">Max available: ₵${maxAmount.toFixed(2)}</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Send Payout</button>
            </div>
        </form>
    `;

    showModal('Initiate Payout', content, 'sm');

    document.getElementById('initiatePayoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            userId: formData.get('userId'),
            amount: parseFloat(formData.get('amount'))
        };
        try {
            const payoutRes = await apiCallWithToast('/admin/payout/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 'Payout initiated successfully');
            const reference = payoutRes?.data?.reference;
            closeModal();
            if (reference) {
                pollPayoutStatus(reference);
            } else {
                loadPayoutsContent();
            }
        } catch (error) {
            // handled by apiCallWithToast
        }
    });
}

function pollPayoutStatus(reference) {
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 5000;

    const interval = setInterval(async () => {
        attempts += 1;
        try {
            const result = await verifyPayout(reference);
            if (result.status === 'success') {
                clearInterval(interval);
                showToast('Payout successful', 'success');
                loadPayoutsContent();
            } else if (result.status === 'failed' || result.status === 'reversed') {
                clearInterval(interval);
                showToast(`Payout ${result.status}`, 'error');
                loadPayoutsContent();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                showToast('Payout pending, check later', 'info');
            }
        } catch (error) {
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                showToast('Payout verification failed', 'error');
            }
        }
    }, intervalMs);
}

// Laundry Items Management
async function loadLaundryItems() {
    try {
        console.log('📡 Fetching laundry items...');
        const response = await apiCall('/admin/laundry-items');
        const items = response.data || [];
        
        const itemsList = document.getElementById('laundryItemsList');
        
        if (items.length === 0) {
            itemsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-tshirt text-3xl mb-2"></i>
                    <p>No laundry items found</p>
                    <button onclick="addLaundryItem()" class="mt-4 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90">
                        <i class="fas fa-plus mr-2"></i>Add First Item
                    </button>
                </div>
            `;
        } else {
            itemsList.innerHTML = items.map(item => `
                <div class="flex items-center justify-between p-4 border rounded-lg">
                    <div class="flex-1">
                        <h4 class="font-medium">${item.name}</h4>
                        <p class="text-sm text-gray-500">${item.description || 'No description'}</p>
                        <div class="flex items-center space-x-4 mt-2">
                            <span class="text-sm"><strong>Price:</strong> GHS ${item.pricing?.clientPrice || item.basePrice || 0}</span>
                            <span class="text-sm"><strong>Category:</strong> ${item.category}</span>
                            <span class="text-sm"><strong>Service:</strong> ${item.serviceType}</span>
                            <span class="px-2 py-1 text-xs rounded-full ${item.availability?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${item.availability?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editLaundryItem('${item._id}')" class="text-accent hover:text-accent/90">Edit</button>
                        <button onclick="deleteLaundryItem('${item._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load laundry items:', error);
        document.getElementById('laundryItemsList').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Failed to load laundry items</p>
            </div>
        `;
    }
}

async function addLaundryItem() {
    const content = `
        <form id="addLaundryItemForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input type="text" name="name" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select name="category" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                        <option value="clothing">Clothing</option>
                        <option value="bedding">Bedding</option>
                        <option value="specialty">Specialty</option>
                        <option value="household">Household</option>
                        <option value="accessories">Accessories</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                    <select name="serviceType" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                        <option value="wash_and_fold">Wash & Fold</option>
                        <option value="wash_and_iron">Wash & Iron</option>
                        <option value="dry_clean">Dry Clean</option>
                        <option value="iron_only">Iron Only</option>
                        <option value="special_treatment">Special Treatment</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client Price (GHS) *</label>
                    <input type="number" name="pricing.clientPrice" required min="1" step="0.5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Base Price (GHS) *</label>
                    <input type="number" name="pricing.basePrice" required min="0" step="0.5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Processing Time (hours) *</label>
                    <input type="number" name="estimatedProcessingHours" required min="1" max="168" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" rows="3" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent" placeholder="Item description..."></textarea>
            </div>
            
            <div class="flex items-center">
                <input type="checkbox" name="availability.isActive" checked class="mr-2">
                <label class="text-sm font-medium text-gray-700">Active</label>
            </div>
            
            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">Add Item</button>
            </div>
        </form>
    `;
    
    showModal('Add Laundry Item', content, 'lg');
    
    document.getElementById('addLaundryItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Build the item data object with nested structure
        const itemData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            serviceType: formData.get('serviceType'),
            pricing: {
                clientPrice: parseFloat(formData.get('pricing.clientPrice')),
                basePrice: parseFloat(formData.get('pricing.basePrice')),
                embeddedSystemFee: 1
            },
            estimatedProcessingHours: parseInt(formData.get('estimatedProcessingHours')),
            availability: {
                isActive: formData.get('availability.isActive') === 'on'
            }
        };
        
        try {
            await apiCallWithToast('/admin/laundry-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            }, 'Laundry item added successfully');
            
            closeModal();
            loadLaundryItems(); // Refresh the list
        } catch (error) {
            // Error already handled
        }
    });
}

async function editLaundryItem(itemId) {
    // Implementation for editing laundry items
    showToast('Edit functionality coming soon', 'info');
}

async function deleteLaundryItem(itemId) {
    if (confirm('Are you sure you want to delete this laundry item?')) {
        try {
            await apiCallWithToast(`/admin/laundry-items/${itemId}`, {
                method: 'DELETE'
            }, 'Laundry item deleted successfully');
            
            loadLaundryItems(); // Refresh the list
        } catch (error) {
            // Error already handled
        }
    }
}

function savePlatformFees() {
    const commission = document.getElementById('platformCommission').value;
    const serviceFee = document.getElementById('serviceFee').value;
    const deliveryFee = document.getElementById('deliveryFee').value;
    
    // Save to backend
    apiCallWithToast('/admin/config/platform-fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            platformCommission: parseFloat(commission),
            serviceFee: parseFloat(serviceFee),
            deliveryFee: parseFloat(deliveryFee)
        })
    }, 'Platform fees saved successfully');
}

function saveAllSettings() {
    savePlatformFees();
    showToast('All settings saved successfully', 'success');
}
