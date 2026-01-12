#!/bin/bash

# Configuration
API_PORT=5454
WEB_PORT=5054
DOMAIN="portal.mclinic.co.ke"
API_URL="https://${DOMAIN}/api"
PROJECT_ROOT="/var/www/mpesaconnect.co.ke"

echo "🔄 Starting Configuration Update..."

# 1. Update Backend (API) Configuration
echo "⚙️  Updating Backend (.env)..."
cd $PROJECT_ROOT/backend || exit
# Backup
cp .env .env.bak
# Update PORT
sed -i "s/^PORT=.*/PORT=${API_PORT}/" .env
# If PORT doesn't exist, append it
if ! grep -q "^PORT=" .env; then
  echo "PORT=${API_PORT}" >> .env
fi
echo "✅ Backend set to Port ${API_PORT}"

# 2. Update Frontend (Web) Configuration
echo "⚙️  Updating Frontend (.env)..."
cd $PROJECT_ROOT/frontend || exit
# Backup
cp .env .env.bak
# Update PORT (Frontend usually sets port in start script, but we can try .env)
# Next.js uses PORT env var
if [ -f .env ]; then
    sed -i "s/^PORT=.*/PORT=${WEB_PORT}/" .env
    if ! grep -q "^PORT=" .env; then
        echo "PORT=${WEB_PORT}" >> .env
    fi
    
    # Update API URL
    sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${API_URL}|" .env
    if ! grep -q "^NEXT_PUBLIC_API_URL=" .env; then
        echo "NEXT_PUBLIC_API_URL=${API_URL}" >> .env
    fi
else
    echo "PORT=${WEB_PORT}" > .env
    echo "NEXT_PUBLIC_API_URL=${API_URL}" >> .env
fi
echo "✅ Frontend set to Port ${WEB_PORT} and API URL ${API_URL}"

# 3. Rebuild and Restart
echo "🚀 Rebuilding Frontend..."
npm install
npm run build

echo "🔄 Restarting Services with PM2..."
pm2 delete all
# Start API
cd $PROJECT_ROOT/backend
pm2 start dist/main.js --name mclinic-api --env .env

# Start Frontend
cd $PROJECT_ROOT/frontend
pm2 start npm --name mclinic-web -- start -- -p ${WEB_PORT}

echo "💾 Saving PM2 List..."
pm2 save

echo "🎉 Update Complete! Services running on:"
echo "   - API: Port ${API_PORT}"
echo "   - Web: Port ${WEB_PORT}"

# 4. Update Apache Configuration
echo "🌐 Updating Apache Configuration..."

APACHE_CONF="/etc/apache2/sites-available/mpesaconnect.conf" # Adjust if your conf name is different
# If not distinct conf, maybe 000-default.conf
# We will create a new config content

echo "⚠️  NOTE: Sudo access required for Apache update. You may be prompted for password."

# Create temporary config file
cat > /tmp/portal_apache.conf <<EOL
<VirtualHost *:80>
    ServerName ${DOMAIN}
    # Redirect all HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName ${DOMAIN}

    # SSL Configuration (Let's Encrypt usually manages this, check paths)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${DOMAIN}/privkey.pem

    # Proxy Frontend (Next.js)
    ProxyPreserveHost On
    ProxyPass / http://localhost:${WEB_PORT}/
    ProxyPassReverse / http://localhost:${WEB_PORT}/

    # Proxy API requests (NestJS)
    # Important: This overrides the root / for paths starting with /api/
    ProxyPass /api/ http://localhost:${API_PORT}/
    ProxyPassReverse /api/ http://localhost:${API_PORT}/
    
    # Enable WebSockets if needed
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:${WEB_PORT}/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:${WEB_PORT}/\$1 [P,L]

    ErrorLog \${APACHE_LOG_DIR}/portal-error.log
    CustomLog \${APACHE_LOG_DIR}/portal-access.log combined
</VirtualHost>
EOL

echo "📋 New Apache Config generated at /tmp/portal_apache.conf"
echo "🛠️  Applying config (requires sudo)..."

# Backup existing
if [ -f "$APACHE_CONF" ]; then
    sudo cp "$APACHE_CONF" "${APACHE_CONF}.bak"
    echo "   Backed up existing config to ${APACHE_CONF}.bak"
fi

# Move new config (Trying to detect if user has sudo sans password, or will prompt)
# Note: Creating file directly in /etc requires sudo.
sudo mv /tmp/portal_apache.conf "$APACHE_CONF"

# Enable modules just in case
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod proxy_wstunnel

# Test and Restart
echo "🧪 Testing Apache Config..."
if sudo apache2ctl configtest; then
    echo "✅ Config Syntax OK. Restarting Apache..."
    sudo systemctl restart apache2
    echo "🎉 Apache Updated & Restarted!"
else
    echo "❌ Apache Config Test Failed! restoring backup..."
    sudo mv "${APACHE_CONF}.bak" "$APACHE_CONF"
    sudo systemctl restart apache2
    echo "⚠️ Restored previous configuration."
fi

