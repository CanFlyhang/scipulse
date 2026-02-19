from datetime import datetime, timedelta  # 导入时间工具，用于按时间统计记录
from fastapi import APIRouter, Depends  # 导入 FastAPI 路由与依赖注入工具
from sqlalchemy import func  # 导入聚合函数工具，用于统计数量
from sqlalchemy.orm import Session  # 导入数据库会话类型
from app.db.session import get_db  # 导入获取数据库会话的依赖函数
from app.models.email_config import EmailConfig  # 导入邮箱配置模型
from app.models.user import User  # 导入用户模型，用于统计平台用户
from app.models.subscription import ResearchProfile  # 导入科研订阅配置模型，用于统计研究方向覆盖
from app.models.digest import DailyDigest  # 导入每日摘要模型，用于统计发送邮件数量
from app.schemas.email_config import EmailConfigCreate, EmailConfigOut  # 导入邮箱配置相关模式类


router = APIRouter(prefix="/admin", tags=["admin"])  # 创建带有前缀的路由对象，并归类到 admin 标签


@router.get("/email-settings", response_model=EmailConfigOut | None)  # 声明获取当前邮箱配置的 GET 接口，若未配置则返回空
def get_email_settings(db: Session = Depends(get_db)):  # 定义获取邮箱配置的接口函数，并自动注入数据库会话
    config = (  # 开始查询当前启用的邮箱配置
        db.query(EmailConfig)  # 从邮箱配置表中查询
        .filter(EmailConfig.is_active == True)  # 仅筛选启用状态的配置
        .order_by(EmailConfig.created_at.desc())  # 按创建时间倒序，最新的排在最前
        .first()  # 仅取一条记录
    )  # 结束查询表达式
    if not config:  # 如果没有查到任何启用配置
        return None  # 直接返回空值，表示尚未配置邮箱设置，避免返回 404
    return config  # 返回查询到的邮箱配置对象，由 FastAPI 自动转换为响应模型


@router.post("/email-settings", response_model=EmailConfigOut)  # 声明创建或更新邮箱配置的 POST 接口
def upsert_email_settings(  # 定义创建或更新邮箱配置的接口函数
    payload: EmailConfigCreate,  # 从请求体中接收邮箱配置数据
    db: Session = Depends(get_db),  # 注入数据库会话
):  # 结束函数签名
    db.query(EmailConfig).filter(EmailConfig.is_active == True).update(  # 查询并更新当前所有启用配置
        {"is_active": False}  # 将 is_active 字段批量更新为 False
    )  # 结束 update 调用

    config = EmailConfig(  # 创建新的邮箱配置实体对象
        smtp_host=payload.smtp_host,  # 设置 SMTP 服务器地址
        smtp_port=payload.smtp_port,  # 设置 SMTP 端口号
        smtp_tls=payload.smtp_tls,  # 设置是否启用 TLS
        smtp_user=payload.smtp_user,  # 设置登录用户名
        smtp_password=payload.smtp_password,  # 设置登录密码
        from_email=payload.from_email,  # 设置发件人邮箱
        from_name=payload.from_name,  # 设置发件人名称
        is_active=True,  # 将该配置标记为当前启用配置
    )  # 结束 EmailConfig 对象创建

    db.add(config)  # 将新配置添加到当前会话中
    db.commit()  # 提交事务将更改写入数据库
    db.refresh(config)  # 刷新对象以获取数据库生成的字段（例如自增 id）
    return config  # 返回新创建的邮箱配置对象


@router.get("/overview")  # 声明管理后台总览统计接口路由
def admin_overview(db: Session = Depends(get_db)):  # 定义管理后台总览统计接口函数，并注入数据库会话
    """
    管理后台总览统计：用户数量、订阅开关与近24小时邮件发送量
    """
    total_users = db.query(func.count(User.id)).scalar() or 0  # 统计平台总用户数量
    active_users = (  # 统计处于激活状态的用户数量
        db.query(func.count(User.id))
        .filter(User.is_active == True)
        .scalar()
        or 0
    )  # 结束激活用户统计
    subscribed_users = (  # 统计开启订阅开关的用户数量
        db.query(func.count(User.id))
        .filter(User.subscription_enabled == True)
        .scalar()
        or 0
    )  # 结束订阅用户统计

    total_profiles = db.query(func.count(ResearchProfile.id)).scalar() or 0  # 统计已配置科研订阅画像的数量

    now = datetime.utcnow()  # 获取当前 UTC 时间
    since = now - timedelta(days=1)  # 计算近 24 小时时间边界
    daily_emails = (  # 统计近 24 小时内发送的摘要邮件数量
        db.query(func.count(DailyDigest.id))  # 统计每日摘要记录主键数量
        .filter(DailyDigest.sent_at >= since)  # 使用 sent_at 字段过滤近 24 小时内的记录
        .scalar()
        or 0
    )  # 结束邮件统计

    return {  # 返回汇总统计结果字典
        "total_users": total_users,  # 平台用户总数
        "active_users": active_users,  # 激活用户数量
        "subscribed_users": subscribed_users,  # 开启订阅开关的用户数量
        "total_profiles": total_profiles,  # 已配置科研订阅画像的数量
        "daily_emails": daily_emails,  # 近 24 小时发送的摘要邮件数量
    }  # 结束返回字典


@router.get("/recent-subscriptions")  # 声明近期订阅状态列表接口路由
def recent_subscriptions(db: Session = Depends(get_db)):  # 定义近期订阅状态列表接口函数，并注入数据库会话
    """
    获取最近注册或更新的订阅用户列表
    """
    rows = (  # 构造查询，联合用户与科研画像信息
        db.query(
            User.email,  # 用户邮箱字段
            User.subscription_enabled,  # 用户订阅开关字段
            ResearchProfile.disciplines,  # 科研画像中的学科标签字段
        )  # 结束字段选择
        .outerjoin(  # 使用外连接关联科研画像表
            ResearchProfile,
            ResearchProfile.user_id == User.id,
        )  # 结束外连接条件
        .order_by(User.created_at.desc())  # 按用户创建时间倒序，最近的用户排在最前
        .limit(10)  # 仅返回前 10 条记录
        .all()  # 执行查询
    )  # 结束查询表达式

    items = []  # 初始化返回列表
    for email, subscription_enabled, disciplines in rows:  # 遍历查询结果中的每一行
        if isinstance(disciplines, list) and disciplines:  # 如果 disciplines 是非空列表
            discipline_display = "、".join(disciplines[:3])  # 取前三个学科标签并用顿号拼接
        else:  # 否则表示尚未配置科研画像
            discipline_display = "未配置研究方向"  # 使用默认文案作为占位
        items.append(  # 向返回列表追加一条记录
            {
                "email": email,  # 用户邮箱
                "discipline_display": discipline_display,  # 学科展示文本
                "subscription_enabled": subscription_enabled,  # 订阅开关状态
            }  # 结束记录字典
        )  # 结束追加操作

    return {"items": items}  # 返回包含记录列表的字典
