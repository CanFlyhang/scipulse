from pydantic import BaseModel  # 导入 BaseModel 作为模式类基类


class EmailCodeRequest(BaseModel):  # 定义请求发送验证码时使用的请求体模型
    email: str  # 用户注册使用的邮箱地址


class RegisterWithCodeRequest(BaseModel):  # 定义使用验证码完成注册时的请求体模型
    email: str  # 注册邮箱地址
    password: str  # 用户设置的登录密码
    code: str  # 收到的邮箱验证码

