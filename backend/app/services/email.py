import smtplib  # 导入 smtplib 库，用于连接 SMTP 服务器发送邮件
from email.mime.text import MIMEText  # 导入 MIMEText，用于构造文本或 HTML 邮件内容
from email.mime.multipart import MIMEMultipart  # 导入 MIMEMultipart，用于组合多部分邮件内容
from sqlalchemy.orm import Session  # 导入 Session 类型，用于类型标注数据库会话
from app.core.config import settings  # 导入全局配置对象，用于读取环境变量配置
from app.models.email_config import EmailConfig  # 导入邮箱配置模型，以便从数据库获取 SMTP 设置


def _load_smtp_settings(db: Session | None):  # 定义内部工具函数，用于加载当前生效的 SMTP 配置
    if db is not None:  # 如果提供了数据库会话
        config = (  # 从数据库中查询当前启用的邮箱配置
            db.query(EmailConfig)  # 在邮箱配置表中构建查询
            .filter(EmailConfig.is_active == True)  # 仅筛选启用状态记录
            .order_by(EmailConfig.created_at.desc())  # 按创建时间倒序，最新的优先
            .first()  # 仅取一条记录
        )  # 结束查询表达式
        if config:  # 如果找到了启用配置
            return {  # 返回从数据库中组装的 SMTP 配置字典
                "host": config.smtp_host,  # 使用数据库中的服务器地址
                "port": config.smtp_port,  # 使用数据库中的服务器端口
                "tls": config.smtp_tls,  # 使用数据库中的 TLS 开关配置
                "user": config.smtp_user,  # 使用数据库中的登录用户名
                "password": config.smtp_password,  # 使用数据库中的登录密码
                "from_email": config.from_email,  # 使用数据库中的发件人邮箱
                "from_name": config.from_name or config.from_email,  # 优先使用发件人名称，缺失时退回邮箱
            }  # 结束配置字典
    # 如果数据库中没有配置或未提供会话，则回退到环境变量中的配置
    return {  # 返回基于环境变量的 SMTP 配置字典
        "host": settings.SMTP_HOST,  # 使用环境变量中的服务器地址
        "port": settings.SMTP_PORT,  # 使用环境变量中的服务器端口
        "tls": settings.SMTP_TLS,  # 使用环境变量中的 TLS 开关
        "user": settings.SMTP_USER,  # 使用环境变量中的登录用户名
        "password": settings.SMTP_PASSWORD,  # 使用环境变量中的登录密码
        "from_email": settings.EMAILS_FROM_EMAIL,  # 使用环境变量中的发件人邮箱
        "from_name": settings.EMAILS_FROM_NAME or settings.EMAILS_FROM_EMAIL,  # 使用发件人名称或回退为邮箱
    }  # 结束配置字典


def send_email(db: Session | None, to_email: str, subject: str, html_content: str):  # 定义通用发送邮件函数，优先使用数据库中的配置
    """
    发送邮件
    """
    smtp_settings = _load_smtp_settings(db)  # 加载当前可用的 SMTP 配置
    if not smtp_settings["host"]:  # 如果没有配置 SMTP 服务器地址
        print(f"Mock Email Sent to {to_email}: {subject}")  # 打印模拟发送日志，便于开发环境调试
        return True  # 返回 True 表示逻辑上视为发送成功

    try:  # 使用 try 块捕获发送过程中可能出现的异常
        message = MIMEMultipart("alternative")  # 创建多部分邮件对象，便于扩展附件或多种内容格式
        message["Subject"] = subject  # 设置邮件主题为传入的 subject
        message["From"] = smtp_settings["from_email"]  # 设置发件人邮箱地址
        message["To"] = to_email  # 设置收件人邮箱地址

        part = MIMEText(html_content, "html")  # 创建 HTML 格式的邮件内容部分
        message.attach(part)  # 将 HTML 内容附加到邮件对象中

        with smtplib.SMTP(smtp_settings["host"], smtp_settings["port"]) as server:  # 建立与 SMTP 服务器的连接
            if smtp_settings["tls"]:  # 如果配置要求启用 TLS 加密
                server.starttls()  # 启动 TLS 加密通道
            if smtp_settings["user"] and smtp_settings["password"]:  # 如果配置了账号密码
                server.login(smtp_settings["user"], smtp_settings["password"])  # 使用账号密码登录 SMTP 服务器
            server.sendmail(  # 调用 sendmail 方法发送邮件
                smtp_settings["from_email"],  # 指定发件人邮箱
                to_email,  # 指定收件人邮箱
                message.as_string(),  # 序列化邮件为字符串格式
            )  # 结束 sendmail 调用
        return True  # 发送成功时返回 True
    except Exception as e:  # 捕获所有异常
        print(f"Email Error: {e}")  # 打印错误信息便于诊断
        return False  # 返回 False 表示发送失败
