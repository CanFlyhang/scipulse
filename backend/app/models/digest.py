from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class DailyDigest(Base):
    __tablename__ = "daily_digests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=func.now())
    paper_ids = Column(JSON)  # 推送的论文 ID 列表
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="digests")
