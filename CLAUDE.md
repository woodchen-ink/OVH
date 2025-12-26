# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

OVH 服务器抢购系统 - 一个用于监控和自动抢购 OVH 服务器的全栈应用。基于 Python Flask 后端 + React TypeScript 前端的架构。

## 技术栈

**前端:**
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS (赛博朋克风格主题)
- Shadcn/ui 组件库
- React Router 路由
- Axios HTTP 客户端
- Sonner Toast 通知
- Framer Motion 动画

**后端:**
- Python Flask
- OVH Python SDK (v1.0.0)
- Flask-CORS
- python-dotenv

**部署:**
- Docker + Docker Compose
- Nginx 反向代理

## 常用命令

### 开发环境

**启动完整开发环境 (前后端):**
```bash
./start.sh
```
此脚本会:
- 在端口 19998 启动后端服务
- 在端口 19999 启动前端开发服务器
- 自动清理端口并创建 Python 虚拟环境

**仅前端开发:**
```bash
npm install           # 安装依赖
npm run dev           # 启动开发服务器 (http://localhost:19999)
npm run build         # 生产构建
npm run build:dev     # 开发模式构建
npm run lint          # 运行 ESLint
npm run preview       # 预览生产构建
```

**仅后端开发:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py             # 启动后端服务 (http://localhost:19998)
```

### Docker 部署

**使用 Docker Compose:**
```bash
docker-compose up -d --build    # 构建并启动容器
docker-compose down             # 停止并移除容器
docker-compose logs -f          # 查看日志
```

**使用预构建镜像:**
```bash
# 镜像: iniwex/ovh:latest
# 容器内端口: 80 (Nginx)
# 暴露端口: 20000
```

## 项目架构

### 后端架构 (backend/)

**核心文件:**
- `app.py` - Flask 主应用,包含所有 API 路由和业务逻辑 (~4600行,单体文件)
- `server_monitor.py` - 服务器监控器,负责可用性检测和自动抢购 (~2400行)
- `ovh_api_helper.py` - OVH API 辅助工具,提供全局多账户管理
- `api_auth_middleware.py` - API 密钥认证中间件
- `api_key_config.py` - API 密钥配置
- `telegram_utils.py` - Telegram 通知工具

**数据存储:**
- `data/` - JSON 数据文件 (账户、队列、历史记录等)
- `cache/` - 缓存文件 (可用性查询缓存)
- `logs/` - 应用日志 (app.log, queue.log, monitor.log)

**API 认证机制:**
- 后端使用 `X-API-Key` 请求头验证
- 环境变量 `API_SECRET_KEY` 设置访问密钥
- `ENABLE_API_KEY_AUTH` 控制是否启用密钥验证

**多账户支持:**
- 支持配置多个 OVH 账户
- 使用 `X-OVH-Account` 请求头指定当前账户
- 账户信息存储在 `data/accounts.json`
- 每个账户独立配置 Application Key, Secret, Consumer Key

### 前端架构 (src/)

**目录结构:**
```
src/
├── components/       # React 组件
│   ├── ui/          # Shadcn/ui 基础组件
│   ├── Layout.tsx   # 主布局组件
│   └── PasswordGate.tsx  # 密码门禁
├── pages/           # 页面组件 (14个主要页面)
│   ├── Dashboard.tsx              # 仪表盘
│   ├── ServersPage.tsx            # 服务器列表
│   ├── QueuePage.tsx              # 抢购队列
│   ├── OVHAvailabilityPage.tsx   # 可用性查询
│   ├── MonitorPage.tsx            # 监控状态
│   ├── ServerControlPage.tsx      # 服务器控制
│   ├── AccountManagementPage.tsx  # 账户管理
│   └── SettingsPage.tsx           # 系统设置
├── context/         # React Context
│   └── APIContext.tsx  # API 上下文 (多账户管理)
├── utils/           # 工具函数
│   └── apiClient.ts    # Axios 实例和拦截器
├── hooks/           # 自定义 Hooks
├── lib/             # 库文件
│   └── utils.ts        # cn() 工具函数
├── config/          # 配置文件
└── App.tsx          # 主应用组件
```

**API 调用架构:**
1. `apiClient.ts` 创建统一的 Axios 实例
2. 请求拦截器自动添加:
   - `X-API-Key`: API 密钥 (从 localStorage)
   - `X-OVH-Account`: 当前账户 ID (从 localStorage)
   - `X-Request-Time`: 请求时间戳
3. 响应拦截器处理错误 (401/403/404/500)
4. `APIContext.tsx` 管理全局 API 状态和多账户切换

**状态管理:**
- React Context (`APIContext`) 管理 OVH 账户状态
- TanStack Query (`QueryClient`) 处理数据获取和缓存
- localStorage 存储:
  - `api_secret_key` - API 密钥
  - `current_account_id` - 当前账户 ID

### Nginx 配置

**反向代理规则:**
- `/api/*` → 后端 Flask (127.0.0.1:19998)
- `/` → 前端静态文件 (/usr/share/nginx/html)
- SPA fallback: 所有请求返回 index.html

### 环境变量

**后端 (.env):**
```
API_SECRET_KEY=     # 后端 API 访问密钥 (必须)
PORT=19998          # 后端端口
DEBUG=false         # 调试模式
ENABLE_API_KEY_AUTH=true  # 启用 API 密钥验证
```

**前端 (构建时):**
```
VITE_API_URL=/api         # API 基础路径
VITE_BUILD_CHANNEL=beta   # 构建渠道 (Docker)
```

## 核心功能模块

### 1. 服务器监控 (ServerMonitor)

**职责:**
- 定期检测 OVH 服务器可用性
- 维护监控订阅列表 (`data/subscriptions.json`)
- 触发 Telegram 通知
- 自动抢购 (auto_order)

**运行机制:**
- 后台线程定期扫描 (默认 60 秒)
- 缓存查询结果减少 API 调用
- 记录历史状态变化

### 2. 抢购队列 (Queue Processor)

**职责:**
- 处理抢购任务队列 (`data/queue.json`)
- 自动重试失败任务
- 记录抢购历史 (`data/history.json`)

**状态机:**
- `pending` → `processing` → `completed`/`failed`
- 支持暂停/恢复队列
- 可配置重试次数和间隔

### 3. 多账户管理

**架构:**
- `ovh_api_helper.py` 提供全局 OVH 客户端池
- 每个请求通过 `X-OVH-Account` 头选择账户
- 前端通过 `APIContext` 切换当前账户
- 独立验证每个账户状态

### 4. 赛博朋克主题系统

**设计规范:**
- 主色调: `#0f1a2c` (背景), `#00b3fe` (强调色)
- 霓虹效果: `shadow-neon`, `shadow-neon-lg`
- 动画: `animate-pulse-glow`, `animate-scanning`
- 字体: Orbitron (英文), ZCOOL QingKe HuangYou (中文)

**Tailwind 扩展:**
- `colors.cyber.*` - 自定义颜色
- `boxShadow.neon*` - 霓虹阴影
- `keyframes.*` - 自定义动画

## 数据持久化

**文件格式 (JSON):**
- `data/accounts.json` - OVH 账户配置
- `data/queue.json` - 抢购队列
- `data/history.json` - 抢购历史
- `data/subscriptions.json` - 监控订阅
- `data/settings.json` - 系统设置 (旧版兼容)
- `cache/*.json` - API 查询缓存

**注意事项:**
- 所有数据文件在容器重启后保留 (通过 volume 挂载)
- 后端在启动时自动创建必要目录
- 缓存文件定期清理避免磁盘占用

## 开发注意事项

### API 密钥管理
- 前后端必须配置相同的 `API_SECRET_KEY`
- 首次访问需在设置页面配置密钥
- 开发环境可通过 `ENABLE_API_KEY_AUTH=false` 禁用验证

### 错误处理策略
- 404 错误静默处理 (功能不可用标志)
- 401 错误不显示 Toast (首次访问正常情况)
- 400/500 区分"功能不支持"错误

### 构建和部署
- Docker 镜像使用多阶段构建
- 前端构建产物复制到 Nginx 静态目录
- 后端通过 `/start.sh` 启动 Flask + Nginx

### 日志查看
- 后端日志: `backend/logs/app.log` (Docker: `/app/backend/logs/`)
- 启动日志: `backend/backend.log` (仅 start.sh)
- Nginx 日志: Docker 容器标准输出

### 时区设置
- 容器时区: `Asia/Shanghai` (中国时区)
- 日志时间戳使用北京时间
- 定时任务基于北京时区

## 常见问题

### 端口冲突
运行 `./start.sh` 会自动清理 19998 和 19999 端口,使用 `lsof` (macOS/Linux) 或 `fuser` (Linux)。

### API 调用失败
1. 检查 `API_SECRET_KEY` 是否配置
2. 确认后端服务正在运行
3. 查看浏览器控制台 Network 标签
4. 检查 `backend/logs/app.log`

### 前端构建失败
确保 Node.js 18+ 和正确的依赖版本,运行 `npm ci` 清理安装。

### Docker 容器无法启动
1. 检查 `docker-compose.yml` 中的环境变量
2. 确认 `./data`, `./logs`, `./cache` 目录权限
3. 查看容器日志: `docker-compose logs`

## 版本信息

- 当前版本: v2.0.5 (定义在 `backend/app.py`)
- 前端版本: 从 `package.json` 读取
- 构建渠道: 通过 `VITE_BUILD_CHANNEL` 环境变量设置
