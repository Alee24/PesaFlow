#!/bin/bash

# Configuration
API_PORT=4577
WEB_PORT=6877
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
# Update PORT
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

# 3. Apache Configuration
echo "🌐 Updating Apache Configuration..."
APACHE_CONF="/etc/apache2/sites-available/mpesaconnect.conf"
echo "⚠️  NOTE: Sudo access required for Apache update."

# Create temporary config file
cat > /tmp/portal_apache.conf <<EOL
<VirtualHost *:80>
    ServerName ${DOMAIN}
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName ${DOMAIN}
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${DOMAIN}/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:${WEB_PORT}/
    ProxyPassReverse / http://localhost:${WEB_PORT}/

    ProxyPass /api/ http://localhost:${API_PORT}/
    ProxyPassReverse /api/ http://localhost:${API_PORT}/
    
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

# Apply Apache Config
if [ -f "$APACHE_CONF" ]; then
    sudo cp "$APACHE_CONF" "${APACHE_CONF}.bak"
fi
sudo mv /tmp/portal_apache.conf "$APACHE_CONF"
sudo a2enmod proxy proxy_http ssl rewrite proxy_wstunnel
echo "🧪 Testing Apache Config..."
if sudo apache2ctl configtest; then
    echo "✅ Config Syntax OK. Restarting Apache..."
    sudo systemctl restart apache2
else
    echo "❌ Apache Config Test Failed! Restoring..."
    sudo mv "${APACHE_CONF}.bak" "$APACHE_CONF"
    sudo systemctl restart apache2
fi

# 4. Rebuild and Restart Services
echo "🚀 Rebuilding Frontend..."
npm install
npm run build
echo "🔄 Restarting Services with PM2..."
pm2 delete all
cd $PROJECT_ROOT/backend
pm2 start dist/main.js --name mclinic-api --env .env
cd $PROJECT_ROOT/frontend
pm2 start npm --name mclinic-web -- start -- -p ${WEB_PORT}
pm2 save

echo "🎉 Update Complete!"
echo "   - API: Port ${API_PORT}"
echo "   - Web: Port ${WEB_PORT}"
