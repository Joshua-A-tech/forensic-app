# Forensic App - Backend API Documentation

## Overview
The Forensic App is a production-grade case and evidence management system with JWT authentication, role-based access control, file versioning, audit trails, and advanced search/export capabilities.

## Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://forensic-9a00kxj71-joshua-a-techs-projects.vercel.app`

## Authentication
All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

Get a token by logging in:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password"}'
```

## Roles & Permissions
- **admin**: Full access (create/update/delete cases, upload evidence, view all submissions, manage users)
- **investigator**: Can create/update cases, upload evidence, search
- **viewer**: Read-only access to cases and evidence

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "investigator"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "investigator"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "investigator"
  }
}
```

### Cases

#### Create Case
```
POST /api/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "case_number": "CASE-2025-001",
  "title": "Evidence Collection - Incident X",
  "description": "Initial evidence gathering for incident X investigation",
  "assigned_to": 2
}

Response: { id, case_number, title, status, assigned_to, created_at, ... }
```

#### Get All Cases (with filtering)
```
GET /api/cases?status=open&assigned_to=2&limit=50&offset=0
Authorization: Bearer <token>

Response: [ { id, case_number, title, status, ... }, ... ]
```

#### Get Case by ID (includes evidence)
```
GET /api/cases/:id
Authorization: Bearer <token>

Response: { id, case_number, title, ..., evidence: [ { id, filename, file_hash, ... }, ... ] }
```

#### Update Case
```
PUT /api/cases/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "closed",
  "assigned_to": 3
}

Response: { id, case_number, title, status, assigned_to, updated_at, ... }
```

### Evidence

#### Upload Evidence File
```
POST /api/evidence/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
case_id: 1

Response:
{
  "message": "Evidence uploaded successfully",
  "evidence": {
    "id": 5,
    "filename": "evidence.zip",
    "file_hash": "sha256hash...",
    "file_size": 1048576,
    "uploaded_at": "2025-12-06T10:30:00Z"
  }
}
```

#### Get Evidence for Case
```
GET /api/evidence/case/:case_id
Authorization: Bearer <token>

Response: [ { id, case_id, filename, file_hash, file_size, file_type, created_at, ... }, ... ]
```

#### Download Evidence
```
GET /api/evidence/download/:id
Authorization: Bearer <token>

Response: (binary file download)
```

### Submissions

#### Create Submission (public, no auth required)
```
POST /api/submissions
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 30,
  "role": "witness",
  "recommend": true,
  "comments": "Additional details...",
  "languages": ["English", "Spanish"],
  "case_id": 1
}

Response: { message, submissionId }
```

#### Get All Submissions (admin only)
```
GET /api/submissions?limit=50&offset=0
Authorization: Bearer <token>

Response: [ { id, name, email, age, role, recommend, created_at, ... }, ... ]
```

### Search & Export

#### Search Evidence & Submissions
```
GET /api/search/search?q=keyword&case_id=1&start_date=2025-01-01&end_date=2025-12-31&limit=50
Authorization: Bearer <token>

Response: [ { type, id, title, hash, created_at, case_number, ... }, ... ]
```

#### Export Case to PDF
```
GET /api/search/export/pdf/:case_id
Authorization: Bearer <token>

Response: (PDF file download)
```

#### Export to CSV
```
GET /api/search/export/csv/submissions
GET /api/search/export/csv/evidence
GET /api/search/export/csv/submissions/:case_id
GET /api/search/export/csv/evidence/:case_id
Authorization: Bearer <token>

Response: (CSV file download)
```

## Error Responses

### 400 Bad Request
```json
{
  "errors": {
    "username": "Username must be 3-100 characters",
    "email": "Invalid email address"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

## Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Login**: 5 attempts per 15 minutes
- **File Upload**: 50 uploads per hour

## Security Features
- JWT-based authentication with configurable expiry (default: 7 days)
- Password hashing with bcryptjs (salt rounds: 10)
- Role-based access control (admin, investigator, viewer)
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- File hash verification (SHA-256)
- Comprehensive audit logging
- CORS support with configurable origins
- File upload size limits (default: 50MB)

## Database Schema

### Users Table
- id (serial primary key)
- username (unique)
- email (unique)
- password_hash
- role (admin, investigator, viewer)
- status (active, inactive)
- created_at, updated_at

### Cases Table
- id (serial primary key)
- case_number (unique)
- title
- description
- status (open, in_progress, closed)
- assigned_to (foreign key: users.id)
- created_by (foreign key: users.id)
- created_at, updated_at

### Evidence Table
- id (serial primary key)
- case_id (foreign key: cases.id)
- filename
- file_path
- file_hash (SHA-256)
- file_size
- file_type
- uploaded_by (foreign key: users.id)
- created_at, updated_at

### Submissions Table
- id (serial primary key)
- case_id (foreign key: cases.id, nullable)
- name
- email
- age
- role
- recommend
- comments
- languages (JSON array)
- created_at

### Audit Logs Table
- id (serial primary key)
- user_id (foreign key: users.id)
- action (e.g., USER_REGISTERED, CASE_CREATED, EVIDENCE_UPLOADED)
- resource_type
- resource_id
- details
- ip_address
- created_at

## Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/forensic_db
JWT_SECRET=your-jwt-secret-key
ADMIN_TOKEN=your-admin-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
MAX_FILE_SIZE=52428800
NODE_ENV=development
PORT=3000
```

## Local Development

### Setup
```bash
# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Testing
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "Password123!", "role": "investigator"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123!"}'

# Create a case
curl -X POST http://localhost:3000/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"case_number": "TEST-001", "title": "Test Case", "description": "Test Description"}'
```

## Webhook Support (Future)
Planned webhook notifications for:
- Case status changes
- Evidence uploaded
- Submission received
- User actions

Configure webhooks in project settings (coming soon).

## Support & Issues
For issues, errors, or feature requests, contact: muorongolejoshua@gmail.com
