import client from './client'; // 引入通用 Axios 客户端实例，用于请求后端 API

// 获取当前启用的邮箱配置
export const getEmailSettings = async () => { // 定义异步函数用于获取邮箱配置
  const response = await client.get('/admin/email-settings'); // 向后端发送 GET 请求获取邮箱配置数据
  return response.data; // 返回响应体中的数据部分
}; // 结束 getEmailSettings 函数定义

// 创建或更新邮箱配置
export const upsertEmailSettings = async (payload) => { // 定义异步函数用于创建或更新邮箱配置
  const response = await client.post('/admin/email-settings', payload); // 向后端发送 POST 请求提交邮箱配置
  return response.data; // 返回响应体中的数据部分
}; // 结束 upsertEmailSettings 函数定义

// 获取管理后台总览统计数据
export const getAdminOverview = async () => { // 定义异步函数用于获取管理后台总览统计
  const response = await client.get('/admin/overview'); // 向后端发送 GET 请求获取总览统计数据
  return response.data; // 返回响应体中的数据部分
}; // 结束 getAdminOverview 函数定义

// 获取近期订阅状态列表数据
export const getRecentSubscriptions = async () => { // 定义异步函数用于获取近期订阅状态列表
  const response = await client.get('/admin/recent-subscriptions'); // 向后端发送 GET 请求获取订阅列表数据
  return response.data; // 返回响应体中的数据部分
}; // 结束 getRecentSubscriptions 函数定义
