# HTTPS Setup for URI Social Backend

## ✅ HTTPS Already Configured!

The VM already has an **nginx-ssl** container handling HTTPS termination for all services. We've added URI Social Backend to this existing setup.

## Current Configuration

### Backend Access Points

| Service | HTTP Port | HTTPS Path | Container |
|---------|-----------|------------|-----------|
| URI Gateway | 8443 | `https://20.164.0.168/` | uri-gateway.api |
| Academy Backend | 8004 | `https://20.164.0.168/academy/` | academy-backend.api |
| **URI Social Backend** | 9003 | **`https://20.164.0.168/social-media/`** | uri-agent.api |

### How It Works

1. **nginx-ssl container** listens on ports 80 and 443
2. **HTTP → HTTPS redirect** automatically applied
3. **Reverse proxy** routes HTTPS traffic to backend containers:
   - `https://20.164.0.168/social-media/*` → `http://uri-agent.api:80/*`
4. **Self-signed SSL certificate** already configured at `/home/uridev/nginx-ssl/ssl/`

## Frontend Configuration

### Azure Static Web Apps (Staging)
**File:** `.github/workflows/azure-static-web-apps-brave-coast-0ea49a50f.yml`

```yaml
env:
  NEXT_PUBLIC_URI_API_BASE_URL: https://20.164.0.168/social-media
```

### Local Development
**File:** `.env.local`

```bash
NEXT_PUBLIC_URI_API_BASE_URL=http://localhost:9003
```

## Testing the Setup

```bash
# Test HTTP redirect
curl -I http://20.164.0.168/social-media/
# Should return: 301 → https://20.164.0.168/social-media/

# Test HTTPS endpoint (with self-signed cert)
curl -k https://20.164.0.168/social-media/
# Should return: {"message":"URI Agent — Social Media Manager API is running"}

# Test from VM
ssh -i ~/.ssh/uridev.pem uridev@20.164.0.168 "curl -k https://localhost/social-media/"
```

## Configuration Files

### Nginx Configuration Location
```
Host Path: /home/uridev/nginx-ssl/nginx.conf
Container Path: /etc/nginx/conf.d/default.conf
Backup: /home/uridev/nginx-ssl/nginx.conf.backup
```

### SSL Certificates
```
Host Path: /home/uridev/nginx-ssl/ssl/
Container Path: /etc/nginx/ssl/
Files: cert.pem, key.pem
```

## Impact on Other Services

✅ **No impact** on existing services:
- All services continue working as before
- Each service has its own location block
- URI Social Backend added as `/social-media/` path
- No port conflicts (each service uses unique path)

## Docker Compose Setup

The nginx-ssl container is managed via:
```
Location: /home/uridev/nginx-ssl/docker-compose.yml
```

To reload nginx configuration:
```bash
docker exec nginx-ssl nginx -t      # Test config
docker exec nginx-ssl nginx -s reload  # Reload config
```

## Self-Signed Certificate Note

The VM uses a **self-signed SSL certificate**, which means:

- ✅ **Works for development/staging**
- ✅ **Solves mixed content issues**
- ✅ **Encrypts traffic**
- ⚠️ **Browsers show "Not Secure" warning** (expected for self-signed certs)
- ⚠️ **Need to add `-k` flag with curl**

### For Production: Use Let's Encrypt

If you want a **valid SSL certificate** without browser warnings:

1. **Add DNS record:**
   ```
   Type: A Record
   Name: api
   Value: 20.164.0.168
   Result: api.uricreative.com → 20.164.0.168
   ```

2. **Update nginx-ssl configuration:**
   ```bash
   # Update server_name in nginx.conf
   server_name api.uricreative.com;  # Instead of IP
   ```

3. **Get Let's Encrypt certificate:**
   ```bash
   docker exec nginx-ssl certbot --nginx -d api.uricreative.com
   ```

4. **Update frontend:**
   ```yaml
   NEXT_PUBLIC_URI_API_BASE_URL: https://api.uricreative.com/social-media
   ```

## Summary

✅ **HTTPS is already working!**
✅ **No additional setup needed for staging**
✅ **Other containers unaffected**
✅ **Mixed content issues resolved**

The frontend can now safely call the backend via HTTPS from the Azure Static Web App.
