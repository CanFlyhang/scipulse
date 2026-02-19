# 快速开始

## 环境要求
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

## 后端启动
1. 进入 backend 目录
   ```bash
   cd backend
   ```
2. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```
3. 配置环境变量
   复制 `.env.example` 为 `.env` 并修改数据库配置。
4. 启动服务
   ```bash
   uvicorn app.main:app --reload
   ```
   API 文档地址: http://localhost:8000/docs

## 前端启动
1. 进入 frontend 目录
   ```bash
   cd frontend
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 启动开发服务器
   ```bash
   npm run dev
   ```
   访问地址: http://localhost:5173

## 定时任务（每日推送）
你可以通过以下命令手动触发每日论文抓取与邮件推送：

```bash
cd backend
python scripts/run_daily_digest.py
```

该脚本会：
1. 查找所有开启订阅的用户。
2. 根据用户的关键词（默认 cs.AI）从 arXiv 抓取最新论文。
3. 使用 LLM 生成摘要（如未配置 API Key，则使用 Mock 数据）。
4. 发送邮件给用户（如未配置 SMTP，则仅打印日志）。

建议将此脚本加入系统的 crontab 或 Windows 任务计划程序中，实现每日定时执行。
