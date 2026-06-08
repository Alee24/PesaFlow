#!/bin/bash

# Define variables
DOMAIN="mpesaconnect.co.ke"
FRONTEND_PORT="11398"
BACKEND_PORT="11399"

# 1. Disable existing site and delete configurations
echo "Disabling existing Apache configurations for $DOMAIN..."
a2dissite ${DOMAIN}.conf
a2dissite ${DOMAIN}-le-ssl.conf
systemctl reload apache2

echo "Deleting old Apache configuration files..."
rm -f /etc/apache2/sites-available/${DOMAIN}.conf
rm -f /etc/apache2/sites-available/${DOMAIN}-le-ssl.conf
rm -f /etc/apache2/sites-enabled/${DOMAIN}.conf
rm -f /etc/apache2/sites-enabled/${DOMAIN}-le-ssl.conf

# 2. Rebuild the Apache Configuration (HTTP - redirects to HTTPS)
echo "Generating new HTTP Apache configuration..."
cat <<EOF > /etc/apache2/sites-available/${DOMAIN}.conf
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    
    # Redirect all HTTP traffic to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>
EOF

# 3. Generate new SSL Configuration (HTTPS Proxy to Docker ports)
echo "Generating new HTTPS Apache configuration..."
cat <<EOF > /etc/apache2/sites-available/${DOMAIN}-le-ssl.conf
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}

    # SSL Configuration (assuming Let's Encrypt certificates are at default locations)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${DOMAIN}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    # Proxy to Frontend Docker Container
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:${FRONTEND_PORT}/
    ProxyPassReverse / http://127.0.0.1:${FRONTEND_PORT}/

    # Proxy API Requests to Backend Docker Container
    ProxyPass /api http://127.0.0.1:${BACKEND_PORT}/api
    ProxyPassReverse /api http://127.0.0.1:${BACKEND_PORT}/api

    # Logging
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_access.log combined
</VirtualHost>
</IfModule>
EOF

# 4. Enable necessary Apache modules for proxying
echo "Enabling necessary Apache proxy modules..."
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod ssl

# 5. Enable the new sites and reload Apache
echo "Enabling new Apache configurations..."
a2ensite ${DOMAIN}.conf
a2ensite ${DOMAIN}-le-ssl.conf

echo "Testing Apache configuration..."
apache2ctl configtest

echo "Reloading Apache to apply changes..."
systemctl restart apache2

echo "Apache has been successfully reconfigured to proxy to Frontend ($FRONTEND_PORT) and Backend ($BACKEND_PORT)."
