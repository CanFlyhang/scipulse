from pydantic import BaseModel  # 导入 BaseModel 作为所有模式类的基类


class EmailConfigBase(BaseModel):  # 定义邮箱配置的基础字段模型
    smtp_host: str  # SMTP 服务器地址
    smtp_port: int  # SMTP 服务器端口
    smtp_tls: bool = True  # 是否启用 TLS 加密
    smtp_user: str  # 登录用户名
    smtp_password: str  # 登录密码
    from_email: str  # 发件人邮箱
    from_name: str | None = None  # 发件人名称，可选字段


class EmailConfigCreate(EmailConfigBase):  # 创建邮箱配置时使用的模型，复用基础字段
    pass  # 不额外增加字段，仅复用基础配置字段


class EmailConfigOut(EmailConfigBase):  # 返回给前端的邮箱配置模型
    id: int  # 配置记录的主键 ID
    is_active: bool  # 标记该配置是否为启用状态

    class Config:  # 配置内部类，控制模型行为
        orm_mode = True  # 启用 ORM 模式，支持直接从 SQLAlchemy 模型读取字段

