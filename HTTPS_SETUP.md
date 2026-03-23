# Setting Up HTTPS for Backend API

## Problem
Your frontend is HTTPS (`https://brave-coast-0ea49a50f2.azurestaticapps.net`) but your backend is HTTP (`http://20.164.0.168:9003`). This causes **Mixed Content** errors where browsers block HTTP requests from HTTPS pages.

## Solution Options

### Option 1: Setup Domain + SSL (Recommended for Production)

#### Step 1: Add DNS Record
Point a subdomain to your VM IP:
```
Type: A Record
Name: api-dev (or api-staging)
Value: 20.164.0.168
TTL: 300

Result: api-dev.uricreative.com → 20.164.0.168
```

#### Step 2: Install Nginx + Let's Encrypt on VM
```bash
# SSH into VM
ssh -i ~/.ssh/uridev.pem uridev@20.164.0.168

# Install nginx
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/uri-social-backend
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api-dev.uricreative.com;

    location / {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/uri-social-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (Let's Encrypt)
sudo certbot --nginx -d api-dev.uricreative.com

# Follow prompts and choose "2: Redirect HTTP to HTTPS"
```

#### Step 3: Update Frontend Environment Variable
Update workflow file:
```yaml
env:
  NEXT_PUBLIC_URI_API_BASE_URL: https://api-dev.uricreative.com
```

---

### Option 2: Temporary Workaround (Development Only)

For local testing, you can:

1. **Run frontend with HTTP locally:**
   ```bash
   # Don't deploy to Azure, just run locally
   npm run dev
   # Access at http://localhost:3000
   ```

2. **Or disable browser security (NOT RECOMMENDED):**
   - Chrome: Launch with `--disable-web-security`
   - Only for testing!

---

### Option 3: Azure Application Gateway (Enterprise)

Use Azure Application Gateway as a reverse proxy, but this is expensive and overkill for your use case.

---

## Recommended: Option 1 (Domain + SSL)

This is the **proper production solution** that gives you:
- ✅ HTTPS encryption
- ✅ No mixed content errors
- ✅ Professional setup
- ✅ Free SSL with Let's Encrypt
- ✅ Auto-renewal of certificates

### Complete Setup Commands

```bash
# 1. SSH into VM
ssh -i ~/.ssh/uridev.pem uridev@20.164.0.168

# 2. Install nginx and certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 3. Create nginx config
sudo tee /etc/nginx/sites-available/uri-social-backend > /dev/null <<'EOF'
server {
    listen 80;
    server_name api-dev.uricreative.com;

    location / {
        proxy_pass http://localhost:9003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 4. Enable site
sudo ln -s /etc/nginx/sites-available/uri-social-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Get SSL certificate (run this AFTER DNS is configured)
sudo certbot --nginx -d api-dev.uricreative.com --non-interactive --agree-tos --email urifusion@gmail.com --redirect

# 6. Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 7. Verify setup
curl https://api-dev.uricreative.com/health
```

### Update Azure Firewall (if needed)
```bash
# Allow HTTP/HTTPS traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## After Setup

### Update Frontend Workflow
`.github/workflows/azure-static-web-apps-brave-coast-0ea49a50f.yml`:
```yaml
env:
  NODE_OPTIONS: "--max_old_space_size=4096"
  NEXT_PUBLIC_URI_API_BASE_URL: https://api-dev.uricreative.com  # Changed from HTTP to HTTPS
```

### Update Local Development
`.env.local`:
```bash
NEXT_PUBLIC_URI_API_BASE_URL=https://api-dev.uricreative.com
```

---

## Verification

After setup, test:
```bash
# Test HTTP redirect to HTTPS
curl -I http://api-dev.uricreative.com
# Should return: 301 Moved Permanently → https://

# Test HTTPS endpoint
curl https://api-dev.uricreative.com/
# Should return: {"message":"URI Agent — Social Media Manager API is running"}

# Test from browser
# Open: https://brave-coast-0ea49a50f2.azurestaticapps.net
# Open DevTools → Network tab
# API calls should go to: https://api-dev.uricreative.com
# No mixed content errors!
```

---

## Timeline

1. **Add DNS Record** (you do this): 5 minutes
2. **Wait for DNS propagation**: 5-30 minutes
3. **Run setup commands on VM**: 10 minutes
4. **Update frontend workflow**: 2 minutes
5. **Push and deploy**: 5 minutes

**Total time: ~30-60 minutes**

---

## Cost

- **Domain**: Already have uricreative.com ($0)
- **SSL Certificate**: FREE (Let's Encrypt)
- **Nginx**: FREE (open source)
- **VM**: Already have ($0 additional)

**Total additional cost: $0** 🎉

---

## Why This is Better Than HTTP

| Feature | HTTP | HTTPS |
|---------|------|-------|
| **Browser Compatibility** | ❌ Blocked by modern browsers | ✅ Works everywhere |
| **Security** | ❌ Unencrypted | ✅ Encrypted |
| **SEO** | ❌ Lower ranking | ✅ Better ranking |
| **Trust** | ❌ "Not Secure" warning | ✅ Padlock icon |
| **Mixed Content** | ❌ Causes errors | ✅ No issues |
| **Professional** | ❌ Looks amateur | ✅ Production-ready |

---

## Need Help?

The setup is straightforward, but if you encounter issues:
1. Check DNS propagation: `nslookup api-dev.uricreative.com`
2. Check nginx: `sudo nginx -t`
3. Check SSL: `sudo certbot certificates`
4. Check firewall: `sudo ufw status`
5. Check logs: `sudo tail -f /var/log/nginx/error.log`
