# Deploying to Vercel

Your project is now configured for Vercel deployment with both the static site and the Express API backend.

## Quick Start

### 1. Install Vercel CLI
```powershell
npm install -g vercel
```

### 2. Initialize & Deploy
From your project directory:
```powershell
cd 'C:\Users\Joshua\OneDrive\Desktop\CSS'
vercel --prod
```

**First time?** You'll be prompted to:
- Log in or create a free Vercel account
- Confirm project name
- Select a team (choose personal)
- Confirm root directory (press Enter to use current)

The CLI will then deploy your project and give you a live URL like:
```
https://your-project-xyz.vercel.app
```

### 3. Set Admin Token (Optional but Recommended)
To access the admin submissions page with a secure token:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `ADMIN_TOKEN`
   - **Value:** `your-secret-token` (e.g., `mySecureToken123`)
5. Redeploy:
```powershell
vercel --prod
```

### 4. Access Your Site
- **Landing page:** `https://your-project.vercel.app/landing page.html`
- **Contact form:** `https://your-project.vercel.app/form.html`
- **Admin panel:** `https://your-project.vercel.app/submissions.html`
  - Enter your `ADMIN_TOKEN` to view submissions

## Notes

- **Submissions Storage:** On Vercel, submissions are stored in `/tmp` (temporary). To persist data permanently, integrate a database like MongoDB, PostgreSQL, or Supabase.
- **Local Testing:** Still works with `npm start` locally.
- **Auto-Redeploy:** Connect your GitHub repo to Vercel for automatic deployments on every push.

## Next Steps

To connect GitHub for automatic deploys:
1. Push your project to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Set the `ADMIN_TOKEN` environment variable
5. Deploy!

Any questions? Let me know!
