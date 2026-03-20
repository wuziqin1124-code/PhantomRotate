# PhantomRotate

PhantomRotate 是一款基于 Clash Meta 内核的代理池轮换管理工具，支持节点管理、健康检查、负载均衡等核心功能。

## 功能特性

| 功能 | 说明 |
|------|------|
| 代理模式切换 | 支持系统代理 / 全局代理 / 规则代理三种模式 |
| 节点管理 | 支持节点的增删改查，可手动添加单个节点 |
| 订阅更新 | 支持从订阅地址自动更新节点列表 |
| 健康检查 | 自动检测节点可用性，实时显示节点延迟 |
| 轮换策略 | 内置 round-robin 负载均衡策略 |
| 规则配置 | 支持分流规则、域名/IP 规则配置 |
| 配置热加载 | 修改配置后无需重启，自动生效 |

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 后端 | Go + Gin |
| 前端 | React + Vite + TailwindCSS |
| 内核 | Clash Meta (clash-windows-amd64.exe) |
| 平台 | Windows |

## 项目架构

```
┌─────────────────────────────────┐
│     Web UI (React + Tailwind)   │
├─────────────────────────────────┤
│        REST API (Go + Gin)       │
│  - 代理模式切换                  │
│  - 节点管理 / 测速               │
│  - 订阅更新                      │
│  - 配置热加载                    │
├─────────────────────────────────┤
│    Clash Meta (内置内核)          │
└─────────────────────────────────┘
```

## 快速开始

### Windows

双击运行 `start.bat` 或直接运行 `phantomrotate.exe`。

### 从源码构建

```bash
# 构建后端和前端
.\build.sh

# 运行服务
.\phantomrotate
```

### 前置依赖

- Go 1.21+
- Node.js 18+ (用于构建前端)
- Clash Meta 内核 (已内置于 clash-bin/ 目录)

## 目录结构

```
PhantomRotate/
├── cmd/server/main.go       # 后端服务入口
├── internal/
│   ├── api/api.go          # REST API 路由处理
│   ├── clash/clash.go      # Clash 内核管理
│   ├── config/config.go    # 配置文件解析
│   ├── proxy/proxy.go      # 代理节点管理
│   └── utils/utils.go      # 工具函数
├── web/                    # 前端项目
│   └── src/
│       ├── components/     # React 组件
│       ├── lib/api.ts     # API 客户端
│       └── App.tsx        # 主应用组件
├── clash-bin/              # Clash Meta 内核
│   └── clash-windows-amd64.exe
├── config.yaml.example     # 配置文件示例
├── start.bat               # Windows 启动脚本
├── build.sh                # 构建脚本
└── README.md               # 项目文档
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/nodes | 获取所有节点 |
| POST | /api/nodes | 添加单个节点 |
| DELETE | /api/nodes/:id | 删除指定节点 |
| POST | /api/nodes/load | 从文件加载节点 |
| POST | /api/nodes/subscription | 从订阅地址加载节点 |
| GET | /api/pool | 获取节点池统计信息 |
| POST | /api/pool/healthcheck | 手动触发健康检查 |
| GET | /api/clash/proxies | 获取 Clash 代理状态 |
| PUT | /api/clash/proxies/:group/:name | 切换代理组 |
| PUT | /api/clash/config | 更新 Clash 配置 |
| POST | /api/clash/reload | 重启 Clash 内核 |

## 配置说明

配置文件位于 `~/.phantomrotate/config.yaml`，示例如下：

```yaml
# 服务地址
server_addr: :8080

# 配置目录
config_dir: ~/.phantomrotate

# Clash 内核路径
clash_bin: ./clash-bin/clash-windows-amd64.exe

# 混合代理端口
mixed_port: 1080

# 健康检查配置
health_check:
  # 检测 URL
  url: https://www.google.com
  # 检测间隔（秒）
  interval: 300
```

### 更改后端端口

修改配置文件 `~/.phantomrotate/config.yaml` 中的 `server_addr` 字段：

```yaml
server_addr: :8888
```

端口格式为 `:端口号`，例如：
- `:8080` - 使用 8080 端口
- `:3001` - 使用 3001 端口
- `:8888` - 使用 8888 端口

修改后重启服务即可生效。

## 节点格式

支持以下代理协议：

### Trojan

```
trojan://password@server:port?peer=xxx&sni=xxx#节点名称
```

### Shadowsocks

```
ss://base64@server:port#节点名称
```

### VMess

```
vmess://base64(json)
```

## 使用示例

### 添加单个节点

```bash
curl -X POST http://localhost:8080/api/nodes \
  -H "Content-Type: application/json" \
  -d '{"url":"trojan://password@server:port#节点名称"}'
```

### 加载订阅

```bash
curl -X POST http://localhost:8080/api/nodes/subscription \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/sub"}'
```

### 触发健康检查

```bash
curl -X POST http://localhost:8080/api/pool/healthcheck
```

## 界面预览

界面采用 mac 风格亮色主题设计，包含以下主要功能区：

- **顶部导航栏**：显示应用名称和版本信息
- **模式切换器**：快速切换代理模式（系统/全局/规则）
- **节点列表**：展示所有节点状态、延迟等信息
- **操作按钮**：添加节点、加载订阅、健康检查、重启 Clash

## 注意事项

1. 首次运行时会自动生成默认配置文件
2. 节点订阅功能需要确保网络连通性
3. 健康检查默认每 5 分钟执行一次
4. 修改配置后会自动热加载，无需手动重启

## License

MIT License
