from sqlalchemy import Column, Integer, String, Boolean, DateTime  # 导入列类型与基础字段类型，用于定义表结构
from sqlalchemy.sql import func  # 导入数据库函数，用于生成时间戳
from app.db.session import Base  # 导入基础 Base 类，用于声明模型基类


class EmailConfig(Base):  # 定义邮箱配置模型类，对应数据库中的邮箱配置表
    __tablename__ = "email_configs"  # 指定数据库表名为 email_configs

    id = Column(Integer, primary_key=True, index=True)  # 主键自增列，并建立索引加速查询
    smtp_host = Column(String(255), nullable=False)  # SMTP 服务器地址，不允许为空
    smtp_port = Column(Integer, nullable=False)  # SMTP 服务器端口号，不允许为空
    smtp_tls = Column(Boolean, default=True)  # 是否启用 TLS 加密，默认启用
    smtp_user = Column(String(255), nullable=False)  # SMTP 登录用户名，不允许为空
    smtp_password = Column(String(255), nullable=False)  # SMTP 登录密码，当前以明文存储，后续可替换为加密
    from_email = Column(String(255), nullable=False)  # 发件人邮箱地址，不允许为空
    from_name = Column(String(255), nullable=True)  # 发件人展示名称，可以为空
    is_active = Column(Boolean, default=True)  # 标记该配置是否为当前启用配置
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 记录配置创建时间，默认使用当前时间
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # 记录配置最近一次更新时间，在更新时自动变更

