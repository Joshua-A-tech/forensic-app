<#
Interactive PowerShell helper to create a GitHub repo and deploy to Vercel.

Prereqs: gh (GitHub CLI) logged in, vercel CLI logged in, git configured.
#>

Set-StrictMode -Version Latest

function Check-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$name' not found. Please install and authenticate before running this script."
        exit 1
    }
}

Check-Command gh
Check-Command vercel
Check-Command git

$root = (Get-Location).Path
Write-Host "Repository root: $root"

# Initialize git if needed
if (-not (Test-Path (Join-Path $root ".git"))) {
    Write-Host "Initializing git repository..."
    git init | Out-Null
}

# Stage and commit
git add -A
try {
    git commit -m "Initial commit" -q
} catch {
    Write-Host "No changes to commit or git user not configured — continuing."
}

$repoName = Read-Host "Enter the GitHub repository name (example: forensic-app)"
if (-not $repoName) { Write-Error "Repository name is required."; exit 1 }

$visibility = Read-Host "Make private? (y/N)"
$isPrivate = $false
if ($visibility -match '^[Yy]') { $isPrivate = $true }

Write-Host "Creating GitHub repository '$repoName'..."
$createArgs = @($repoName, "--source=.", "--remote=origin", "--push")
if ($isPrivate) { $createArgs += "--private" } else { $createArgs += "--public" }

gh repo create @createArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "gh repo create failed. Ensure you are authenticated with 'gh auth login' and try again."
    exit 1
}

Write-Host "Repository created and code pushed. Now deploying to Vercel..."

# Deploy with Vercel (links project automatically)
vercel --prod --confirm
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Vercel deployment may have failed or been interrupted. You can run 'vercel' manually to finish linking/deploying."
} else {
    Write-Host "Vercel deployment complete (or in progress)."
}

Write-Host "Reminder: add the ADMIN_TOKEN environment variable to your Vercel project."
Write-Host "Run: vercel env add ADMIN_TOKEN production"

Write-Host "Done. Visit your Vercel dashboard to confirm settings and environment variables."
