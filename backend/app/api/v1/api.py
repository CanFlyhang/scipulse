from fastapi import APIRouter  # 导入 APIRouter，用于组合各个子路由
from app.api.v1.endpoints import users, auth, admin_email  # 导入用户、认证与邮箱配置相关路由模块

api_router = APIRouter()  # 创建统一的 API 路由对象
api_router.include_router(auth.router, tags=["login"])  # 注册认证相关路由到主路由中
api_router.include_router(users.router, prefix="/users", tags=["users"])  # 注册用户相关路由，并设置统一前缀
api_router.include_router(admin_email.router, tags=["admin"])  # 注册管理端邮箱配置路由
