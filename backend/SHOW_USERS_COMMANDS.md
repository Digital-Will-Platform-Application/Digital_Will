# Commands to Show Users

## Option 1: Using the Script (Recommended)
```bash
cd backend
npm run show-users
```

## Option 2: Using the API Endpoint
```bash
# Get all users
curl http://localhost:3001/api/users

# Or using PowerShell
Invoke-WebRequest -Uri http://localhost:3001/api/users -UseBasicParsing | Select-Object -ExpandProperty Content
```

## Option 3: Direct Database Query (Using psql)
```bash
# Connect to database and run query
psql "postgresql://neondb_owner:npg_3JMRfCoD1Bvg@ep-lively-butterfly-ailuw9d0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -c "SELECT id, username, email, mobile, age, gender, state, postal_code, created_at FROM users ORDER BY created_at DESC;"
```

## Option 4: Using Node.js directly
```bash
cd backend
node scripts/showUsers.js
```

## API Endpoints

### Get All Users
- **GET** `http://localhost:3001/api/users`
- Returns: List of all users with their details (excluding passwords)

### Get User by ID
- **GET** `http://localhost:3001/api/users/:id`
- Example: `http://localhost:3001/api/users/1`
- Returns: Single user details

## Example API Response
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "mobile": "1234567890",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "age": 30,
      "gender": "male",
      "state": "California",
      "postal_code": "12345",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```
