<h1 align="center">SciPulse · 学术脉动</h1>
<p align="center">面向研究生与导师的智能论文订阅平台</p>

<p align="center">
  <!-- 使用时请将下面的 <your-github-name>/<your-repo-name> 替换为真实仓库路径 -->
  <a href="https://github.com/&lt;your-github-name&gt;/&lt;your-repo-name&gt;/stargazers">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/&lt;your-github-name&gt;/&lt;your-repo-name&gt;?style=social">
  </a>
  <a href="https://github.com/&lt;your-github-name&gt;/&lt;your-repo-name&gt;/issues">
    <img alt="GitHub Issues" src="https://img.shields.io/github/issues/&lt;your-github-name&gt;/&lt;your-repo-name&gt;?color=ff9800">
  </a>
  <img alt="Backend" src="https://img.shields.io/badge/backend-FastAPI-009688">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-React-61dafb">
  <img alt="Database" src="https://img.shields.io/badge/database-MySQL%208.0-00758f">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

> 让研究生「被动等论文送上门」，让导师「一封邮件掌握领域新进展」。

SciPulse（学术脉动）是一款开源的科研信息聚合与智能推送平台，专为中国高校研究生与导师设计。  
它自动从开放学术数据源抓取最新论文，结合大模型生成结构化摘要，并按照用户设定的时间，通过邮件定时送达「科研日报」。

<p align="center">
  <!-- TODO: 将占位图片路径替换为真实的项目截图，例如 docs/screenshot-dashboard.png -->
  <img src="docs/screenshot-dashboard.png" alt="SciPulse Dashboard 示例界面" width="820">
</p>

---

## ✨ 为什么会有 SciPulse？

对于研究生：
- 导师一句「多看文献」，往往变成：
  - 每天刷 arXiv / 期刊官网，但很难系统跟踪；
  - 收藏了一堆链接，真正细看时又不知道从哪篇开始。

对于高校老师：
- 课题组方向多，学生又分散：
  - 很难时时掌握自己方向的最新论文；
  - 需要一个「每天自动扫一圈文献」的个人助理。

**SciPulse 的目标是：**  
帮你把「主动找论文」变成「被动等论文来」，每天一封高质量、结构化的科研日报。

---

## 📚 目录

- [✨ 为什么会有 SciPulse？](#-为什么会有-scipulse)
- [🔍 核心功能概览](#-核心功能概览)
- [🧱 技术栈与架构](#-技术栈与架构)
- [🚀 快速开始](#-快速开始)
- [🧪 典型使用流程](#-典型使用流程)
- [📂 项目结构](#-项目结构)
- [🗺 路线图](#-路线图)
- [🤝 如何参与共建？](#-如何参与共建)
- [📌 项目愿景](#-项目愿景)
- [📄 许可证](#-许可证)

---

## 🔍 核心功能概览

### 1. 个性化论文订阅

- 按用户配置的**研究方向 / 关键词**自动检索最新论文（当前以 arXiv 为主，可扩展其他来源）。  
- 支持：
  - 多关键词组合（如「LLM, GPT, DeepSeek」）；  
  - 学科标签（如「计算机视觉」「自然语言处理」）；  
  - 期刊/会议偏好（如「Science」「Nature」「NeurIPS」等，视数据源而定）。

### 2. AI 驱动的科研日报

- 为每篇论文生成结构化摘要，包括：
  - 题目、作者、来源；
  - 核心贡献 / 方法亮点；
  - 适合快速扫一眼的中文描述。
- 汇总生成「今日科研日报」HTML 邮件，一次性发送给用户。

### 3. 精准定时推送（支持到分钟）

- 用户可以在前台自由设定每日推送时间（如 `06:30`、`22:15`）。  
- 后端采用内置调度器，每分钟检查一次：
  - 当「当前时间 == 用户配置的 HH:MM」时，自动触发该用户的推送任务。  
- 同时保留「测试推送」按钮，方便用户一键验证邮箱配置与内容效果。

### 4. 历史推送与论文回溯

- 前端展示历史推送记录：
  - 最近 N 条折叠展示，避免列表过长；
  - 支持按日期筛选某一天的推送。
- 点击某次推送记录，可以查看当时发送的论文列表，方便追溯与整理。

### 5. 统一管理后台（面向老师 / 管理者）

- 可视化查看：
  - 总用户数、活跃订阅用户数；
  - 最近 24 小时发送的邮件数量。  
- 支持：
  - 邮件服务配置（SMTP 等）；
  - 用户订阅状态概览；
  - 研究画像覆盖情况统计（如多少用户关注 LLM、CV 等方向）。

---

## 🧱 技术栈与架构

当前实现以 **易用性与可部署性** 为优先，选型如下：

- **后端**：Python + FastAPI  
  - RESTful API  
  - JWT 鉴权  
  - 内置调度器（基于 `asyncio` 循环，每分钟调用 `run_daily_digest`）
- **前端**：React + Vite  
  - 极简 Dashboard：订阅开关、研究方向配置、推送时间设置、历史记录查看  
  - Tailwind 风格的简洁 UI
- **数据库**：MySQL 8 + SQLAlchemy ORM  
  - 用户、科研画像、论文、每日摘要、邮件配置等核心实体
- **AI 摘要**：可对接 DeepSeek 等大模型 API  
  - 若未配置 API Key，可使用 Mock 摘要，方便开发调试
- **邮件发送**：SMTP 配置化  
  - 支持从数据库读取当前可用的邮箱配置  
  - 默认模板为 HTML 格式科研日报

> 未来可以按需扩展：向量检索（如 pgvector）、多数据源（PubMed、Crossref）、任务队列（Celery/Redis）等。

---

## 🚀 快速开始

> 以下步骤适用于本地开发环境。生产环境请结合自己的部署方案（如 Docker / 云服务器）进行调整。

### 1. 环境准备

- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### 2. 启动后端 API

1. 进入后端目录：

   ```bash
   cd backend
   ```

2. 安装依赖：

   ```bash
   pip install -r requirements.txt
   ```

3. 配置环境变量：  
   复制 `.env.example` 为 `.env`，并至少配置：

   - 数据库连接（MySQL）
   - 邮件 SMTP 配置（用于发送日报）
   - LLM API Key（如使用 DeepSeek 生成摘要）

4. 初始化数据库表（首次）  
   项目启动时会自动执行 `Base.metadata.create_all(bind=engine)`，确保数据库连接正常即可。

5. 启动 FastAPI 服务：

   ```bash
   uvicorn app.main:app --reload
   ```

   - API 文档地址：http://localhost:8000/docs
   - 根路由健康检查：http://localhost:8000/

> 启动成功后，**定时推送调度器会自动在后台运行**，每分钟检查一次需要投递的用户，无需额外配置 cron。

### 3. 启动前端界面

1. 进入前端目录：

   ```bash
   cd frontend
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

   - 访问地址：http://localhost:5173

---

## 🧪 典型使用流程

1. **注册 & 登录**  
   - 使用邮箱注册账号，完成登录。

2. **配置科研画像**  
   - 在「我的科研研究方向」中：
     - 填写研究方向简述（如「大模型安全与对齐」）；
     - 添加关键词（如 `LLM`, `GPT`, `DeepSeek`）；
     - 配置学科标签与期刊偏好。

3. **开启订阅 & 设置时间**  
   - 打开订阅开关；  
   - 设置每日推送时间（例如 `06:30`）。

4. **测试推送**  
   - 点击「测试推送」按钮，确认：
     - 邮箱配置是否正确；
     - 摘要内容格式是否符合预期。

5. **等待每日自动推送**  
   - 到设定时间后，系统会自动抓取新论文并发送「科研日报」到你的邮箱；  
   - 可以在前台查看历史推送记录，并点击某次记录查看当时的论文列表。

---

## 📂 项目结构

```bash
科研MCP/
├── backend/                  # FastAPI 后端服务
│   ├── app/
│   │   ├── api/              # 路由与接口（auth、users、admin 等）
│   │   ├── core/             # 配置与安全模块
│   │   ├── db/               # 数据库会话与 Base 声明
│   │   ├── models/           # SQLAlchemy 模型（User、Paper、DailyDigest 等）
│   │   ├── schemas/          # Pydantic 模型（请求 / 响应体）
│   │   └── services/         # 邮件发送、LLM 摘要、爬虫等服务
│   ├── scripts/
│   │   └── run_daily_digest.py  # 每日推送任务脚本（由调度器调用）
│   ├── schema.sql            # MySQL 建表脚本（与模型结构对应）
│   └── requirements.txt      # 后端依赖列表
├── frontend/                 # React + Vite 前端
│   └── src/
│       ├── pages/            # Dashboard、AdminDashboard 等页面
│       └── components/       # 可复用 React 组件
└── README.md                 # 项目说明文档
```

---

## 🗺 路线图

- [ ] 支持更多论文数据源（PubMed、Crossref、中文数据库等）
- [ ] 引入向量检索，实现语义级论文推荐
- [ ] 提供 Docker 一键部署脚本
- [ ] 支持中英文双语界面与摘要
- [ ] 增加「课题组视角」的多用户协同视图

---

## 🤝 如何参与共建？

欢迎来自高校研究生、老师以及工程师朋友一起来共建 SciPulse，让更多人享受到「学术信息自动送达」的体验。

你可以从这些方向开始：

- **数据源扩展**：接入更多论文来源（如 PubMed、Crossref、中文数据库等）；  
- **筛选算法优化**：基于关键词 + 语义相似度，给出更精准的论文推荐；  
- **摘要模板与多语言**：优化摘要结构、支持中英文双语摘要；  
- **UI/UX 改进**：为研究生和导师设计更高效的科研工作台界面；  
- **部署脚本**：提供 Docker、Kubernetes 等一键部署方案。

> 建议在提交 PR 前，先通过 Issue 简要描述你的想法 / 改动范围，便于讨论与协同。

---

## 📌 项目愿景

在信息爆炸的时代，真正的稀缺资源是 **注意力** 和 **高质量筛选**。  

SciPulse 希望成为每位研究生和导师的「学术信息中枢」：

- 让刚入门的研究生不再迷失在文献海洋里；
- 让资深教授可以在繁忙事务间，用几分钟扫一遍领域新进展；
- 让更多有趣、有价值的论文，被合适的人及时看到。

如果你也认同这个愿景，欢迎 Star ⭐、使用、反馈和贡献。让学术的脉动，被更多人听见。

---

## 📄 许可证

本项目采用 MIT License 开源许可协议。  
你可以在使用、修改和分发本项目代码时，遵循 MIT 许可证的相关条款进行自由使用。
