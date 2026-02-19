import client from './client'; // 导入预配置的 Axios 客户端实例，用于调用后端接口

// 登录接口封装函数，使用用户名与密码交换访问令牌
export const login = async (username, password) => { // 定义异步登录函数，接收用户名与密码参数
  const formData = new FormData(); // 创建表单数据对象，用于构造后端期望的表单提交格式
  formData.append('username', username); // 将用户名追加到表单数据中
  formData.append('password', password); // 将密码追加到表单数据中
  const response = await client.post('/login/access-token', formData, { // 调用后端登录接口提交表单数据
    headers: { // 指定请求头信息
      'Content-Type': 'multipart/form-data', // 声明使用 multipart/form-data 以兼容 OAuth2 标准登录
    }, // 结束 headers 配置对象
  }); // 结束 post 请求
  return response.data; // 返回后端响应体的数据部分
}; // 结束 login 函数定义

// 发送注册验证码接口封装函数
export const sendRegisterCode = async (email) => { // 定义异步函数，用于向后端请求发送验证码邮件
  const response = await client.post('/send-register-code', { // 调用后端发送验证码接口
    email, // 在请求体中携带邮箱地址
  }); // 结束 post 请求
  return response.data; // 返回后端响应体的数据部分
}; // 结束 sendRegisterCode 函数定义

// 使用验证码完成注册的接口封装函数
export const registerWithCode = async (email, password, code) => { // 定义异步注册函数，接收邮箱、密码与验证码
  const response = await client.post('/register-with-code', { // 调用后端使用验证码注册的接口
    email, // 注册用邮箱
    password, // 注册用密码
    code, // 邮箱收到的验证码
  }); // 结束 post 请求
  return response.data; // 返回后端响应体的数据部分
}; // 结束 registerWithCode 函数定义

// 获取当前登录用户信息
export const getCurrentUser = async () => { // 定义异步函数用于获取当前登录用户信息
  const response = await client.get('/users/me'); // 调用后端接口获取当前用户数据
  return response.data; // 返回响应体中的数据部分
}; // 结束 getCurrentUser 函数定义

// 切换当前登录用户的订阅开关
export const toggleSubscription = async () => { // 定义异步函数用于切换当前用户订阅开关
  const response = await client.post('/users/me/subscription-toggle'); // 调用后端接口切换订阅状态
  return response.data; // 返回响应体中的数据部分
}; // 结束 toggleSubscription 函数定义

// 获取当前登录用户的科研画像配置
export const getMyProfile = async () => { // 定义异步函数用于获取当前用户的科研研究方向配置
  const response = await client.get('/users/me/profile'); // 调用后端接口获取科研画像信息
  return response.data; // 返回响应体中的数据部分
}; // 结束 getMyProfile 函数定义

// 更新当前登录用户的科研画像配置
export const updateMyProfile = async (payload) => { // 定义异步函数用于更新当前用户的科研研究方向配置
  const response = await client.post('/users/me/profile', payload); // 调用后端接口提交最新的科研画像配置
  return response.data; // 返回响应体中的数据部分
}; // 结束 updateMyProfile 函数定义

// 获取当前登录用户的历史推送记录列表
export const getMyDigests = async () => { // 定义异步函数用于获取当前用户的历史推送记录
  const response = await client.get('/users/me/digests'); // 调用后端接口获取历史推送记录列表
  return response.data; // 返回响应体中的数据部分
}; // 结束 getMyDigests 函数定义

// 获取当前登录用户配置的每日推送时间
export const getMyDigestTime = async () => { // 定义异步函数用于获取当前用户的每日推送时间配置
  const response = await client.get('/users/me/digest-time'); // 调用后端接口获取推送时间设置
  return response.data; // 返回响应体中的数据部分
}; // 结束 getMyDigestTime 函数定义

// 更新当前登录用户配置的每日推送时间
export const updateMyDigestTime = async (digestTime) => { // 定义异步函数用于更新当前用户的每日推送时间配置
  const response = await client.post('/users/me/digest-time', { digest_time: digestTime }); // 调用后端接口提交新的推送时间配置
  return response.data; // 返回响应体中的数据部分
}; // 结束 updateMyDigestTime 函数定义

// 触发一次当前登录用户的测试科研日报推送
export const triggerTestDigest = async () => { // 定义异步函数用于触发一次测试推送
  const response = await client.post('/users/me/test-digest'); // 调用后端接口触发测试推送
  return response.data; // 返回响应体中的数据部分
}; // 结束 triggerTestDigest 函数定义

// 获取某一次历史推送对应的论文详情列表
export const getMyDigestDetail = async (digestId) => { // 定义异步函数用于获取指定每日摘要的论文详情
  const response = await client.get(`/users/me/digests/${digestId}`); // 调用后端接口按 ID 获取每日摘要详情
  return response.data; // 返回响应体中的数据部分
}; // 结束 getMyDigestDetail 函数定义
