# Deploying to Netlify

Your project is now configured for Netlify deployment with both static files and serverless functions.

## Quick Start

### 1. Install Netlify CLI
```powershell
npm install -g netlify-cli
```

### 2. Deploy
From your project directory:
```powershell
cd 'C:\Users\Joshua\OneDrive\Desktop\CSS'
netlify deploy --prod
```

**First time?** You'll be prompted to:
- Authenticate with your Netlify account (or create a free one)
- Confirm the deploy directory (use `.` for current)
- Wait for deployment to complete

You'll get a live URL like:
```
https://your-site-name.netlify.app
```

### 3. Set Admin Token (Optional)
To secure your admin panel:

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Add a new variable:
   - **Name:** `ADMIN_TOKEN`
   - **Value:** `your-secret-token`
5. Trigger a new deploy:
```powershell
netlify deploy --prod
```

## Access Your Site

- **Landing page:** `https://your-site.netlify.app/landing page.html`
- **Contact form:** `https://your-site.netlify.app/form.html`
- **Admin panel:** `https://your-site.netlify.app/submissions.html`
  - Enter your `ADMIN_TOKEN` from step 3

## Notes

- **Submissions Storage:** Stored in `/tmp` (temporary on Netlify). For permanent storage, integrate a database.
- **Local Testing:** Still works with `npm start`
- **Auto-Deploys:** Connect your GitHub repo for automatic deploys on push

## GitHub Integration (Recommended)

For auto-deploys:
1. Push this project to GitHub
2. Go to https://app.netlify.com/new
3. Select "Connect to Git"
4. Choose your GitHub repo
5. Set the `ADMIN_TOKEN` environment variable
6. Deploy!

Done! Your site is now live and serverless.
