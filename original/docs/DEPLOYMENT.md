# Deployment Instructions

This document provides detailed instructions for deploying the **Chess** project and setting up the WebSocket server.

## Prerequisites

Before you begin, ensure you have the following:

- Node.js (recommended: 20+)
- pnpm (recommended) or npm

If you are deploying the legacy static site under `original/html/`, you may also want a static web server (e.g., Apache, Nginx) to serve those files.

## Step 1: Clone the Repository

Clone the **Chess** project repository to your local machine:

```bash
git clone https://github.com/Osalotioman/Chess.git
```

Navigate to the project directory:

```bash
cd Chess
```

## Step 2: Install Dependencies

Install dependencies for the Node WebSocket server:

```bash
cd ws-server
pnpm install
```

## Step 3: Configure the Web Server

### Apache

If you are using Apache, create a virtual host configuration for the **Chess** project. Add the following configuration to your Apache configuration file (e.g., `httpd.conf` or `apache2.conf`):

```apache
<VirtualHost *:80>
    ServerName chess.local
    DocumentRoot /path/to/Chess/original/html

    <Directory /path/to/Chess/original/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/chess_error.log
    CustomLog ${APACHE_LOG_DIR}/chess_access.log combined
</VirtualHost>
```

### Nginx

If you are using Nginx, create a server block configuration for the **Chess** project. Add the following configuration to your Nginx configuration file (e.g., `nginx.conf` or `sites-available/default`):

```nginx
server {
    listen 80;
    server_name chess.local;

    root /path/to/Chess/original/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    error_log /var/log/nginx/chess_error.log;
    access_log /var/log/nginx/chess_access.log;
}
```

## Step 4: Update Hosts File

Update your hosts file to map the `chess.local` domain to `localhost`. Add the following line to your hosts file:

```plaintext
127.0.0.1   chess.local
```

## Step 5: Start the Web Server

Start your web server to serve the **Chess** project. For Apache, use the following command:

```bash
sudo service apache2 restart
```

For Nginx, use the following command:

```bash
sudo service nginx restart
```

## Step 6: Start the WebSocket Server

Navigate to the `ws-server` directory and start the Node WebSocket server:

```bash
cd ws-server
pnpm dev
```

### Docker (recommended for development)

From the repository root:

```bash
docker compose up --build
```

This starts the WebSocket server and exposes it on `ws://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/health
```

### Environment variables

The WebSocket server supports:

- `HOST` (default `0.0.0.0`)
- `PORT` (default `8080`)

Example:

```bash
HOST=0.0.0.0 PORT=5050 pnpm dev
```

## Step 7: Access the Game

Open your browser and navigate to:

```
http://chess.local
```

You should now be able to play the **Chess** game locally.

## Troubleshooting

If you encounter any issues during deployment, check the following:

- Ensure your web server is running and properly configured.
- Verify that Node.js and pnpm are installed and working correctly.
- Ensure the WebSocket server is running and listening on the expected port.
- Check the WebSocket server logs for any error messages.

For further assistance, feel free to reach out to the project maintainers.

Happy playing!
