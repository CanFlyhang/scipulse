import React, { useState, useEffect } from 'react'; // 导入 React 与 Hook，用于定义组件与管理状态及副作用
import { useNavigate, Link } from 'react-router-dom'; // 导入路由导航与链接组件，用于页面跳转
import { sendRegisterCode, registerWithCode } from '../api/auth'; // 导入发送验证码与带验证码注册的接口封装函数
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'; // 导入图标组件用于表单装饰与说明

// 定义注册页面组件，包含邮箱验证码注册流程与视觉强化布局
const Register: React.FC = () => {
  const [email, setEmail] = useState(''); // 定义邮箱输入框的状态变量，默认值为空
  const [password, setPassword] = useState(''); // 定义密码输入框的状态变量，默认值为空
  const [code, setCode] = useState(''); // 定义验证码输入框的状态变量，默认值为空
  const [error, setError] = useState(''); // 定义错误提示信息状态变量，默认值为空
  const [sending, setSending] = useState(false); // 定义发送验证码按钮的加载状态，默认未发送
  const [countdown, setCountdown] = useState(0); // 定义验证码重发倒计时秒数，默认值为 0
  const navigate = useNavigate(); // 获取路由导航函数，用于注册成功后跳转登录页

  // 处理倒计时逻辑，每秒减少一次直到归零
  useEffect(() => { // 使用 useEffect 监听倒计时状态变化
    if (countdown <= 0) return; // 若倒计时已结束则直接返回，不再设置新的定时器
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000); // 创建定时器，每秒将倒计时数值减一
    return () => clearTimeout(timer); // 清理定时器，避免组件卸载后仍然执行
  }, [countdown]); // 将 countdown 作为依赖项，确保其变化时重新执行 effect

  // 处理发送验证码按钮点击事件，向后端请求发送验证码邮件
  const handleSendCode = async () => { // 定义异步处理函数负责发送验证码
    if (!email) { // 若邮箱地址为空
      setError('请先输入邮箱地址'); // 设置错误提示提醒用户填写邮箱
      return; // 提前结束函数执行，避免无效请求
    } // 结束邮箱为空判断分支
    setError(''); // 清空可能存在的旧错误提示信息
    setSending(true); // 设置发送状态为 true，避免重复点击按钮
    try { // 使用 try 块捕获发送过程中的异常
      await sendRegisterCode(email); // 调用封装好的接口函数，请求后端发送验证码邮件
      setCountdown(60); // 将倒计时数值设为 60 秒，限制验证码请求频率
    } catch (err) { // 捕获异常情况
      setError('发送验证码失败，请稍后重试'); // 设置错误提示提醒用户稍后再试
    } finally { // 无论成功与否均会执行的逻辑
      setSending(false); // 将发送状态重置为 false，允许再次点击按钮
    } // 结束 finally 块
  }; // 结束 handleSendCode 函数定义

  // 处理表单提交事件，使用验证码完成注册流程
  const handleSubmit = async (e: React.FormEvent) => { // 定义异步表单提交函数
    e.preventDefault(); // 阻止浏览器默认表单提交行为，避免整页刷新
    setError(''); // 提交前先清空错误提示，防止残留信息干扰
    try { // 使用 try 块捕获注册过程中的异常
      await registerWithCode(email, password, code); // 调用接口函数使用验证码与密码完成注册
      navigate('/login'); // 注册成功后跳转到登录页面
    } catch (err) { // 捕获异常情况
      setError('注册失败，请检查验证码是否正确或稍后重试'); // 更新错误提示信息，引导用户检查验证码
    } // 结束 catch 块
  }; // 结束 handleSubmit 函数定义

  return ( // 返回注册页面 JSX 结构
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8"> {/* 页面最外层容器，深色背景并居中内容 */}
      <div className="max-w-5xl w-full grid md:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden"> {/* 卡片容器，使用左右分栏与圆角阴影 */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-b from-emerald-500/70 via-teal-500/70 to-slate-900 px-8 py-8 text-slate-50"> {/* 左侧介绍与信任感区域，仅在中等屏幕以上展示 */}
          <div> {/* 顶部说明文本容器 */}
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/30 px-3 py-1 text-xs font-medium"> {/* 标签徽标容器 */}
              <ShieldCheck className="h-3 w-3 text-emerald-200" /> {/* 安全盾牌图标，强调账号安全 */}
              <span>邮箱验证 · 保障账号安全</span> {/* 标签文字说明 */}
            </div> {/* 结束标签徽标容器 */}
            <h1 className="mt-6 text-3xl font-bold leading-tight"> {/* 左侧主标题容器 */}
              创建你的科研订阅账户 {/* 主标题文字内容 */}
            </h1> {/* 结束主标题容器 */}
            <p className="mt-4 text-sm text-emerald-50/90"> {/* 副标题说明文字容器 */}
              使用常用邮箱完成注册，我们会通过验证码验证你的身份，后续每日的科研摘要也会发送到这里。 {/* 副标题详细说明内容 */}
            </p> {/* 结束副标题说明文字容器 */}
          </div> {/* 结束顶部说明文本容器 */}
          <div className="mt-8 space-y-2 text-xs text-emerald-50/90"> {/* 底部优势说明列表容器 */}
            <p>• 支持 QQ / 企业邮箱等主流邮箱服务</p> {/* 优势说明一 */}
            <p>• 可在管理后台随时调整发件邮箱配置</p> {/* 优势说明二 */}
            <p>• 每个账号绑定唯一邮箱，便于统一管理订阅</p> {/* 优势说明三 */}
          </div> {/* 结束底部优势说明列表容器 */}
        </div> {/* 结束左侧介绍与信任感区域 */}

        <div className="px-6 py-8 sm:px-8 bg-slate-950/60 backdrop-blur"> {/* 右侧注册表单区域外层容器 */}
          <div className="mb-6"> {/* 标题与说明容器 */}
            <p className="text-xs font-medium text-emerald-400 mb-2">注册新账户</p> {/* 顶部标签文字说明 */}
            <h2 className="text-2xl font-semibold text-slate-50">使用邮箱完成安全注册</h2> {/* 注册主标题文字 */}
            <p className="mt-2 text-xs text-slate-400">输入邮箱获取验证码，验证通过后设置你的登录密码。</p> {/* 注册流程简要说明 */}
          </div> {/* 结束标题与说明容器 */}

          <form className="space-y-4" onSubmit={handleSubmit}> {/* 注册表单容器与提交事件绑定 */}
            <div className="space-y-3"> {/* 输入区域组合容器 */}
              <div className="space-y-1.5"> {/* 邮箱输入块容器 */}
                <label className="block text-xs text-slate-400">邮箱地址</label> {/* 邮箱输入标签文字 */}
                <div className="relative"> {/* 邮箱输入与图标容器 */}
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /> {/* 邮箱图标装饰 */}
                  <input
                    type="email" // 设置输入类型为邮箱字段
                    required // 标记该字段为必填项
                    className="w-full rounded-md border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" // 邮箱输入框样式配置
                    placeholder="请填写常用邮箱，例如 name@qq.com" // 邮箱输入占位文案
                    value={email} // 绑定邮箱状态值
                    onChange={(e) => setEmail(e.target.value)} // 在输入内容变化时更新邮箱状态
                  />
                </div> {/* 结束邮箱输入与图标容器 */}
              </div> {/* 结束邮箱输入块容器 */}

              <div className="space-y-1.5"> {/* 验证码输入与按钮组合容器 */}
                <label className="block text-xs text-slate-400">邮箱验证码</label> {/* 验证码输入标签文字 */}
                <div className="flex gap-2"> {/* 验证码输入与按钮横向布局容器 */}
                  <input
                    type="text" // 设置输入类型为文本
                    required // 标记该字段为必填项
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" // 验证码输入框样式配置
                    placeholder="输入邮件中的 6 位验证码" // 验证码占位提示文字
                    value={code} // 绑定验证码状态值
                    onChange={(e) => setCode(e.target.value)} // 在输入内容变化时更新验证码状态
                  />
                  <button
                    type="button" // 指定按钮类型为普通按钮，避免触发表单提交
                    onClick={handleSendCode} // 点击时触发发送验证码逻辑
                    disabled={sending || countdown > 0} // 在发送中或倒计时尚未结束时禁用按钮
                    className="whitespace-nowrap rounded-md border border-transparent bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed" // 发送按钮样式及禁用样式配置
                  >
                    {countdown > 0 ? `重新发送(${countdown}s)` : '发送验证码'} {/* 根据倒计时状态切换按钮文字 */}
                  </button> {/* 结束发送验证码按钮 */}
                </div> {/* 结束验证码输入与按钮横向布局容器 */}
              </div> {/* 结束验证码输入与按钮组合容器 */}

              <div className="space-y-1.5"> {/* 密码输入块容器 */}
                <label className="block text-xs text-slate-400">设置登录密码</label> {/* 密码输入标签文字 */}
                <div className="relative"> {/* 密码输入与图标容器 */}
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /> {/* 密码图标装饰 */}
                  <input
                    type="password" // 设置输入类型为密码字段
                    required // 标记该字段为必填项
                    className="w-full rounded-md border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" // 密码输入框样式配置
                    placeholder="至少 6 位，建议包含字母和数字" // 密码输入占位提示文字
                    value={password} // 绑定密码状态值
                    onChange={(e) => setPassword(e.target.value)} // 在输入内容变化时更新密码状态
                  />
                </div> {/* 结束密码输入与图标容器 */}
              </div> {/* 结束密码输入块容器 */}
            </div> {/* 结束输入区域组合容器 */}

            {error && ( // 条件渲染错误提示，当 error 非空时显示
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"> {/* 错误提示容器样式配置 */}
                {error} {/* 展示错误提示文字内容 */}
              </div> // 结束错误提示容器
            )} {/* 结束条件渲染错误提示 */}

            <div className="flex items-start text-xs text-slate-500"> {/* 注册提示说明容器 */}
              <span>点击注册即默认你同意我们后续的订阅邮件服务，可以在任何时候在个人中心或邮件底部取消订阅。</span> {/* 注册协议与退订说明文字 */}
            </div> {/* 结束注册提示说明容器 */}

            <button
              type="submit" // 指定按钮类型为提交按钮
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950" // 注册按钮样式配置
            >
              <span>完成注册并登录邮箱查收日报</span> {/* 注册按钮文字内容 */}
              <ArrowRight className="h-4 w-4" /> {/* 向右箭头图标，强调流程前进 */}
            </button> {/* 结束注册按钮 */}

            <div className="mt-3 text-xs text-slate-400 text-center"> {/* 跳转到登录页的提示容器 */}
              已有账号？ {/* 提示文案前半部分 */}
              <Link to="/login" className="ml-1 font-medium text-emerald-400 hover:text-emerald-300"> {/* 登录链接样式配置 */}
                直接登录 {/* 登录链接文字内容 */}
              </Link> {/* 结束登录链接组件 */}
            </div> {/* 结束跳转到登录页的提示容器 */}
          </form> {/* 结束注册表单容器 */}
        </div> {/* 结束右侧注册表单区域外层容器 */}
      </div> {/* 结束卡片容器 */}
    </div> // 结束页面最外层容器
  ); // 结束组件返回语句
}; // 结束 Register 组件定义

export default Register; // 导出注册组件供路由系统使用
