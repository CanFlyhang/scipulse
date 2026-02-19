from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.session import Base

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(JSON)  # 存储作者列表
    abstract = Column(Text)
    structured_abstract = Column(Text)  # LLM 生成的结构化摘要
    url = Column(String(512), unique=True, index=True)
    source = Column(String(50))  # arXiv, PubMed, etc.
    published_date = Column(DateTime)
    # embedding = Column(Vector(1536)) # 如果使用 pgvector，但在 MySQL 中可能需要存储为 JSON 或 Blob，或者使用专门的向量数据库
    # 为了简化，这里先不加 embedding 字段，后续可以用专门的向量库或者 MySQL 插件
    created_at = Column(DateTime(timezone=True), server_default=func.now())
