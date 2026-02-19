from datetime import timedelta, datetime  # 导入时间相关工具，用于生成过期时间与 token 有效期
from fastapi import APIRouter, Depends, HTTPException  # 导入 FastAPI 路由与依赖注入及异常类
from fastapi.security import OAuth2PasswordRequestForm  # 导入 OAuth2 表单，用于登录接口
from sqlalchemy.orm import Session  # 导入数据库会话类型
from app.db.session import get_db  # 导入获取数据库会话的依赖函数
from app.core import security  # 导入安全工具模块，用于密码校验与 token 生成
from app.core.config import settings  # 导入全局配置对象
from app.models.user import User as UserModel  # 导入用户模型
from app.models.verification_code import VerificationCode  # 导入验证码模型
from app.schemas.user import Token  # 导入 token 响应模型
from app.schemas.auth_extra import EmailCodeRequest, RegisterWithCodeRequest  # 导入验证码相关请求模型
from app.services.email import send_email  # 导入发送邮件服务函数

router = APIRouter()  # 创建当前模块的路由对象


@router.post("/login/access-token", response_model=Token)  # 声明登录接口路由与返回模型
def login_access_token(  # 定义登录接口函数
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()  # 注入数据库会话以及 OAuth2 表单数据
):  # 结束函数签名
    """
    OAuth2 兼容的令牌登录，获取访问令牌
    """
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()  # 根据邮箱查询用户记录
    if not user or not security.verify_password(form_data.password, user.hashed_password):  # 如果用户不存在或密码校验失败
        raise HTTPException(status_code=400, detail="Incorrect email or password")  # 抛出 400 错误提示登录信息错误
    if not user.is_active:  # 如果用户被标记为未激活
        raise HTTPException(status_code=400, detail="Inactive user")  # 抛出 400 错误提示用户未激活
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)  # 计算访问令牌的过期时间跨度
    return {  # 返回包含访问令牌与类型的字典
        "access_token": security.create_access_token(  # 调用工具函数生成 JWT 访问令牌
            user.id, expires_delta=access_token_expires  # 将用户 ID 写入 token，并设置过期时间
        ),
        "token_type": "bearer",  # 标明 token 类型为 Bearer
    }  # 结束返回字典


@router.post("/send-register-code")  # 声明发送注册验证码的接口路由
def send_register_code(  # 定义发送注册验证码接口函数
    payload: EmailCodeRequest,  # 从请求体中接收邮箱字段
    db: Session = Depends(get_db),  # 注入数据库会话
):  # 结束函数签名
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email).first()  # 查询是否已经存在该邮箱的用户
    if existing_user:  # 如果用户已存在
        raise HTTPException(status_code=400, detail="User already exists, please login directly")  # 提示用户直接登录即可

    # 生成 6 位数字验证码
    import random  # 导入随机数模块用于生成验证码

    code = "".join(str(random.randint(0, 9)) for _ in range(6))  # 生成由 6 个数字组成的字符串验证码
    expires_at = datetime.utcnow() + timedelta(minutes=10)  # 设置验证码过期时间为当前时间的 10 分钟后

    verification = VerificationCode(  # 创建验证码记录实例
        email=payload.email,  # 绑定验证码的邮箱地址
        code=code,  # 保存生成的验证码字符串
        purpose="register",  # 标记验证码用途为注册
        expires_at=expires_at,  # 设置验证码过期时间
    )  # 结束 VerificationCode 对象创建

    db.add(verification)  # 将验证码记录加入会话
    db.commit()  # 提交事务保存到数据库

    subject = "科研信息聚合平台注册验证码"  # 设置邮件主题
    html_content = f"<p>您的注册验证码为：<strong>{code}</strong>，10 分钟内有效。</p>"  # 构造简单的 HTML 邮件内容

    send_email(db, payload.email, subject, html_content)  # 调用邮件服务发送验证码邮件
    return {"message": "Verification code sent"}  # 返回简单的成功提示信息


@router.post("/register-with-code")  # 声明使用验证码注册的新接口路由
def register_with_code(  # 定义注册接口函数
    payload: RegisterWithCodeRequest,  # 从请求体接收邮箱、密码与验证码
    db: Session = Depends(get_db),  # 注入数据库会话
):  # 结束函数签名
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email).first()  # 查询该邮箱是否已经注册
    if existing_user:  # 如果用户已存在
        raise HTTPException(status_code=400, detail="User already exists, please login directly")  # 提示用户直接登录

    now = datetime.utcnow()  # 获取当前 UTC 时间，用于比较过期时间
    verification = (  # 查询最新的一条尚未使用且未过期的注册验证码
        db.query(VerificationCode)  # 在验证码表中查询
        .filter(  # 添加查询条件
            VerificationCode.email == payload.email,  # 绑定同一邮箱
            VerificationCode.purpose == "register",  # 用途为注册
            VerificationCode.used == False,  # 尚未被使用
            VerificationCode.expires_at > now,  # 尚未过期
        )  # 结束 filter 条件
        .order_by(VerificationCode.created_at.desc())  # 按创建时间倒序，优先选取最新验证码
        .first()  # 仅取一条记录
    )  # 结束查询表达式

    if not verification or verification.code != payload.code:  # 如果没有找到可用验证码或者验证码不匹配
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")  # 抛出 400 错误提示验证码无效或已过期

    verification.used = True  # 将该验证码标记为已使用

    from app.schemas.user import UserCreate  # 延迟导入 UserCreate 以避免循环依赖
    from app.core import security as security_module  # 重新导入 security 模块以使用密码哈希函数
    from app.models.user import User as UserModelInternal  # 重新导入 User 模型以创建新用户

    user_in = UserCreate(email=payload.email, password=payload.password)  # 构造用户创建模型对象
    user_data = user_in.dict(exclude={"password"})  # 将模型转换为字典并排除明文密码字段

    db_user = UserModelInternal(  # 创建新的用户实体对象
        **user_data,  # 展开除密码外的字段
        hashed_password=security_module.get_password_hash(user_in.password),  # 使用工具函数生成密码哈希并写入字段
        is_verified=True,  # 将用户标记为已完成邮箱验证
    )  # 结束用户对象创建

    db.add(db_user)  # 把新用户添加到数据库会话中
    db.commit()  # 提交事务保存用户与验证码的状态更新
    db.refresh(db_user)  # 刷新用户对象以获取数据库生成的 ID

    return {"message": "User registered successfully"}  # 返回注册成功的提示信息
