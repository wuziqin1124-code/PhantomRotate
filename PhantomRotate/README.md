# PhantomRotate

Proxy Pool Manager with Clash Meta integration.

## Features

- **Proxy Mode Switching**: System / Global / Rule proxy modes
- **Node Management**: Add, delete, import from subscription
- **Health Check**: Automatic node availability detection
- **Round-robin Load Balancing**: Built-in load-balance strategy
- **Rule-based Routing**: Custom分流规则 support

## Tech Stack

- **Backend**: Go + Gin
- **Frontend**: React + Vite + TailwindCSS
- **Core**: Clash Meta (clash-windows-amd64.exe)

## Quick Start

### Windows

```bash
.\start.bat
```

### Build from Source

```bash
# Build backend and frontend
.\build.sh

# Run server
.\phantomrotate
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/nodes | List all nodes |
| POST | /api/nodes | Add a node |
| DELETE | /api/nodes/:id | Delete a node |
| POST | /api/nodes/subscription | Load from subscription |
| GET | /api/pool | Get pool stats |
| POST | /api/pool/healthcheck | Trigger health check |
| GET | /api/clash/proxies | Get Clash proxy status |
| PUT | /api/clash/proxies/:group/:name | Select proxy |
| POST | /api/clash/reload | Reload Clash |

## Configuration

Edit `config.yaml`:

```yaml
server_addr: :8080
config_dir: ~/.phantomrotate
clash_bin: ./clash-bin/clash-windows-amd64.exe
mixed_port: 1080

health_check:
  url: https://www.google.com
  interval: 300
```
