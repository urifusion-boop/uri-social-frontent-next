# URI Social Frontend Next - Azure Static Web Apps Deployment Guide

## Overview
This document describes the Azure Static Web Apps deployment setup for the URI Social Frontend (Next.js 16).

## Architecture

### Application Details
- **Framework**: Next.js 16 (App Router)
- **React Version**: 19.2.4
- **Build Tool**: Next.js built-in
- **Output**: Static export (.next directory)
- **Node Version**: 20.x

### Azure Static Web Apps
- **Development**: Deploys from `develop` branch
- **Production**: Deploys from `main` branch

## Deployment Workflows

### Development (Staging)
**Branch**: `develop`
**Workflow**: `.github/workflows/azure-static-web-apps-dev.yml`
**Trigger**: Push to `develop` branch or PR to `develop`

**Configuration**:
- App Location: `/` (root directory)
- API Location: `` (none - serverless backend)
- Output Location: `.next` (Next.js build output)
- Node Version: 20.x

**Environment Variables**:
- `NEXT_PUBLIC_URI_API_BASE_URL` - Backend API URL (e.g., `http://20.164.0.168:9003`)

### Production
**Branch**: `main`
**Workflow**: `.github/workflows/azure-static-web-apps-prod.yml`
**Trigger**: Push to `main` branch or PR to `main`

**Configuration**: Same as development but uses production secrets

## Required GitHub Secrets

### Azure Static Web Apps Tokens
These tokens are generated when you create an Azure Static Web App resource:

#### Development
- `AZURE_STATIC_WEB_APPS_API_TOKEN_SOCIAL_DEV` - Azure deployment token for dev environment

#### Production
- `AZURE_STATIC_WEB_APPS_API_TOKEN_SOCIAL_PROD` - Azure deployment token for prod environment

### Application Environment Variables

#### Development
- `NEXT_PUBLIC_URI_API_BASE_URL_DEV` - Development backend API URL
  - Example: `http://20.164.0.168:9003` (staging VM)
  - Or: `https://dev-api.uricreative.com` (if using domain)

#### Production
- `NEXT_PUBLIC_URI_API_BASE_URL_PROD` - Production backend API URL
  - Example: `https://api.uricreative.com`

## Azure Static Web App Setup

### Step 1: Create Azure Static Web App Resources

#### For Development Environment:
```bash
# Via Azure Portal
1. Go to Azure Portal → Static Web Apps
2. Click "Create"
3. Configuration:
   - Name: uri-social-frontend-dev
   - Region: (Choose closest to your users)
   - Deployment source: GitHub
   - Repository: urifusion-boop/uri-social-frontent-next
   - Branch: develop
   - Build presets: Next.js
   - App location: /
   - Output location: .next
4. Copy the deployment token for GitHub secrets
```

#### For Production Environment:
```bash
# Same steps but with:
   - Name: uri-social-frontend-prod
   - Branch: main
```

### Step 2: Configure GitHub Secrets

Go to GitHub repository settings → Secrets and variables → Actions:

```
AZURE_STATIC_WEB_APPS_API_TOKEN_SOCIAL_DEV=<token-from-azure-dev>
AZURE_STATIC_WEB_APPS_API_TOKEN_SOCIAL_PROD=<token-from-azure-prod>
NEXT_PUBLIC_URI_API_BASE_URL_DEV=http://20.164.0.168:9003
NEXT_PUBLIC_URI_API_BASE_URL_PROD=https://api.uricreative.com
```

### Step 3: Update Next.js Configuration

The frontend needs to be configured to use the environment variable:

**Create/Update `.env.local` (for local development)**:
```bash
NEXT_PUBLIC_URI_API_BASE_URL=http://localhost:9003
```

**Access in code**:
```typescript
// In your API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_URI_API_BASE_URL || 'http://localhost:9003';
```

### Step 4: Configure API Integration

**Example API client setup** (create `lib/api.ts` or similar):

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_URI_API_BASE_URL || 'http://localhost:9003';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Deployment Process

### Automatic Deployment

1. **Push to develop branch**:
   ```bash
   git push origin develop
   ```
   - Triggers build on GitHub Actions
   - Deploys to Azure Static Web App (dev environment)
   - Available at: `https://[your-app-name].azurestaticapps.net`

2. **Push to main branch**:
   ```bash
   git push origin main
   ```
   - Triggers build on GitHub Actions
   - Deploys to Azure Static Web App (production)
   - Available at: `https://[your-prod-app-name].azurestaticapps.net`

### Manual Deployment (if needed)

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Build the app
npm run build

# Deploy manually
swa deploy --deployment-token <your-token>
```

## Environment-Specific Configurations

### Development
- **API URL**: `http://20.164.0.168:9003` (staging VM)
- **Features**:
  - Debug mode enabled
  - Verbose error messages
  - Development tools enabled

### Production
- **API URL**: `https://api.uricreative.com` (production domain)
- **Features**:
  - Optimized builds
  - Error tracking (Sentry)
  - Analytics enabled
  - Performance monitoring

## Custom Domains

### Configure Custom Domain for Production

1. Go to Azure Portal → Your Static Web App → Custom domains
2. Add custom domain: `app.uricreative.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: [your-static-web-app-url].azurestaticapps.net
   ```
4. Wait for DNS propagation (5-10 minutes)
5. Azure will auto-provision SSL certificate

### Configure Custom Domain for Development

Follow same steps with subdomain: `dev-app.uricreative.com`

## Monitoring and Logs

### View Deployment Logs
1. GitHub Actions tab → Select workflow run
2. View build and deploy logs
3. Check for errors or warnings

### View Application Logs
1. Azure Portal → Your Static Web App → Logs
2. Application Insights (if configured)
3. Console logs in browser DevTools

## Troubleshooting

### Build Failures

**Issue**: Build fails with module not found
```bash
# Solution: Clear cache and rebuild
npm ci
npm run build
```

**Issue**: Environment variables not available
```bash
# Verify secrets are set in GitHub
# Ensure variable names match exactly (NEXT_PUBLIC_ prefix required for client-side)
```

### Deployment Failures

**Issue**: Azure token expired
```bash
# Regenerate token in Azure Portal
# Update GitHub secret
```

**Issue**: API calls failing
```bash
# Check CORS configuration on backend
# Verify API URL is correct
# Check network connectivity
```

### Runtime Issues

**Issue**: API returns 401 Unauthorized
```bash
# Check JWT token configuration
# Verify token is being sent in Authorization header
# Check token expiration
```

**Issue**: CORS errors
```bash
# Backend must allow frontend domain in CORS:
# Development: https://[dev-app].azurestaticapps.net
# Production: https://app.uricreative.com
```

## Next Steps

1. **Create Azure Static Web App resources** for dev and prod
2. **Copy deployment tokens** to GitHub secrets
3. **Configure environment variables** in GitHub secrets
4. **Update API client** in frontend code to use env variables
5. **Test deployment** by pushing to develop branch
6. **Configure custom domains** (optional)
7. **Set up monitoring** with Application Insights (optional)

## Backend CORS Configuration

The uri-social-backend needs to allow requests from the Azure Static Web App domains:

**Add to backend `.env`**:
```bash
# For development
ALLOWED_ORIGINS=https://[your-dev-app].azurestaticapps.net,http://localhost:3000

# For production
ALLOWED_ORIGINS=https://app.uricreative.com,https://[your-prod-app].azurestaticapps.net
```

**Update FastAPI CORS middleware** in `app/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Support

For issues or questions, contact the DevOps team or refer to:
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
