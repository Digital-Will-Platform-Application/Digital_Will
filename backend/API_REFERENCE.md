# API Reference

## Base URL
```
http://localhost:3001
```

## Endpoints

### 1. Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "password": "password123",
  "confirm_password": "password123",
  "address1": "123 Main Street",
  "address2": "Apt 4B",
  "age": 30,
  "gender": "male",
  "state": "California",
  "postal_code": "12345"
}
```

**Required Fields:**
- `username` (string, unique)
- `email` (string, unique, valid email format)
- `password` (string, min 6 characters)
- `confirm_password` (string, must match password)

**Optional Fields:**
- `mobile`
- `address1`
- `address2`
- `age` (number)
- `gender`
- `state`
- `postal_code`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "mobile": "1234567890",
      "address1": "123 Main Street",
      "address2": "Apt 4B",
      "age": 30,
      "gender": "male",
      "state": "California",
      "postal_code": "12345",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 2. Login
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Required Fields:**
- `email` (string)
- `password` (string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "mobile": "1234567890",
      "address1": "123 Main Street",
      "address2": "Apt 4B",
      "age": 30,
      "gender": "male",
      "state": "California",
      "postal_code": "12345",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Health Check
**GET** `/health`

Check if the server is running.

**Response (200):**
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Test Database Connection
**GET** `/api/test-db`

Test the database connection.

**Response (200):**
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication

After successful registration or login, you'll receive a JWT token. Include this token in the `Authorization` header for protected routes:

```
Authorization: Bearer <your_token_here>
```

## Example Usage with cURL

### Register:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirm_password": "password123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Example Usage with JavaScript (Fetch)

### Register:
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    confirm_password: 'password123',
    mobile: '1234567890',
    address1: '123 Main St',
    age: 30,
    gender: 'male',
    state: 'California',
    postal_code: '12345'
  })
});

const data = await response.json();
console.log(data);
```

### Login:
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```
