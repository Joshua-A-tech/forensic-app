# Forensic App

A production-grade forensic case and evidence management system with:
- **User Authentication**: JWT-based login with role-based access control (admin, investigator, viewer)
- **Case Management**: Create, track, and manage forensic cases with evidence linking
- **Evidence Management**: Upload, verify (SHA-256), and download evidence with metadata tracking
- **Advanced Search**: Full-text search across cases, evidence, and submissions
- **Export**: PDF and CSV export of cases and submissions
- **Audit Logging**: Complete audit trail of all user actions
- **Security**: Rate limiting, input validation, password hashing, comprehensive logging
- **Database**: PostgreSQL with migrations, indexing, and relationship integrity

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (or use Vercel Postgres)
- Git

### Installation
```bash
# Install dependencies
npm install

# Create .env from .env.example
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/forensic_db

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

### Test the API
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "investigator1", "email": "inv@example.com", "password": "SecurePass123!", "role": "investigator"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "investigator1", "password": "SecurePass123!"}'

# Use the token in Authorization header for protected endpoints
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Get JWT token

### Cases
- `POST /api/cases` - Create case (requires auth)
- `GET /api/cases` - List cases (with filtering)
- `GET /api/cases/:id` - Get case details + evidence
- `PUT /api/cases/:id` - Update case status/assignment

### Evidence
- `POST /api/evidence/upload` - Upload evidence file with hash verification
- `GET /api/evidence/case/:case_id` - List evidence for case
- `GET /api/evidence/download/:id` - Download evidence file

### Submissions
- `POST /api/submissions` - Create submission (public)
- `GET /api/submissions` - Get all submissions (admin only)

### Search & Export
- `GET /api/search/search` - Full-text search with date filtering
- `GET /api/search/export/pdf/:case_id` - Export case to PDF
- `GET /api/search/export/csv/:type` - Export to CSV (submissions/evidence)

See `API_DOCUMENTATION.md` for detailed endpoint documentation.

## Deployment

### To Vercel (Recommended)

1. **Rename server files:**
   ```bash
   mv server.js server-old.js
   mv server-new.js server.js
   git add -A
   git commit -m "Switch to production backend"
   git push origin master
   ```

2. **Deploy:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Add environment variables in Vercel dashboard:**
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (generate secure random string)
   - `ADMIN_TOKEN` (generate secure random string)

4. **Run migrations:**
   ```bash
   vercel env pull
   npm run migrate
   ```

See `DEPLOYMENT_GUIDE.md` for full production deployment steps.

### To Netlify

Use `netlify/functions/server.js` (already configured):
```bash
netlify deploy --prod
```

## Features

### Role-Based Access Control
- **Admin**: Full system access, user management
- **Investigator**: Create/manage cases, upload evidence
- **Viewer**: Read-only access to cases and evidence

### Security
- JWT authentication (configurable expiry, default 7 days)
- Password hashing with bcryptjs (10 salt rounds)
- Rate limiting (100 req/15min general, 5 logins/15min, 50 uploads/hour)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- File hash verification (SHA-256)
- Comprehensive audit logs

### Audit Trail
Every action is logged with:
- User ID
- Action type (CREATE, UPDATE, DELETE, UPLOAD, DOWNLOAD)
- Resource type and ID
- IP address
- Timestamp

### Data Integrity
- Foreign key constraints
- Cascade deletes for related data
- Transaction support
- Database indexing for performance

## Database Schema

**Users**: username, email, password_hash, role, status
**Cases**: case_number, title, description, status, assigned_to, created_by
**Evidence**: case_id, filename, file_path, file_hash, file_size, file_type, uploaded_by
**Submissions**: name, email, age, role, recommend, comments, languages, case_id
**Audit Logs**: user_id, action, resource_type, resource_id, details, ip_address

See migrations in `migrations/001_initial_schema.sql`

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-here
ADMIN_TOKEN=admin-token-secret
JWT_EXPIRY=7d
NODE_ENV=development
PORT=3000
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## File Structure

```
.
├── server.js / server-new.js  - Express app entry point
├── src/
│   ├── config/
│   │   └── db.js              - PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js            - JWT authentication
│   │   └── rateLimiter.js     - Express rate limit
│   ├── controllers/
│   │   ├── authController.js  - Register & login
│   │   ├── caseController.js  - Case CRUD
│   │   ├── evidenceController.js - Evidence upload/download
│   │   └── searchController.js - Search & export
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── caseRoutes.js
│   │   ├── evidenceRoutes.js
│   │   ├── submissionRoutes.js
│   │   └── searchRoutes.js
│   └── utils/
│       ├── helpers.js         - File hashing, audit logging
│       └── validators.js      - Input validation
├── migrations/
│   └── 001_initial_schema.sql - Database schema
├── scripts/
│   └── migrate.js             - Migration runner
├── uploads/                   - Evidence file storage
├── package.json
├── .env.example
├── API_DOCUMENTATION.md       - Full API reference
└── DEPLOYMENT_GUIDE.md        - Production deployment guide
```

## Performance Considerations

- Database connection pooling (enabled)
- Query indexes on frequently filtered columns
- Pagination support on list endpoints (limit/offset)
- File streaming for large downloads
- Rate limiting to prevent abuse
- GZIP compression (Express default)

## Future Enhancements

- [ ] Webhook notifications for case events
- [ ] Email alerts on submissions
- [ ] Two-factor authentication (2FA)
- [ ] Advanced reporting dashboard
- [ ] Real-time case updates (WebSocket)
- [ ] Blockchain evidence integrity verification
- [ ] Mobile app (React Native)
- [ ] Video/image forensic tools

## Support & Contributions

For issues, suggestions, or contributions:
- Email: muorongolejoshua@gmail.com
- GitHub: https://github.com/Joshua-A-tech/forensic-app

## License

MIT License - See LICENSE file for details

## Contributors

- Joshua A-tech (Lead Developer)
- Tech Gurus (Organization)
