# Partner/Rider Multi-Step Registration API

## Overview
A 3-step registration process specifically designed for Riders and Partners who want to work with weWash. This ensures complete profile information for better service delivery.

## Base URL
```
http://localhost:5000/api/partner-registration
```

## Step 1: Basic Information
**POST** `/step-1`

### Request Body
```json
{
  "email": "partner@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0201234567",
  "role": "partner" // or "rider"
}
```

### Response
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "step": 1,
  "nextStep": 2,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "partner@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "0201234567"
      },
      "role": "partner"
    },
    "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Step 2: Business Information
**POST** `/step-2`

### Headers
```
Authorization: Bearer <tempToken_from_step_1>
```

### Request Body
```json
{
  "businessName": "John's Laundry Service",
  "address": "123 Main St, Accra, Ghana",
  "lat": 5.6037,
  "lng": -0.1870,
  "bio": "Professional laundry service with 5 years experience",
  "operatingHours": {
    "open": "08:00",
    "close": "18:00"
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Step 2 completed successfully",
  "step": 2,
  "nextStep": 3,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "businessName": "John's Laundry Service",
      "location": {
        "address": "123 Main St, Accra, Ghana",
        "lat": 5.6037,
        "lng": -0.1870
      },
      "bio": "Professional laundry service with 5 years experience",
      "operatingHours": {
        "open": "08:00",
        "close": "18:00"
      }
    },
    "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Step 3: Payment Setup
**POST** `/step-3`

### Headers
```
Authorization: Bearer <tempToken_from_step_2>
```

### Request Body
```json
{
  "momoNumber": "0201234567",
  "momoNetwork": "mtn", // "mtn", "vod", or "atl"
  "profilePicture": "https://example.com/avatar.jpg"
}
```

### Response
```json
{
  "success": true,
  "message": "Registration completed successfully!",
  "step": 3,
  "isComplete": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "partner@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "0201234567"
      },
      "role": "partner",
      "businessName": "John's Laundry Service",
      "location": {
        "address": "123 Main St, Accra, Ghana",
        "lat": 5.6037,
        "lng": -0.1870
      },
      "bio": "Professional laundry service with 5 years experience",
      "operatingHours": {
        "open": "08:00",
        "close": "18:00"
      },
      "momo": {
        "number": "0201234567",
        "network": "mtn",
        "isVerified": false
      },
      "profilePicture": "https://example.com/avatar.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profileCompleteness": {
      "completeness": 85,
      "missingFields": [
        {
          "field": "momo",
          "category": "payment",
          "displayName": "MoMo Verification"
        }
      ],
      "isComplete": false
    }
  }
}
```

## Get Registration Status
**GET** `/status`

### Headers
```
Authorization: Bearer <token>
```

### Response
```json
{
  "success": true,
  "data": {
    "currentStep": 2,
    "isComplete": false,
    "completeness": 60,
    "missingFields": [
      {
        "field": "momo",
        "category": "payment",
        "displayName": "MoMo Verification"
      },
      {
        "field": "profilePicture",
        "category": "business",
        "displayName": "Profile Picture"
      }
    ],
    "user": { ... }
  }
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters"
  ],
  "step": 1
}
```

### User Already Exists (400)
```json
{
  "success": false,
  "message": "User with this email or phone already exists",
  "step": 1
}
```

### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "step": 2
}
```

## Frontend Implementation Tips

### 1. Progress Indicator
Show a 3-step progress bar:
- Step 1: Basic Info ✓
- Step 2: Business Info →
- Step 3: Payment Setup

### 2. Form Validation
Validate each step before submission:
- Email format and uniqueness
- Phone number format
- Required fields completion

### 3. Token Management
- Store tempToken after step 1
- Update token after each step
- Use final token for authenticated requests

### 4. Profile Completeness
Use the completeness data to:
- Show progress percentage
- Highlight missing fields
- Guide users to complete profile

### 5. Error Handling
Display specific error messages for each step
- Validation errors inline with form fields
- Server errors as toast notifications
- Network errors with retry options

## Next Steps After Registration

1. **MoMo Verification**: Use `/api/auth/verify-momo` to verify mobile money
2. **Profile Completion**: Use `/api/auth/profile-completeness` to track progress
3. **WebSocket Connection**: Connect to real-time order notifications
4. **Business Setup**: Add services, pricing, and availability

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Temporary tokens are single-use per step
- All routes use HTTPS in production
- Input validation on all endpoints
