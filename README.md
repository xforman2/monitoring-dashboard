# Grafana Server Monitoring Plugin

In modern computational environments, optimizing resource usage is crucial. This data visualization tool enhances the efficiency and effectiveness of server resource management.

## Overview

This Grafana plugin provides a comprehensive overview of server resource usage. It focuses on key metrics such as CPU, GPU, RAM, and drive usage, alongside a reservation system for servers Alfa and Beta. By visualizing these metrics, users can monitor and optimize resource allocation more effectively.

## Features

- Real-time monitoring of CPU, GPU, RAM, and drive usage.
- Reservation system for servers Alfa and Beta.
- Custom dashboards with Grafana scenes.
- Anonymous view access enabled for easier sharing.
- Configurable root URL based on the server deployment.

---

## Release & Deployment Guide

Follow these steps to release and deploy the Grafana plugin on a target server.

### 1. Prepare the Release (GitHub Actions)

A GitHub Action workflow (`Build and Release Grafana Plugin`) is already configured.  
It automatically:
- Builds the plugin (`npm run build`).
- Signs the plugin with Grafana’s signing tool. The steps to do this are explained here:  
  [Sign a Plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- Packages everything into a single archive:  
  **`grafana-plugin-release.tar.gz`**
- Publishes it as a GitHub Release.

You can also trigger it manually from the **Actions** tab.

### 2. Download the Release Artifact

On the target server, download the latest release:

```bash
wget https://github.com/xforman2/monitoring-dashboard/releases/latest/download/grafana-plugin-release.tar.gz
```

### 3. Extract Files

```bash
tar -xzf grafana-plugin-release.tar.gz
cd release
```

This creates the following structure:

```
release/
├── monitoring-plugin/
│   ├── dist/
│   └── provisioning/
├── Home.json
├── docker-compose.yaml
├── .env.example
```

### 4. Configure Environment Variables

Copy `.env.example` and adjust it to your server setup:

```bash
cp .env.example .env
vim .env
```

Fill in values such as:

```env
# The hostname or IP of the server where Grafana will be accessible
SERVER_NAME=your.server.hostname

# Database hostname or IP (e.g., localhost, db.example.com)
DB_HOST=...

# Database port (default for PostgreSQL is 5432, MySQL is 3306)
DB_PORT=...

# Database username (used by Grafana to connect)
DB_USER=...

# Database password (for the above DB_USER)
DB_PASS=...

# Database name (the schema Grafana should connect to)
DB_NAME=...
```

### 5. Start Grafana with Docker Compose

Run:

```bash
docker compose up --build -d
```

This will:
- Start Grafana Enterprise (`grafana/grafana-enterprise:10.3.1`).
- Mount the plugin under `/var/lib/grafana/plugins/xforman2-servermonitoring-scenesapp`.
- Apply provisioning configs and the `Home.json` dashboard.

### 6. Verify Deployment

Access Grafana in the browser:

```
http://<SERVER_NAME>:3000
```

You should see:
- The home dashboard (`Home.json`).
- The Server Monitoring App under **Apps**.

### 7. Updating

For updates:
1. Download the new release tarball.
2. Extract and replace files.
3. Run `docker compose up --build -d` again.

---

## Troubleshooting

- **Plugin not showing in Grafana:**  
  Make sure `dist/` is copied correctly under `/var/lib/grafana/plugins/xforman2-servermonitoring-scenesapp`.

- **Home.json still shows placeholder:**  
  Ensure the GitHub Action ran and replaced `__GRAFANA_SERVER__` with the correct server.
