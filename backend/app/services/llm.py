import os  # 导入 os 模块用于读取环境变量
import time  # 导入 time 模块用于模拟延迟
from typing import Optional  # 导入 Optional 类型用于类型标注
import requests  # 导入 requests 库用于调用 DeepSeek HTTP 接口

# 从环境变量中读取 DeepSeek API Key，如果未配置则为 None
DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")  # 读取 DeepSeek 接口使用的 API 密钥

# 允许通过环境变量自定义 DeepSeek API Base 地址，默认为官方地址
DEEPSEEK_API_BASE: str = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")  # 读取 DeepSeek 接口基础地址

# 允许通过环境变量自定义使用的模型名称，默认为 deepseek-chat
DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")  # 读取 DeepSeek 使用的模型名称


def generate_summary(text: str) -> str:  # 定义生成论文摘要的主函数
    """
    使用 DeepSeek LLM 生成结构化中文摘要
    """
    # 如果没有配置 DeepSeek 的 API Key，则直接返回 Mock 摘要
    if not DEEPSEEK_API_KEY:  # 检查是否已经配置 DeepSeek 接口的 API 密钥
        print("Warning: 'DEEPSEEK_API_KEY' not set. Using mock summary.")  # 提示未配置 DeepSeek 密钥将使用 Mock 摘要
        return _mock_summary(text)  # 返回基于原文截断的 Mock 摘要

    url = f"{DEEPSEEK_API_BASE.rstrip('/')}/chat/completions"  # 拼接 DeepSeek 聊天补全接口地址
    headers = {  # 构造 HTTP 请求头
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",  # 在 Authorization 头中携带 Bearer Token
        "Content-Type": "application/json",  # 指定请求体为 JSON 格式
    }  # 结束请求头字典

    payload = {  # 构造发送给 DeepSeek 的请求体
        "model": DEEPSEEK_MODEL,  # 指定使用的 DeepSeek 模型名称
        "messages": [  # 构造对话消息列表
            {
                "role": "system",  # 指定消息角色为 system
                "content": "你是一个科研助手，请将以下论文摘要总结为结构化的中文摘要，包含：研究背景、方法、结果、结论。",  # 设定总结风格与结构要求
            },  # 结束 system 消息字典
            {
                "role": "user",  # 指定消息角色为 user
                "content": text,  # 将论文原始摘要作为用户输入内容
            },  # 结束 user 消息字典
        ],  # 结束消息列表
    }  # 结束请求体字典

    try:  # 使用 try 捕获请求 DeepSeek 过程中的异常
        response = requests.post(url, headers=headers, json=payload, timeout=15)  # 向 DeepSeek 接口发送 POST 请求
        if response.status_code != 200:  # 如果返回的 HTTP 状态码不是 200
            print(f"DeepSeek HTTP Error: {response.status_code} - {response.text}")  # 打印 HTTP 错误信息
            return _mock_summary(text)  # 回退到 Mock 摘要生成

        data = response.json()  # 将返回结果解析为 JSON 数据
        choices = data.get("choices")  # 从 JSON 中读取 choices 字段
        if not choices:  # 如果返回中没有 choices 字段
            print(f"DeepSeek Response Missing 'choices': {data}")  # 打印返回结构异常信息
            return _mock_summary(text)  # 回退到 Mock 摘要生成

        message = choices[0].get("message")  # 读取第一条补全结果中的 message 字段
        if not message or "content" not in message:  # 如果 message 为空或不包含 content 字段
            print(f"DeepSeek Response Missing 'message.content': {data}")  # 打印返回结构异常信息
            return _mock_summary(text)  # 回退到 Mock 摘要生成

        return message["content"]  # 返回 DeepSeek 模型生成的摘要文本
    except Exception as e:  # 捕获所有网络或解析异常
        print(f"DeepSeek Error: {e}")  # 打印异常信息便于排查
        return _mock_summary(text)  # 发生异常时回退到 Mock 摘要生成


def _mock_summary(text: str) -> str:  # 定义 Mock 摘要生成函数
    """
    Mock 摘要生成，仅截取前200字并加上前缀
    """
    # 模拟一点延迟
    time.sleep(0.5)  # 通过 sleep 模拟调用大模型接口的延迟
    return f"[AI生成摘要(Mock)] 本文探讨了... (由于未配置DeepSeek或环境限制，仅展示部分原文) \n\n{text[:200]}..."  # 返回带有固定前缀和截断原文的 Mock 摘要字符串
