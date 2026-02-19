from app.db.session import Base  # 导入基础 Base 类，所有模型均从该基类继承
from app.models.user import User  # 导入用户模型，确保在创建表时包含用户表
from app.models.paper import Paper  # 导入论文模型，确保在创建表时包含论文表
from app.models.subscription import ResearchProfile  # 导入科研订阅配置模型
from app.models.digest import DailyDigest  # 导入每日摘要投递记录模型
from app.models.email_config import EmailConfig  # 导入邮箱配置模型，支持在数据库中管理 SMTP 配置
from app.models.verification_code import VerificationCode  # 导入验证码模型，用于邮箱验证码注册与验证
