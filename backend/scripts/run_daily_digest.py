import sys  # 导入 sys 模块以便修改模块搜索路径
import os  # 导入 os 模块以便处理文件系统路径

# 获取当前脚本所在目录的上一级目录（backend 目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 计算 backend 目录的绝对路径
sys.path.append(BASE_DIR)  # 将 backend 目录添加到模块搜索路径，便于脚本独立运行

from datetime import datetime  # 导入 datetime 用于获取当前时间
from sqlalchemy.orm import Session  # 导入 Session 类型用于类型标注
from app.db.session import SessionLocal  # 导入 SessionLocal 工厂用于创建会话
from app.models.user import User  # 导入用户模型以查询订阅用户
from app.models.subscription import ResearchProfile  # 导入科研订阅配置模型以便在独立脚本中正确注册关系映射
from app.models.digest import DailyDigest  # 导入每日摘要模型以记录推送历史
from app.models.paper import Paper  # 导入论文模型以便根据 URL 查询论文 ID
from app.services.crawler import fetch_arxiv_papers, save_papers_to_db  # 导入论文抓取与保存函数
from app.services.llm import generate_summary  # 导入摘要生成函数
from app.services.email import send_email  # 导入发送邮件函数，使用数据库或环境中的 SMTP 配置


def _run_digest_for_user(db: Session, user: User) -> bool:  # 定义内部工具函数，用于对单个用户执行一次摘要推送
    keywords = ["cat:cs.AI"]  # 默认关注的 arXiv 分类，用于兜底
    if user.profile and user.profile.keywords:  # 如果用户已经配置了科研偏好并且有关键词
        keywords = user.profile.keywords  # 使用用户自定义的关键词列表替换默认值

    all_papers = []  # 初始化用于收集所有论文的列表
    for query in keywords:  # 遍历每一个关键词请求 arXiv
        print(f"Fetching papers for user {user.email} with query: {query}")  # 打印当前抓取任务的说明
        try:  # 捕获抓取过程中的异常，避免单个关键词失败影响整体
            papers = fetch_arxiv_papers(query, max_results=5)  # 调用抓取函数从 arXiv 获取论文
            if papers:  # 如果抓取到论文
                save_papers_to_db(papers, db)  # 将新论文保存到数据库
                all_papers.extend(papers)  # 将论文加入当前用户的论文集合
        except Exception as e:  # 捕获所有异常
            print(f"Error fetching papers for query {query}: {e}")  # 打印错误信息方便排查

    if not all_papers:  # 如果所有关键词都没有抓取到论文
        print(f"No papers found for {user.email}")  # 打印提示信息
        return False  # 返回 False 表示没有发送邮件

    unique_papers = {p["url"]: p for p in all_papers}.values()  # 通过论文链接进行去重，保留唯一论文

    email_content = "<h1>今日科研日报</h1>"  # 初始化邮件 HTML 内容头部
    paper_ids = []  # 初始化用于保存论文 ID 列表的容器
    for paper in unique_papers:  # 遍历每一篇唯一论文
        summary = generate_summary(paper["abstract"])  # 使用 LLM 或 Mock 生成摘要
        email_content += f"""
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
            <h3><a href="{paper['url']}">{paper['title']}</a></h3>
            <p><strong>作者:</strong> {', '.join(paper['authors'])}</p>
            <p><strong>摘要:</strong> {summary}</p>
            <p><strong>来源:</strong> {paper['source']} - {paper['published_date']}</p>
        </div>
        """  # 将论文卡片追加到邮件内容中
        db_paper = (  # 构造查询以根据论文 URL 从数据库中查找对应记录
            db.query(Paper)  # 从论文表中构造查询
            .filter(Paper.url == paper["url"])  # 使用论文唯一 URL 作为匹配条件
            .first()  # 只取第一条匹配记录
        )  # 结束论文查询表达式
        if db_paper is not None:  # 如果在数据库中找到了对应的论文记录
            paper_ids.append(db_paper.id)  # 将论文主键 ID 写入列表以便记录到每日摘要中

    if not send_email(  # 调用发送邮件函数，优先使用数据库中的 SMTP 配置
        db,  # 传入数据库会话以便读取 SMTP 配置
        user.email,  # 传入当前用户邮箱作为收件人
        f"科研日报 - {len(list(unique_papers))} 篇新论文",  # 构造邮件主题，包含论文数量信息
        email_content,  # 传入构造好的 HTML 邮件内容
    ):  # 结束 send_email 参数列表
        print(f"Failed to send email to {user.email}")  # 邮件发送失败时打印错误提示
        return False  # 返回 False 表示发送失败

    print(f"Sent email to {user.email}")  # 邮件发送成功时打印提示

    digest = DailyDigest(  # 创建每日摘要记录对象
        user_id=user.id,  # 关联当前推送的用户 ID
        paper_ids=paper_ids or None,  # 将论文 ID 列表写入记录，若为空则存储为 None
    )  # 结束 DailyDigest 构造
    db.add(digest)  # 将每日摘要记录加入当前会话

    return True  # 返回 True 表示发送成功并写入了记录


def run_digest():  # 定义运行每日科研摘要投递的主函数
    db = SessionLocal()  # 创建数据库会话对象，用于查询用户与保存论文
    now = datetime.now()  # 获取当前服务器本地时间，用于与用户配置的本地推送时间进行比对
    current_hour = now.hour  # 读取当前小时数，用于匹配用户配置的推送时间
    current_minute = now.minute  # 读取当前分钟数，用于精确到分钟匹配用户配置的推送时间

    users = (  # 构造查询以获取所有需要推送的订阅用户
        db.query(User)  # 从用户表中查询
        .filter(User.is_active == True, User.subscription_enabled == True)  # 仅选择活跃且开启订阅的用户
        .all()  # 执行查询并返回列表
    )  # 结束查询表达式

    print(f"Found {len(users)} active subscribers.")  # 打印当前订阅用户数量，便于运行时观察

    for user in users:  # 遍历每一个订阅用户
        if user.digest_time:  # 如果用户已经配置了具体推送时间
            try:  # 使用 try 块解析用户配置的时间字符串
                time_str = user.digest_time.strip()  # 去除时间字符串两端可能存在的空白字符
                hour_part, minute_part = time_str.split(":", 1)  # 按冒号分割时间字符串为小时和分钟部分
                hour_value = int(hour_part)  # 将小时部分转换为整数
                minute_value = int(minute_part)  # 将分钟部分转换为整数
            except Exception:  # 捕获解析过程中的所有异常
                print(  # 打印错误配置提醒，便于在终端中观察到具体异常配置
                    f"Invalid digest_time format for user {user.email}: {user.digest_time}"  # 提示用户的 digest_time 配置不符合预期格式 HH:MM
                )  # 结束错误日志打印
                continue  # 跳过配置异常的用户以避免错误中断脚本

            if hour_value != current_hour or minute_value != current_minute:  # 如果用户配置的小时或分钟与当前时间不一致
                continue  # 跳过暂未到达精确推送时间的用户

        _run_digest_for_user(db, user)  # 为当前用户执行一次摘要推送与记录写入

    db.commit()  # 提交所有新增的每日摘要记录
    db.close()  # 关闭数据库会话，释放连接资源


if __name__ == "__main__":  # 当脚本被直接执行时进入入口逻辑
    run_digest()  # 调用 run_digest 函数执行每日摘要推送
