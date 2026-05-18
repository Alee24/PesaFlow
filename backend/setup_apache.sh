#!/bin/bash

# Configuration
DOMAIN="mpesaconnect.co.ke"
API_PORT=2365
WEB_PORT=3652
APACHE_CONF="/etc/apache2/sites-available/mpesaconnect.conf"

echo "🌐 Updating Apache Configuration for ${DOMAIN}..."

# Create Apache Config
cat > mpesaconnect.conf <<EOL
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    
    # SSL Configuration (assuming Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${DOMAIN}/privkey.pem

    # Proxy Configuration
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy API requests to Backend
    ProxyPass /api/ http://localhost:${API_PORT}/
    ProxyPassReverse /api/ http://localhost:${API_PORT}/

    # Proxy all other requests to Frontend
    ProxyPass / http://localhost:${WEB_PORT}/
    ProxyPassReverse / http://localhost:${WEB_PORT}/
    
    # WebSocket Support for Next.js (if needed)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:${WEB_PORT}/\$1 [P,L]

    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}-error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}-access.log combined
</VirtualHost>
EOL

echo "📋 New Apache Config generated as mpesaconnect.conf"

# Apply Configuration
echo "⚙️  Applying configuration..."
sudo cp mpesaconnect.conf $APACHE_CONF
sudo a2enmod proxy proxy_http ssl rewrite proxy_wstunnel
sudo a2ensite mpesaconnect.conf

echo "🧪 Testing Apache Config..."
if sudo apache2ctl configtest; then
    echo "✅ Config Syntax OK. Restarting Apache..."
    sudo systemctl restart apache2
    echo "🎉 Apache configured successfully! Visit https://${DOMAIN}"
else
    echo "❌ Apache Config Test Failed! Check mpesaconnect.conf for errors."
    exit 1
fi
