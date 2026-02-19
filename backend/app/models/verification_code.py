from sqlalchemy import Column, Integer, String, Boolean, DateTime  # 导入列类型定义字段
from sqlalchemy.sql import func  # 导入数据库函数用于生成时间戳
from app.db.session import Base  # 导入基础 Base 类用于声明模型


class VerificationCode(Base):  # 定义验证码模型类，用于存储邮箱验证码记录
    __tablename__ = "verification_codes"  # 指定数据库表名为 verification_codes

    id = Column(Integer, primary_key=True, index=True)  # 主键自增列，并建立索引
    email = Column(String(255), index=True, nullable=False)  # 绑定的邮箱地址，建立索引便于查询
    code = Column(String(16), nullable=False)  # 验证码字符串，长度预留为 16 以支持后续扩展
    purpose = Column(String(32), nullable=False)  # 验证码用途，例如 register、reset_password 等
    expires_at = Column(DateTime(timezone=True), nullable=False)  # 过期时间，超过该时间验证码失效
    used = Column(Boolean, default=False)  # 标记验证码是否已经被使用
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 创建时间，默认当前时间

