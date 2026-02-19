from typing import Optional
from pydantic import BaseModel

# Shared properties
class UserBase(BaseModel):
    # 将 EmailStr 改为 str，避免依赖 email-validator
    email: Optional[str] = None
    is_active: Optional[bool] = True
    subscription_enabled: bool = True

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: str
    password: str

# Properties to return to client
class User(UserBase):
    id: int
    is_verified: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
