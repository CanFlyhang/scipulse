from sqlalchemy import Boolean, Column, Integer, String, DateTime  # 导入布尔、整型、字符串与时间列类型
from sqlalchemy.orm import relationship  # 导入 relationship 用于定义模型之间的关系
from sqlalchemy.sql import func  # 导入 func 以便使用数据库时间函数
from app.db.session import Base  # 导入 Base 作为所有模型的基类


class User(Base):  # 定义用户模型类
    __tablename__ = "users"  # 指定用户表名称为 users

    id = Column(Integer, primary_key=True, index=True)  # 用户主键 ID，自增并建立索引
    email = Column(String(255), unique=True, index=True, nullable=False)  # 用户邮箱地址，唯一且必填
    hashed_password = Column(String(255), nullable=False)  # 哈希后的登录密码，必填字段
    is_active = Column(Boolean, default=True)  # 标记用户账号是否处于激活状态
    is_verified = Column(Boolean, default=False)  # 标记用户邮箱是否已经完成验证
    subscription_enabled = Column(Boolean, default=True)  # 订阅开关，控制是否参与每日摘要推送
    digest_time = Column(String(5), nullable=True)  # 用户配置的每日推送时间，格式为 HH:MM，可为空表示使用默认时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 记录用户创建时间
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # 记录用户最近一次更新时间

    profile = relationship("ResearchProfile", back_populates="user", uselist=False)  # 一对一关联科研画像配置
    digests = relationship("DailyDigest", back_populates="user")  # 一对多关联每日摘要记录
