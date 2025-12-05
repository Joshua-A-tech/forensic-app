# Forensic App

This repository contains a small Express server and static front-end for a demo forensic app. The project is ready to be pushed to GitHub and deployed to Vercel or Netlify. This repo includes a helper PowerShell script to create a GitHub repository and deploy to Vercel using the CLI tools.

Prerequisites

- Node.js and npm installed
- Git installed and configured
- GitHub CLI (`gh`) installed and authenticated: https://cli.github.com/
- Vercel CLI (`vercel`) installed and authenticated: https://vercel.com/docs/cli

Quick local test

1. Install dependencies:

```powershell
npm install
```

2. Start the server (set `ADMIN_TOKEN` for admin API access):

```powershell
$env:ADMIN_TOKEN = 'your-secret'
$env:ADMIN_TOKEN = 'your-secret'; npm start
```

3. Open `http://localhost:3000/forensic-login.html` in your browser.

Automated push + deploy (PowerShell)

I included a helper script at `deploy-scripts/push-to-github-and-vercel.ps1` which will:

- Initialize git (if needed), commit current files
- Create a GitHub repo using `gh` and push the code
- Run `vercel` to deploy the project and link the repository

Run it like this from the project root (PowerShell):

```powershell
\deploy-scripts\push-to-github-and-vercel.ps1
```

The script is interactive and will prompt for the GitHub repo name and whether to make it private, and will require you to be already logged in with `gh` and `vercel`.

Manual alternative

- Create a new repo on GitHub, add it as `origin`, and push:

```powershell
git init
git add -A
git commit -m "Initial commit"
gh repo create <repo-name> --public --source=. --remote=origin --push
```

- Deploy with Vercel:

```powershell
vercel --prod
vercel env add ADMIN_TOKEN production
```

Notes

- `server.js` exports the Express app for Vercel and uses a small `netlify/functions/server.js` wrapper for Netlify functions (already added).
- On serverless hosts the filesystem is ephemeral — submissions are written to a JSON file only for demo/testing.
