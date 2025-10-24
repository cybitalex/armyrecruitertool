# Reverse Proxy Setup Guide

This guide will help you set up a reverse proxy using Nginx with SSL encryption via Let's Encrypt, making your Army Recruiter Tool accessible through `https://armyrecruitertool.duckdns.org/` and compatible with NIPR computers.

## Prerequisites

Before starting, ensure:

1. **Domain Configuration**: Your DuckDNS domain `armyrecruitertool.duckdns.org` must point to your server's public IP address
   - Visit https://www.duckdns.org/
   - Update your domain to point to your server's IP
   - Verify with: `nslookup armyrecruitertool.duckdns.org`

2. **Firewall Configuration**: Open ports 80 (HTTP) and 443 (HTTPS)
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Application Running**: Your application should be running on `localhost:5001`

4. **Root Access**: You need sudo/root privileges to install and configure Nginx

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
cd /root/armyrecruitertool
sudo chmod +x setup-reverse-proxy.sh
sudo ./setup-reverse-proxy.sh
```

The script will:
- Install Nginx and Certbot
- Configure the reverse proxy
- Obtain SSL certificates from Let's Encrypt
- Set up automatic certificate renewal
- Configure security headers for NIPR compatibility

### Option 2: Manual Setup

If you prefer to set up manually:

#### 1. Install Nginx and Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

#### 2. Copy Nginx Configuration

```bash
sudo cp /root/armyrecruitertool/nginx/armyrecruitertool.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/armyrecruitertool.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

#### 3. Test Nginx Configuration

```bash
sudo nginx -t
```

#### 4. Start Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 5. Obtain SSL Certificate

```bash
sudo certbot --nginx -d armyrecruitertool.duckdns.org --agree-tos --email your-email@example.com
```

#### 6. Enable Auto-Renewal

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## NIPR Compatibility Features

The configuration includes several features to ensure compatibility with NIPR computers:

### 1. **Strong SSL/TLS Configuration**
- TLS 1.2 and 1.3 protocols (military-approved)
- Strong cipher suites compatible with DoD requirements
- FIPS-compliant encryption options

### 2. **Security Headers**
- `Strict-Transport-Security`: Forces HTTPS connections
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Enables XSS filtering

### 3. **Standard Ports**
- Uses port 443 (HTTPS) which is typically allowed through military firewalls
- Port 80 (HTTP) redirects to HTTPS

## Verification

After setup, verify the configuration:

### 1. Check Nginx Status

```bash
sudo systemctl status nginx
```

### 2. Check SSL Certificate

```bash
sudo certbot certificates
```

### 3. Test HTTPS Connection

```bash
curl -I https://armyrecruitertool.duckdns.org
```

### 4. Test from Browser

Open a web browser and navigate to:
- `http://armyrecruitertool.duckdns.org` (should redirect to HTTPS)
- `https://armyrecruitertool.duckdns.org` (should show your application)

### 5. SSL Test

Visit: https://www.ssllabs.com/ssltest/analyze.html?d=armyrecruitertool.duckdns.org

## Maintenance

### View Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/armyrecruitertool-access.log

# Error logs
sudo tail -f /var/log/nginx/armyrecruitertool-error.log
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### Renew SSL Certificate (Manual)

Certificates auto-renew, but to manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Test Certificate Renewal

```bash
sudo certbot renew --dry-run
```

### Update Configuration

After modifying `/etc/nginx/sites-available/armyrecruitertool.conf`:

```bash
sudo nginx -t              # Test configuration
sudo systemctl reload nginx # Apply changes
```

## Troubleshooting

### Issue: Cannot obtain SSL certificate

**Solutions:**
1. Verify DNS: `nslookup armyrecruitertool.duckdns.org`
2. Check firewall: Ensure ports 80 and 443 are open
3. Verify Nginx is running: `sudo systemctl status nginx`
4. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Issue: 502 Bad Gateway

**Solutions:**
1. Check if application is running: `lsof -i:5001` or `netstat -tuln | grep 5001`
2. Start your application on port 5001
3. Check Nginx error logs: `sudo tail -f /var/log/nginx/armyrecruitertool-error.log`

### Issue: Connection timeout

**Solutions:**
1. Check firewall rules: `sudo ufw status`
2. Verify ports 80 and 443 are open on your router/cloud provider
3. Check if Nginx is listening: `sudo netstat -tuln | grep -E ':(80|443)'`

### Issue: SSL certificate expired

**Solutions:**
1. Check certificate status: `sudo certbot certificates`
2. Manually renew: `sudo certbot renew --force-renewal`
3. Check renewal timer: `sudo systemctl status certbot.timer`

## Security Considerations for NIPR

When accessing from NIPR computers:

1. **Certificate Validation**: NIPR computers may use DoD PKI certificates. Let's Encrypt certificates are typically accepted, but verify with your IT security officer.

2. **Content Security**: Ensure no classified information is stored or transmitted through this application as it's on the public internet.

3. **Access Control**: Consider implementing additional authentication (CAC card authentication, IP whitelisting) if required by your security policies.

4. **Monitoring**: Regularly review access logs for suspicious activity:
   ```bash
   sudo tail -100 /var/log/nginx/armyrecruitertool-access.log
   ```

## Additional Configuration

### Increase Upload Size Limit

Edit `/etc/nginx/sites-available/armyrecruitertool.conf` and modify:

```nginx
client_max_body_size 100M;  # Change to desired size
```

Then reload: `sudo systemctl reload nginx`

### Add IP Whitelisting

To restrict access to specific IP ranges (e.g., military networks):

```nginx
location / {
    allow 192.168.1.0/24;     # Your allowed IP range
    allow 10.0.0.0/8;          # Another allowed range
    deny all;                  # Deny all others
    
    proxy_pass http://localhost:5001;
    # ... rest of proxy configuration
}
```

### Enable Rate Limiting

To prevent abuse:

```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

# Add to location block
limit_req zone=mylimit burst=20;
```

## Support

For issues specific to:
- **Nginx**: Check logs at `/var/log/nginx/`
- **SSL/Certbot**: Run `sudo certbot --help`
- **Application**: Check your application logs

## Resources

- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- DuckDNS: https://www.duckdns.org/
- SSL Labs Test: https://www.ssllabs.com/ssltest/

