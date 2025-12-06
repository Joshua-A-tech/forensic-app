# Forensic App - Backend Deployment Guide

## Overview
This guide covers deploying the production-grade Forensic App backend to Vercel with PostgreSQL support.

## Prerequisites
- Vercel account (https://vercel.com)
- PostgreSQL database (Vercel Postgres, AWS RDS, or local)
- Node.js 18+ installed locally
- Git and GitHub account

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, connect a PostgreSQL database via "Storage" → "Create Database" → "Postgres"
2. Copy the `POSTGRES_URL` environment variable

### Option B: External PostgreSQL
1. Create a PostgreSQL instance on AWS RDS, Azure Database, or any provider
2. Get the connection string: `postgresql://user:password@host:port/dbname`

## Step 2: Run Database Migrations

Local (before deployment):
```bash
npm install
DATABASE_URL="postgresql://..." npm run migrate
```

Or after deploying to Vercel, run migrations via Vercel CLI:
```bash
vercel env pull
npm run migrate
```

## Step 3: Configure Environment Variables

Add these variables to Vercel Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=generate-a-secure-random-string-here
ADMIN_TOKEN=another-secure-random-string
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=52428800
UPLOAD_DIR=/tmp/uploads
```

**Generate secure strings:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Update Vercel Configuration

`vercel.json` is already configured to route all traffic to `server-new.js`. Rename it:

```bash
mv server.js server-old.js
mv server-new.js server.js
git add vercel.json server.js
git commit -m "Update to production backend"
```

Or update `vercel.json` to point to the new server file.

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Deploy
vercel --prod
```

Or via GitHub: 
1. Push code to GitHub
2. In Vercel dashboard, connect repo and auto-deploy on push

## Step 6: Verify Deployment

Test the API endpoints:

```bash
# Health check
curl https://your-deployment.vercel.app/health

# Register
curl -X POST https://your-deployment.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "Password123!", "role": "investigator"}'

# Login
curl -X POST https://your-deployment.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123!"}'
```

## Step 7: File Uploads on Vercel

Vercel has an ephemeral filesystem. For persistent file storage:

### Option A: Vercel Blob (Recommended)
1. Install: `npm i @vercel/blob`
2. Update `evidenceController.js` to use Vercel Blob instead of local filesystem
3. Add `BLOB_READ_WRITE_TOKEN` to environment variables

### Option B: AWS S3
1. Install: `npm i aws-sdk`
2. Configure AWS credentials in environment variables
3. Update file upload logic to use S3

### Option C: Accept ephemeral uploads (Demo only)
- Uploads are temporary; data persists in database but files disappear on redeploy

## Step 8: Email Notifications (Optional)

To send email on submissions, configure SMTP:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

Install: `npm i nodemailer`

## Step 9: Monitoring & Logging

Monitor deployment via Vercel dashboard:
1. Check Function Logs
2. Monitor database connection
3. Track error rates and response times

For production logging, integrate with:
- Datadog
- New Relic
- LogRocket

## Scaling Considerations

- **Database**: Upgrade PostgreSQL plan if queries slow
- **File Storage**: Switch to cloud storage (S3, Azure Blob) for large files
- **Rate Limiting**: Adjust limits based on usage patterns
- **Caching**: Add Redis for session/data caching

## Security Hardening

Before production:
- [ ] Rotate `JWT_SECRET` and `ADMIN_TOKEN` regularly
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure CORS for specific origins
- [ ] Set strong database passwords
- [ ] Enable database backups
- [ ] Review audit logs regularly
- [ ] Implement DDoS protection (Vercel + Cloudflare)
- [ ] Add Web Application Firewall (WAF)

## Troubleshooting

### Database Connection Errors
```
Error: connect ECONNREFUSED
```
- Verify DATABASE_URL in environment variables
- Check database firewall rules
- Ensure migrations ran successfully

### JWT Token Invalid
```
Error: invalid signature
```
- Verify JWT_SECRET matches across all instances
- Check token hasn't expired (default: 7 days)

### File Upload Errors
- Check MAX_FILE_SIZE limit
- Verify upload directory permissions
- Monitor disk space (for local) or storage quota

### Performance Issues
- Check database query performance
- Enable connection pooling
- Add caching layer (Redis)
- Consider database optimization (indexes)

## Support
For issues, contact: muorongolejoshua@gmail.com

See `API_DOCUMENTATION.md` for full API reference.
