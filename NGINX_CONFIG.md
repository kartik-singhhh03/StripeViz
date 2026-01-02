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
```

## Troubleshooting

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

1. **502 Bad Gateway**: Node.js app not running on port 8080
   ```bash
   pm2 status
   pm2 restart stripeviz
   ```

2. **Connection refused**: Firewall blocking port 443
   ```bash
   sudo ufw allow 443
   sudo ufw allow 80
   ```

3. **SSL certificate issues**: Certbot not configured properly
   ```bash
   sudo certbot --nginx -d api.stripeviz.kartikdev.me
   ```
