# Admin Management API Documentation

## Overview
This document outlines the comprehensive admin management API for the Purwash laundry management system. The API provides full CRUD operations and management capabilities for orders, clients, riders, and partners.

## Authentication
All admin endpoints require authentication using the `adminAuth` middleware. Admin users must have appropriate permissions to access specific resources.

## Base URL
```
/api/admin
```

---

## Dashboard Endpoints

### Get Dashboard Statistics
```
GET /api/admin/stats
```
**Response:**
```json
{
  "totalOrders": 1250,
  "pendingOrders": 45,
  "activeRiders": 28,
  "activePartners": 15,
  "totalClients": 892,
  "monthlyRevenue": 15420.50
}
```

### Get Investor Metrics
```
GET /api/admin/investor-metrics
```
**Response:**
```json
{
  "mrr": 15420.50,
  "arr": 185046.00,
  "arpo": 12.34,
  "growthRate": "15.25%",
  "totalOrders": 1250,
  "previousPeriodOrders": 1085
}
```

---

## Order Management

### Get All Orders
```
GET /api/admin/orders?page=1&limit=20&status=pending&startDate=2024-01-01&endDate=2024-01-31&search=ORD-001&sortBy=createdAt&sortOrder=desc
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Order status filter
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Search by order ID or client phone
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

### Get Single Order
```
GET /api/admin/orders/:id
```

### Update Order Status
```
PATCH /api/admin/orders/:id/status
```
**Body:**
```json
{
  "status": "assigned",
  "notes": "Order assigned to rider John Doe"
}
```

### Assign Order to Partners
```
POST /api/admin/orders/assign
```
**Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "riderId": "507f1f77bcf86cd799439012",
  "laundryId": "507f1f77bcf86cd799439013"
}
```

### Force Confirm Delivery
```
PATCH /api/admin/orders/:orderId/force-confirm
```

### Cancel Order
```
DELETE /api/admin/orders/:id
```
**Body:**
```json
{
  "reason": "Client requested cancellation"
}
```

---

## Client Management

### Get All Clients
```
GET /api/admin/clients?page=1&limit=20&search=john&status=active&startDate=2024-01-01
```

### Get Single Client
```
GET /api/admin/clients/:id
```

### Update Client
```
PATCH /api/admin/clients/:id
```
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+233123456789"
}
```

### Toggle Client Status
```
PATCH /api/admin/clients/:id/status
```
**Body:**
```json
{
  "status": "suspended",
  "reason": "Multiple order cancellations"
}
```

### Get Client Analytics
```
GET /api/admin/clients/analytics
```

### Add Client Note
```
POST /api/admin/clients/:id/notes
```
**Body:**
```json
{
  "note": "Client prefers morning deliveries",
  "type": "general"
}
```

### Delete Client
```
DELETE /api/admin/clients/:id
```
**Body:**
```json
{
  "reason": "Fraudulent activity detected"
}
```

---

## Rider Management

### Get All Riders
```
GET /api/admin/riders?page=1&limit=20&search=john&status=active&isOnline=true&vehicleType=motorcycle
```

### Get Single Rider
```
GET /api/admin/riders/:id
```

### Update Rider
```
PATCH /api/admin/riders/:id
```
**Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "vehicleType": "motorcycle",
  "vehicleNumber": "ABC-123"
}
```

### Toggle Rider Status
```
PATCH /api/admin/riders/:id/status
```
**Body:**
```json
{
  "status": "suspended",
  "reason": "Multiple delivery complaints"
}
```

### Get Rider Analytics
```
GET /api/admin/riders/analytics
```

### Add Rider Note
```
POST /api/admin/riders/:id/notes
```
**Body:**
```json
{
  "note": "Excellent performance this month",
  "type": "praise"
}
```

### Adjust Rider Wallet
```
POST /api/admin/riders/:id/wallet/adjust
```
**Body:**
```json
{
  "amount": 50.00,
  "reason": "Performance bonus",
  "type": "bonus"
}
```

### Delete Rider
```
DELETE /api/admin/riders/:id
```

---

## Partner Management

### Get All Partners
```
GET /api/admin/partners?page=1&limit=20&search=clean&status=active&isVerified=true
```

### Get Single Partner
```
GET /api/admin/partners/:id
```

### Update Partner
```
PATCH /api/admin/partners/:id
```
**Body:**
```json
{
  "businessName": "Sparkle Clean Laundry",
  "location": {
    "address": "123 Main St, Accra",
    "lat": 5.6037,
    "lng": -0.1870
  }
}
```

### Toggle Partner Status
```
PATCH /api/admin/partners/:id/status
```

### Verify Partner MoMo
```
PATCH /api/admin/partners/:id/momo/verify
```
**Body:**
```json
{
  "verified": true,
  "network": "mtn",
  "resolvedName": "John Doe"
}
```

### Get Partner Analytics
```
GET /api/admin/partners/analytics
```

### Add Partner Note
```
POST /api/admin/partners/:id/notes
```

### Adjust Partner Wallet
```
POST /api/admin/partners/:id/wallet/adjust
```

### Delete Partner
```
DELETE /api/admin/partners/:id
```

### Get Partner Locations
```
GET /api/admin/partners/locations
```

---

## User Management (General)

### Ban User
```
POST /api/admin/ban-user
```
**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "reason": "Violation of terms of service",
  "banType": "rider"
}
```

### Unban User
```
POST /api/admin/unban-user
```
**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "banType": "rider"
}
```

---

## Audit Logs

### Get Audit Logs
```
GET /api/admin/logs?page=1&limit=50&action=ORDER_STATUS_CHANGE&startDate=2024-01-01&endDate=2024-01-31
```
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `action`: Filter by action type
- `startDate`: Filter by start date
- `endDate`: Filter by end date

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Data Models

### Order Status Values
- `created`: Order created by client
- `assigned`: Order assigned to rider/partner
- `on_my_way_to_pick`: Rider en route to pickup
- `picked_up`: Rider has collected items
- `dropped_at_laundry`: Items delivered to partner
- `washing`: Partner is processing items
- `ready_for_pick`: Items ready for delivery
- `out_for_delivery`: Rider delivering items
- `delivered`: Order completed
- `cancelled`: Order cancelled

### Account Status Values
- `active`: Account is active
- `suspended`: Account temporarily suspended
- `banned`: Account permanently banned

### Note Types
- `general`: General note
- `warning`: Warning note
- `complaint`: Complaint record
- `praise`: Positive feedback

---

## Security Considerations

1. All admin endpoints require authentication
2. Admin permissions are checked based on user role
3. All actions are logged for audit trails
4. Sensitive operations require confirmation
5. Soft deletes are used for data integrity
6. Input validation is performed on all endpoints

---

## Rate Limiting

Admin endpoints are subject to rate limiting to prevent abuse:
- 100 requests per minute per admin user
- 1000 requests per minute per IP address

---

## Pagination

All list endpoints support pagination with the following response structure:

```json
{
  "data": [...],
  "pagination": {
    "current": 1,
    "pages": 10,
    "total": 200
  }
}
```
