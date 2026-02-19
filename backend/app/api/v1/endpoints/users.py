from typing import Any  # 引入 Any 类型用于函数返回值标注
from fastapi import APIRouter, Depends, HTTPException  # 引入 FastAPI 路由、依赖注入与异常类
from fastapi.security import OAuth2PasswordBearer  # 引入 OAuth2PasswordBearer，用于从请求中提取访问令牌
from jose import JWTError, jwt  # 引入 JWT 工具与异常类型，用于解析与校验 token
from pydantic import BaseModel  # 引入 BaseModel，用于定义科研画像与测试投递请求体模型
from sqlalchemy.orm import Session  # 引入数据库会话类型
from app.db.session import get_db  # 引入获取数据库会话的依赖函数
from app.models.user import User as UserModel  # 引入用户模型
from app.models.subscription import ResearchProfile  # 引入科研订阅配置模型
from app.models.digest import DailyDigest  # 引入每日摘要模型，用于查询与记录历史推送
from app.models.paper import Paper  # 引入论文模型，用于根据每日摘要中的论文 ID 查询论文详情
from app.schemas.user import User as UserSchema, UserCreate  # 引入用户相关 Pydantic 模型
from app.core import security  # 引入安全工具模块，用于密码哈希等
from app.core.config import settings  # 引入全局配置对象，读取 JWT 密钥与算法
from scripts.run_daily_digest import _run_digest_for_user  # 从脚本中导入为单个用户执行推送的工具函数


oauth2_scheme = OAuth2PasswordBearer(  # 创建 OAuth2PasswordBearer 实例，用于在依赖中获取 Bearer token
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"  # 指定获取 token 的后端地址
)  # 结束 oauth2_scheme 定义


router = APIRouter()  # 创建当前模块的路由对象


class ResearchProfileUpdate(BaseModel):  # 定义科研画像更新请求体模型
    disciplines: list[str] = []  # 前端提交的研究方向标签列表
    keywords: list[str] = []  # 前端提交的关注关键词标签列表
    journal_preferences: list[str] = []  # 前端提交的期刊偏好标签列表


class TestDigestResponse(BaseModel):  # 定义测试推送接口的返回数据模型
    success: bool  # 标记本次测试推送是否执行成功
    message: str  # 返回给前端的提示信息，用于展示在界面上


class DigestTimePayload(BaseModel):  # 定义更新用户推送时间配置的请求体模型
    digest_time: str | None = None  # 用户希望设置的每日推送时间，格式为 HH:MM；为 None 时表示清除自定义配置


def get_current_user(  # 定义依赖函数，用于根据访问令牌解析并加载当前登录用户
    token: str = Depends(oauth2_scheme),  # 从请求头的 Authorization 中提取 Bearer token
    db: Session = Depends(get_db),  # 注入数据库会话
) -> UserModel:  # 返回值类型为用户模型实例
    credentials_exception = HTTPException(  # 预先构造认证失败时抛出的异常对象
        status_code=401,  # 使用 401 未认证状态码
        detail="Could not validate credentials",  # 提示无法验证凭据
        headers={"WWW-Authenticate": "Bearer"},  # 指定认证类型为 Bearer
    )  # 结束异常对象构造

    try:  # 使用 try 块捕获 JWT 解析过程中可能出现的异常
        payload = jwt.decode(  # 使用 jose 库解码 JWT 字符串
            token,  # 需要被解码的访问令牌字符串
            settings.SECRET_KEY,  # 解码使用的密钥
            algorithms=[settings.ALGORITHM],  # 允许使用的签名算法列表
        )  # 结束 jwt.decode 调用
        user_id: str | None = payload.get("sub")  # 从负载中读取用户 ID 字段
        if user_id is None:  # 如果没有找到用户 ID
            raise credentials_exception  # 抛出认证失败异常
    except JWTError:  # 捕获 JWT 解析错误
        raise credentials_exception  # 抛出统一的认证失败异常

    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()  # 根据解析出的用户 ID 查询数据库中的用户记录
    if user is None:  # 如果用户不存在
        raise credentials_exception  # 抛出认证失败异常
    return user  # 返回当前登录用户对象


@router.post("/", response_model=UserSchema)  # 声明创建用户接口路由与返回模型
def create_user(  # 定义创建用户接口函数
    *,  # 使用命名参数以提高调用可读性
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    user_in: UserCreate,  # 从请求体中接收用户创建模型
) -> Any:  # 返回值类型为任意对象，但实际为用户模型
    """
    创建新用户
    """
    user = db.query(UserModel).filter(UserModel.email == user_in.email).first()  # 根据邮箱查询是否已存在用户
    if user:  # 如果查询到用户
        raise HTTPException(  # 抛出 HTTP 异常提示用户已存在
            status_code=400,  # 使用 400 错误码
            detail="The user with this username already exists in the system.",  # 错误提示信息
        )  # 结束异常抛出

    user_data = user_in.dict(exclude={"password"})  # 将 UserCreate 转换为字典并排除明文密码字段

    db_user = UserModel(  # 创建新的用户实体对象
        **user_data,  # 展开除密码外的字段
        hashed_password=security.get_password_hash(user_in.password),  # 对密码进行哈希后写入字段
    )  # 结束用户实体构造
    db.add(db_user)  # 将新用户添加到当前数据库会话
    db.commit()  # 提交事务将更改持久化到数据库
    db.refresh(db_user)  # 刷新用户对象以获取数据库生成的 ID 等字段
    return db_user  # 返回新创建的用户对象


@router.get("/me", response_model=UserSchema)  # 声明获取当前登录用户信息的接口路由与返回模型
def read_user_me(  # 定义获取当前登录用户信息的接口函数
    current_user: UserModel = Depends(get_current_user),  # 通过依赖注入获取当前登录用户
) -> Any:  # 返回值类型为任意对象，但实际为用户模型
    """
    获取当前登录用户信息
    """
    return current_user  # 直接返回当前登录用户对象


@router.post("/me/subscription-toggle", response_model=UserSchema)  # 声明切换当前用户订阅开关的接口路由与返回模型
def toggle_subscription(  # 定义切换订阅状态接口函数
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，但实际为用户模型
    """
    切换当前用户的订阅开关
    """
    current_user.subscription_enabled = not current_user.subscription_enabled  # 将订阅状态取反实现开关切换
    db.add(current_user)  # 将修改后的用户对象加入当前会话
    db.commit()  # 提交事务保存更改
    db.refresh(current_user)  # 刷新用户对象以获取最新状态
    return current_user  # 返回更新后的用户对象


@router.get("/me/profile")  # 声明获取当前用户科研画像信息的接口路由
def read_user_profile(  # 定义获取当前用户科研画像信息的接口函数
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为字典形式的科研画像信息
    """
    获取当前登录用户的科研研究方向与画像配置
    """
    profile = (  # 查询当前用户的科研画像记录
        db.query(ResearchProfile)
        .filter(ResearchProfile.user_id == current_user.id)
        .first()
    )  # 结束科研画像查询

    if not profile:  # 如果当前用户尚未配置科研画像
        return {  # 返回默认的空配置结构
            "disciplines": [],  # 学科标签列表为空
            "keywords": [],  # 关键词列表为空
            "journal_preferences": [],  # 期刊偏好列表为空
        }  # 结束默认返回字典

    return {  # 返回从数据库中读取到的科研画像配置
        "disciplines": profile.disciplines or [],  # 返回学科标签列表，空值回退为空列表
        "keywords": profile.keywords or [],  # 返回关注关键词列表，空值回退为空列表
        "journal_preferences": profile.journal_preferences or [],  # 返回期刊偏好列表，空值回退为空列表
    }  # 结束返回字典


@router.post("/me/profile")  # 声明更新当前用户科研画像信息的接口路由
def update_user_profile(  # 定义更新当前用户科研画像信息的接口函数
    payload: ResearchProfileUpdate,  # 从请求体中接收科研画像更新数据
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为字典形式的科研画像信息
    """
    创建或更新当前登录用户的科研研究方向与画像配置
    """
    profile = (  # 查询当前用户是否已经存在科研画像记录
        db.query(ResearchProfile)
        .filter(ResearchProfile.user_id == current_user.id)
        .first()
    )  # 结束科研画像查询

    if profile is None:  # 如果当前用户尚未配置科研画像
        profile = ResearchProfile(  # 创建新的科研画像记录
            user_id=current_user.id,  # 关联当前登录用户 ID
            disciplines=payload.disciplines,  # 使用请求体中的研究方向标签列表
            keywords=payload.keywords,  # 使用请求体中的关注关键词标签列表
            journal_preferences=payload.journal_preferences,  # 使用请求体中的期刊偏好标签列表
        )  # 结束科研画像实体构造
        db.add(profile)  # 将新建的科研画像记录加入当前会话
    else:  # 如果已经存在科研画像记录
        profile.disciplines = payload.disciplines  # 更新研究方向标签列表
        profile.keywords = payload.keywords  # 更新关注关键词标签列表
        profile.journal_preferences = payload.journal_preferences  # 更新期刊偏好标签列表
        db.add(profile)  # 将更新后的科研画像记录加入当前会话以便提交

    db.commit()  # 提交事务以持久化科研画像更改
    db.refresh(profile)  # 刷新科研画像对象以获取数据库中的最新字段

    return {  # 返回更新后的科研画像配置字典
        "disciplines": profile.disciplines or [],  # 返回更新后的研究方向标签列表
        "keywords": profile.keywords or [],  # 返回更新后的关注关键词标签列表
        "journal_preferences": profile.journal_preferences or [],  # 返回更新后的期刊偏好标签列表
    }  # 结束返回字典


@router.get("/me/digests")  # 声明获取当前用户历史推送记录列表的接口路由
def read_user_digests(  # 定义获取当前登录用户每日摘要历史记录列表的接口函数
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为包含历史记录的列表
    """
    获取当前登录用户的历史推送记录列表
    """
    digests = (  # 查询当前用户的每日摘要记录
        db.query(DailyDigest)  # 从每日摘要表中构造查询
        .filter(DailyDigest.user_id == current_user.id)  # 仅筛选当前用户的记录
        .order_by(DailyDigest.sent_at.desc())  # 按发送时间倒序排列，最近的记录排在最前
        .limit(20)  # 限制最多返回 20 条历史记录，避免一次返回过多数据
        .all()  # 执行查询并返回列表
    )  # 结束查询表达式

    items: list[dict[str, Any]] = []  # 初始化用于存放返回记录字典的列表
    for digest in digests:  # 遍历每一条每日摘要记录
        items.append(  # 追加组装后的记录字典
            {
                "id": digest.id,  # 写入每日摘要记录主键 ID
                "sent_at": digest.sent_at.isoformat() if digest.sent_at else None,  # 将发送时间转换为 ISO 格式字符串
                "paper_count": len(digest.paper_ids or []),  # 统计该次推送中包含的论文数量
            }  # 结束记录字典
        )  # 结束追加操作

    return {"items": items}  # 返回包含历史记录列表的字典


@router.get("/me/digests/{digest_id}")  # 声明获取指定每日摘要详情的接口路由
def read_user_digest_detail(  # 定义获取某一次每日摘要详情的接口函数
    digest_id: int,  # 路径参数中的每日摘要记录主键 ID
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为包含论文列表的字典
    """
    获取当前用户某一次每日摘要推送对应的论文列表详情
    """
    digest = (  # 查询当前用户指定 ID 的每日摘要记录
        db.query(DailyDigest)  # 从每日摘要表中构造查询
        .filter(  # 添加过滤条件限定记录范围
            DailyDigest.id == digest_id,  # 要求每日摘要 ID 匹配传入的 digest_id
            DailyDigest.user_id == current_user.id,  # 要求摘要记录属于当前登录用户
        )  # 结束过滤条件
        .first()  # 只取第一条匹配记录
    )  # 结束每日摘要查询表达式

    if digest is None:  # 如果没有查询到对应的每日摘要记录
        raise HTTPException(  # 抛出 HTTP 404 异常提示记录不存在或不属于当前用户
            status_code=404,  # 使用 404 状态码表示资源未找到
            detail="Digest not found",  # 返回简要的错误提示信息
        )  # 结束异常抛出

    paper_ids = digest.paper_ids or []  # 从每日摘要记录中读取论文 ID 列表，空值回退为空列表
    if not paper_ids:  # 如果该次每日摘要未记录任何论文 ID
        return {  # 直接返回空论文列表
            "id": digest.id,  # 返回每日摘要记录主键 ID
            "sent_at": digest.sent_at.isoformat() if digest.sent_at else None,  # 返回发送时间的 ISO 字符串
            "papers": [],  # 返回空论文列表
        }  # 结束返回字典

    papers = (  # 构造查询以根据论文 ID 列表加载所有论文详情
        db.query(Paper)  # 从论文表中构造查询
        .filter(Paper.id.in_(paper_ids))  # 使用 in 条件筛选出所有相关论文
        .all()  # 执行查询并返回论文列表
    )  # 结束论文查询表达式

    paper_map: dict[int, Paper] = {paper.id: paper for paper in papers}  # 将论文列表构造成以 ID 为键的字典便于按照原始顺序重排
    ordered_papers: list[Paper] = [  # 构造按照每日摘要中记录顺序排列的论文列表
        paper_map[pid]  # 根据论文 ID 从字典中取出对应论文对象
        for pid in paper_ids  # 遍历每日摘要记录中的论文 ID 列表
        if pid in paper_map  # 仅保留在数据库中仍然存在的论文
    ]  # 结束列表推导

    paper_items: list[dict[str, Any]] = []  # 初始化用于承载论文详情字典的列表
    for paper in ordered_papers:  # 遍历排序后的论文对象列表
        paper_items.append(  # 追加一个包含论文关键信息的字典
            {
                "id": paper.id,  # 论文主键 ID
                "title": paper.title,  # 论文标题
                "url": paper.url,  # 论文原文链接
                "authors": paper.authors or [],  # 论文作者列表，空值回退为空数组
                "abstract": paper.abstract or "",  # 原始摘要文本，空值回退为空字符串
                "structured_abstract": paper.structured_abstract or "",  # 结构化摘要，空值回退为空字符串
                "source": paper.source or "",  # 论文来源，例如 arXiv
                "published_date": paper.published_date.isoformat() if paper.published_date else None,  # 发布时间的 ISO 字符串
            }  # 结束论文详情字典
        )  # 结束追加操作

    return {  # 返回包含每日摘要元信息与论文列表的字典
        "id": digest.id,  # 返回每日摘要记录主键 ID
        "sent_at": digest.sent_at.isoformat() if digest.sent_at else None,  # 返回发送时间的 ISO 字符串
        "papers": paper_items,  # 返回论文详情列表
    }  # 结束返回字典


@router.post("/me/test-digest", response_model=TestDigestResponse)  # 声明触发当前用户测试推送邮件的接口路由与返回模型
def test_user_digest(  # 定义测试触发当前用户一次科研日报投递的接口函数
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为 TestDigestResponse 模型
    """
    为当前登录用户立即触发一次测试科研日报推送
    """
    if not current_user.subscription_enabled:  # 如果当前用户尚未开启订阅开关
        return TestDigestResponse(  # 返回提示信息并标记为失败
            success=False,  # 标记测试推送未执行
            message="请先开启订阅开关后再尝试测试推送。",  # 提示前端用户需要先打开订阅
        )  # 结束返回对象构造

    ok = _run_digest_for_user(db, current_user)  # 复用脚本中的逻辑，为当前用户执行一次推送与记录写入

    if not ok:  # 如果返回结果表示没有发送任何邮件
        return TestDigestResponse(  # 返回提示信息并标记为失败
            success=False,  # 标记本次测试未成功发送邮件
            message="未能为当前配置找到合适的论文，请检查研究方向与关键词。",  # 提示用户检查科研画像配置
        )  # 结束返回对象构造

    db.commit()  # 提交在 _run_digest_for_user 中产生的每日摘要记录

    return TestDigestResponse(  # 返回成功提示信息
        success=True,  # 标记测试推送执行成功
        message="测试科研日报已触发，请稍后查收邮箱",  # 返回前端可展示的提示文案
    )  # 结束返回对象构造


@router.get("/me/digest-time")  # 声明获取当前用户每日推送时间配置的接口路由
def read_user_digest_time(  # 定义获取当前登录用户每日推送时间配置的接口函数
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为包含时间字符串的字典
    """
    获取当前登录用户配置的每日推送时间
    """
    return {  # 返回简单的时间配置字典
        "digest_time": current_user.digest_time,  # 将用户模型中的 digest_time 字段原样返回给前端
    }  # 结束返回字典


@router.post("/me/digest-time")  # 声明更新当前用户每日推送时间配置的接口路由
def update_user_digest_time(  # 定义更新当前登录用户每日推送时间配置的接口函数
    payload: DigestTimePayload,  # 从请求体中接收新的推送时间配置
    db: Session = Depends(get_db),  # 注入数据库会话依赖
    current_user: UserModel = Depends(get_current_user),  # 注入当前登录用户对象
) -> Any:  # 返回值类型为任意对象，这里为更新后的时间配置字典
    """
    更新当前登录用户的每日推送时间配置
    """
    current_user.digest_time = payload.digest_time  # 将请求体中的新时间字符串写入用户模型
    db.add(current_user)  # 将修改后的用户对象加入当前会话
    db.commit()  # 提交事务以持久化更改
    db.refresh(current_user)  # 刷新用户对象以获取数据库中的最新值

    return {  # 返回更新后的时间配置字典
        "digest_time": current_user.digest_time,  # 返回当前用户的推送时间配置
    }  # 结束返回字典
