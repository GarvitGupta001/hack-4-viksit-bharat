# API Testing Guide

## Available API Endpoints

### 1. Health Check
- **Endpoint**: `GET /`
- **Description**: Verify server is running
- **Auth Required**: No
- **Expected Response**: 200 OK

### 2. Authentication Endpoints

#### Register User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Create a new user account
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "User Name",
    "userType": "individual" // or "company"
  }
  ```
- **Expected Response**: 201 Created
- **Returns**: User object with ID and token

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and get JWT token
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Expected Response**: 200 OK
- **Returns**: JWT token and user info

#### Get Profile
- **Endpoint**: `GET /api/auth/profile`
- **Description**: Retrieve current user's profile
- **Auth Required**: Yes (Bearer token)
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: 200 OK
- **Returns**: User profile data

#### Update Profile
- **Endpoint**: `PUT /api/auth/profile`
- **Description**: Update user profile information
- **Auth Required**: Yes (Bearer token)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "bio": "User bio",
    "phone": "Phone number"
  }
  ```
- **Expected Response**: 200 OK
- **Returns**: Updated user object

#### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Description**: Logout current user
- **Auth Required**: Yes (Bearer token)
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: 200 OK

---

## Testing Methods

### Method 1: Using Postman (Recommended for Manual Testing)

1. Import the collection: `Carbon_Credit_API.postman_collection.json`
2. Set the `token` variable in Postman after login
3. Run individual requests or use the Collection Runner

### Method 2: Using Node.js Test Script

1. Ensure the server is running:
   ```bash
   npm run dev
   ```

2. In another terminal, run the test script:
   ```bash
   node tests/api.test.js
   ```

### Method 3: Using cURL

Examples for common endpoints:

**Health Check**:
```bash
curl -X GET http://localhost:3000/
```

**Register**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "name": "Test User",
    "userType": "individual"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

**Get Profile** (replace TOKEN with actual JWT):
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Cases to Test

### 1. Missing Required Fields
- **Test**: Login without password
- **Expected**: 400 Bad Request

### 2. Invalid Email Format
- **Test**: Register with invalid email
- **Expected**: 400 Bad Request or validation error

### 3. Unauthorized Access
- **Test**: Access protected endpoint without token
- **Expected**: 401 Unauthorized

### 4. Invalid Credentials
- **Test**: Login with wrong password
- **Expected**: 401 Unauthorized

### 5. Duplicate Email
- **Test**: Register with existing email
- **Expected**: 409 Conflict or validation error

---

## Success Indicators

✓ All endpoints return appropriate status codes  
✓ Protected routes reject requests without valid tokens  
✓ User registration creates new users with hashed passwords  
✓ Login returns valid JWT tokens  
✓ Profile endpoints return correct user data  
✓ Error responses have clear messages  

---

## Setup Instructions

1. **Start the server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Server runs on**: http://localhost:3000

3. **Test via**:
   - Postman (import the collection)
   - cURL commands
   - Node.js test script
   - Browser (for GET requests only)

---

## Notes

- JWT tokens are valid for a limited time (check auth service for expiration)
- Passwords should be at least 8 characters
- Email validation follows standard email format rules
- Database must be running for full functionality
