# GitHub Secrets Configuration

This document lists all the GitHub repository secrets needed for automated deployment.

## Required Secrets

### 1. Azure Static Web Apps Deployment Token (✅ Already Added)

**Secret Name:** `AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_COAST_0EA49A50F`

**Description:** Azure deployment token for the static web app

**How to get it:**
- Already automatically added by Azure when you created the Static Web App
- You can also find it in Azure Portal → Your Static Web App → Manage deployment token

**Status:** ✅ Already configured

---

### 2. Backend API URL - Development (Optional - Currently Hardcoded)

**Secret Name:** `NEXT_PUBLIC_URI_API_BASE_URL_DEV`

**Value:** `http://20.164.0.168:9003`

**Description:** Backend API URL for development/staging environment

**Status:**
- Currently hardcoded in workflow for simplicity
- You can optionally add this as a secret for easier management

**To add as secret:**
1. Go to GitHub repository settings
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NEXT_PUBLIC_URI_API_BASE_URL_DEV`
5. Value: `http://20.164.0.168:9003`

**If you add this secret, update the workflow:**
```yaml
env:
  NEXT_PUBLIC_URI_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_URI_API_BASE_URL_DEV }}
```

---

### 3. Backend API URL - Production (For Future Use)

**Secret Name:** `NEXT_PUBLIC_URI_API_BASE_URL_PROD`

**Value:** `https://api.uricreative.com` (or your production API domain)

**Description:** Backend API URL for production environment

**Status:** Not needed yet - only for production deployment

**To add when ready for production:**
1. Same steps as above
2. Update production workflow to use this secret

---

## Current Configuration Summary

### ✅ What's Already Working

| Secret | Status | Value | Used In |
|--------|--------|-------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_COAST_0EA49A50F` | ✅ Added | (Azure token) | Deployment workflow |
| Backend API URL | ✅ Hardcoded | `http://20.164.0.168:9003` | Deployment workflow |

### 📋 Optional Improvements

If you want to make the backend URL easier to change, add:
- `NEXT_PUBLIC_URI_API_BASE_URL_DEV` = `http://20.164.0.168:9003`

Then update `.github/workflows/azure-static-web-apps-brave-coast-0ea49a50f.yml`:

**Current (Line 42):**
```yaml
NEXT_PUBLIC_URI_API_BASE_URL: http://20.164.0.168:9003
```

**Optional Update:**
```yaml
NEXT_PUBLIC_URI_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_URI_API_BASE_URL_DEV }}
```

---

## For Production Deployment (Future)

When you create a production Azure Static Web App, you'll need:

1. **New Azure Static Web App** for production
2. **New Deployment Token Secret:**
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN_[PROD_APP_NAME]`
   - Value: (token from production Azure app)
3. **Production Backend URL:**
   - Name: `NEXT_PUBLIC_URI_API_BASE_URL_PROD`
   - Value: `https://api.uricreative.com`

---

## How to Add Secrets to GitHub

### Step-by-Step:

1. **Go to your GitHub repository:**
   - https://github.com/urifusion-boop/uri-social-frontent-next

2. **Navigate to Settings:**
   - Click "Settings" tab (top right)

3. **Go to Secrets section:**
   - In left sidebar: "Secrets and variables" → "Actions"

4. **Add new secret:**
   - Click "New repository secret"
   - Enter Name (exactly as shown above)
   - Enter Value
   - Click "Add secret"

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (already in .gitignore)
- Never share secret values in public channels
- Secrets with `NEXT_PUBLIC_` prefix are exposed to the browser
- Only use `NEXT_PUBLIC_` for values that are safe to expose (like API URLs)
- Never put sensitive keys (API keys, passwords) in `NEXT_PUBLIC_` variables

---

## Verification

To verify secrets are working:

1. **Check GitHub Actions logs:**
   - Go to Actions tab
   - Click on latest workflow run
   - Check if build succeeds
   - Look for environment variable in build logs

2. **Check deployed app:**
   - Open browser console on deployed site
   - Type: `console.log(process.env.NEXT_PUBLIC_URI_API_BASE_URL)`
   - Should show the API URL

---

## Current Status: ✅ No Action Required

The deployment is already configured and working with:
- ✅ Azure deployment token (automatically added)
- ✅ Backend API URL (hardcoded in workflow)

**You don't need to add any secrets right now unless you want to make the backend URL configurable.**
