# Nginx Configuration for StripeViz

This document provides the Nginx configuration for deploying StripeViz backend on EC2.

## Prerequisites

- Ubuntu/Debian server with Nginx installed
- Certbot installed for SSL certificates
- PM2 installed for Node.js process management
- Domain DNS configured (stripeviz.kartikdev.me → EC2 IP)

## Nginx Configuration

Create/update the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/stripeviz
```

### Configuration File

```nginx
# StripeViz API Server Configuration
# Domain: api.stripeviz.kartikdev.me

# Rate limiting zone (optional - recommended for production)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# CORS origin mapping - supports multiple origins
map $http_origin $cors_origin {
    default "";
    "https://stripeviz.kartikdev.me" $http_origin;
    "https://stripe-viz-app.vercel.app" $http_origin;
    "https://api.stripeviz.kartikdev.me" $http_origin;
}

server {
    listen 80;
    server_name api.stripeviz.kartikdev.me stripeviz.kartikdev.me;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.stripeviz.kartikdev.me;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.stripeviz.kartikdev.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.stripeviz.kartikdev.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/stripeviz.access.log;
    error_log /var/log/nginx/stripeviz.error.log;
    
    # Client body size limit (for file uploads if needed)
    client_max_body_size 10M;
    
    # Proxy configuration
    location / {
        # ============== CORS PREFLIGHT HANDLING ==============
        # Handle OPTIONS requests at nginx level for CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-CSRF-Token, X-Request-ID' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Add CORS headers to all responses
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset' always;
        # ============== END CORS HANDLING ==============
        
        # Rate limiting (optional)
        limit_req zone=api_limit burst=20 nodelay;
        
        # Proxy to Node.js backend
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Forward important headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Don't buffer responses
        proxy_buffering off;
        
        # Cache bypass for API
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint (bypasses rate limiting)
    location /api/ping {
        # Handle CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 204;
        }
        
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Stripe webhook endpoint (bypasses rate limiting)
    location /api/stripe/webhook {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Stripe sends raw body, don't modify
        proxy_set_header Content-Type $content_type;
        proxy_pass_request_body on;
    }
    
    # Paddle webhook endpoint
    location /api/webhooks/paddle {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Setup Commands

### 1. Enable the site configuration

```bash
sudo ln -s /etc/nginx/sites-available/stripeviz /etc/nginx/sites-enabled/
```

### 2. Test Nginx configuration

```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3. Obtain SSL Certificate with Certbot

```bash
# Install certbot if not installed
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.stripeviz.kartikdev.me
```

### 4. Reload Nginx

```bash
sudo systemctl reload nginx
```

### 5. Start/Restart the Node.js application

```bash
# Using PM2
pm2 restart stripeviz

# Or start fresh
pm2 start npm --name "stripeviz" -- start
```

### 6. Verify deployment

```bash
# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status

# Test the API
curl https://api.stripeviz.kartikdev.me/api/ping
```

## Environment Variables (EC2 Backend)

Ensure these environment variables are set in your `.env` file on the EC2 instance:

```env
# Application URLs
NODE_ENV=production
APP_URL=https://api.stripeviz.kartikdev.me
FRONTEND_URL=https://stripeviz.kartikdev.me

# OAuth Redirect URIs (production)
GOOGLE_REDIRECT_URI=https://api.stripeviz.kartikdev.me/api/auth/google/callback
GITHUB_REDIRECT_URI=https://api.stripeviz.kartikdev.me/api/auth/github/callback

# CRITICAL: When running behind Nginx that handles CORS, set this to true
# This prevents duplicate CORS headers which cause browser errors
BEHIND_REVERSE_PROXY=true
```

## Troubleshooting

### CORS Issues (IMPORTANT!)

**CRITICAL: Duplicate CORS Headers Error**

If you see errors like:
- "Access-Control-Allow-Origin header contains multiple values"
- "net::ERR_FAILED" with 200 OK status

This means BOTH Nginx AND Express are setting CORS headers. **Fix:**

1. Add this to your `.env` on EC2:
   ```env
   BEHIND_REVERSE_PROXY=true
   ```

2. Restart the Node.js app:
   ```bash
   pm2 restart stripeviz
   ```

This tells Express to skip CORS handling since Nginx handles it.

If you see CORS errors like "Response to preflight request doesn't pass access control check", you need to update nginx with the CORS configuration above and reload:

```bash
# 1. Edit nginx config
sudo nano /etc/nginx/sites-available/stripeviz

# 2. Copy the updated configuration from this file (includes CORS handling)

# 3. Test configuration
sudo nginx -t

# 4. Reload nginx
sudo systemctl reload nginx
```

**Quick CORS Fix** - Run these commands on your EC2 server to apply the CORS configuration immediately:

```bash
# SSH into your EC2 instance, then:
cd /etc/nginx/sites-available

# Backup current config
sudo cp stripeviz stripeviz.backup

# Edit and paste the new config from this file
sudo nano stripeviz

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/stripeviz.error.log
sudo tail -f /var/log/nginx/stripeviz.access.log
```

### Check Node.js logs
```bash
pm2 logs stripeviz
```

### Certificate renewal (automated by Certbot)
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal
```

### Common issues

1. **CORS Error (Access-Control-Allow-Origin)**: Nginx not configured to handle preflight OPTIONS requests
   ```bash
   # Update nginx config with CORS handling (see configuration above)
   sudo nano /etc/nginx/sites-available/stripeviz
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **502 Bad Gateway**: Node.js app not running on port 8080
   ```bash
   pm2 status
   pm2 restart stripeviz
   ```

3. **Connection refused**: Firewall blocking port 443
   ```bash
   sudo ufw allow 443
   sudo ufw allow 80
   ```

4. **SSL certificate issues**: Certbot not configured properly
   ```bash
   sudo certbot --nginx -d api.stripeviz.kartikdev.me
   ```
