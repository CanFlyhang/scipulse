from fastapi import FastAPI  # 导入 FastAPI 类用于创建应用实例
from fastapi.middleware.cors import CORSMiddleware  # 导入 CORS 中间件以支持跨域访问
import asyncio  # 导入 asyncio 库以便创建异步后台任务
import contextlib  # 导入 contextlib 以便在取消任务时优雅捕获异常
from scripts.run_daily_digest import run_digest  # 导入每日科研摘要投递脚本的入口函数，用作定时任务的执行目标


app = FastAPI(  # 创建 FastAPI 应用实例
    title="科研信息聚合平台 API",  # 设置应用标题
    description="全学科通用的开源智能科研信息聚合与分发平台 API",  # 设置应用描述
    version="1.0.0",  # 设置应用版本号
)  # 结束 FastAPI 实例创建


origins = [  # 定义允许跨域访问的前端来源列表
    "http://localhost",  # 允许本机默认端口访问
    "http://localhost:3000",  # 允许典型 React 开发端口访问
    "http://localhost:8000",  # 允许后端同端口访问
    "http://localhost:5173",  # 允许当前前端 Vite 开发端口访问
]  # 结束 CORS 白名单列表定义


app.add_middleware(  # 为应用添加 CORS 中间件
    CORSMiddleware,  # 指定中间件类
    allow_origins=origins,  # 配置允许访问的来源列表
    allow_credentials=True,  # 允许携带凭证信息
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有请求头
)  # 结束中间件配置


async def _digest_scheduler_loop():  # 定义内部异步函数，用于在后台循环触发每日科研摘要任务
    """
    后台循环任务：每隔固定时间调用一次 run_digest 函数
    """
    while True:  # 使用无限循环以便持续运行调度逻辑
        try:  # 使用 try 块捕获任务执行过程中的所有异常
            await asyncio.to_thread(run_digest)  # 在后台线程中调用同步的 run_digest 函数，避免阻塞事件循环
        except Exception as exc:  # 捕获任意异常对象
            print(f"[scheduler] run_digest error: {exc}")  # 在控制台打印调度任务执行异常，便于运维排查
        await asyncio.sleep(60)  # 休眠 60 秒后再次触发下一轮任务调度


@app.on_event("startup")
async def start_scheduler():  # 定义应用启动事件处理函数，用于启动简单定时任务调度循环
    """
    在应用启动时创建并启动每日科研摘要后台调度任务
    """
    if getattr(app.state, "digest_task", None) is None:  # 如果当前应用状态中尚未记录调度任务
        app.state.digest_task = asyncio.create_task(_digest_scheduler_loop())  # 创建后台调度任务并存入应用状态


@app.on_event("shutdown")
async def stop_scheduler():  # 定义应用关闭事件处理函数，用于优雅取消后台调度任务
    """
    在应用关闭时取消每日科研摘要后台调度任务
    """
    task = getattr(app.state, "digest_task", None)  # 从应用状态中读取调度任务引用
    if task is not None:  # 如果确实存在调度任务
        task.cancel()  # 向任务发送取消请求
        with contextlib.suppress(asyncio.CancelledError):  # 在捕获任务取消异常时静默处理
            await task  # 等待任务退出以确保资源被正确清理


@app.get("/")
async def root():  # 定义根路由处理函数，用于健康检查
    """
    根路由，用于健康检查
    """
    return {  # 返回包含欢迎信息的简单 JSON 响应
        "message": "Welcome to Scientific Research Aggregation Platform API"  # 健康检查响应消息
    }  # 结束根路由响应字典


from app.api.v1.api import api_router  # 导入统一 API 路由对象
from app.db.session import engine  # 导入数据库引擎以便创建表
from app.db.base import Base  # 导入 Base 元数据对象

Base.metadata.create_all(bind=engine)  # 在应用启动时根据模型元数据创建数据库表

app.include_router(api_router, prefix="/api/v1")  # 将版本化 API 路由挂载到应用并设置统一前缀
