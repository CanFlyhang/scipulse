import React, { useState } from 'react'; // 引入 React 与 useState，用于定义组件与管理本地状态
import { useNavigate, Link } from 'react-router-dom'; // 引入路由导航与链接组件，用于页面跳转
import { login } from '../api/auth'; // 引入登录接口封装函数，用于与后端交互
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'; // 引入图标组件，用于美化登录界面

// 定义登录页面组件，负责展示登录表单与基础品牌信息
const Login: React.FC = () => {
  const [email, setEmail] = useState(''); // 定义邮箱输入框的状态变量，默认值为空字符串
  const [password, setPassword] = useState(''); // 定义密码输入框的状态变量，默认值为空字符串
  const [error, setError] = useState(''); // 定义错误提示信息的状态变量，默认值为空字符串
  const navigate = useNavigate(); // 获取路由导航函数，用于在登录成功后跳转页面

  // 处理表单提交事件，向后端发起登录请求
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止浏览器默认提交行为，避免刷新页面
    try { // 使用 try 块捕获登录过程中的异常
      const data = await login(email, password); // 调用登录接口，将邮箱与密码传递给后端
      localStorage.setItem('token', data.access_token); // 将后端返回的访问令牌保存到本地存储中
      navigate('/dashboard'); // 登录成功后跳转到用户订阅工作台页面
    } catch (err) { // 捕获登录失败或网络错误
      setError('登录失败，请检查邮箱和密码'); // 更新错误状态，提示用户检查登录信息
    } // 结束 catch 块
  }; // 结束 handleSubmit 函数定义

  return ( // 返回登录页面的整体 JSX 结构
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8"> {/* 整体容器，深色背景并居中内容 */}
      <div className="max-w-5xl w-full grid md:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden"> {/* 卡片容器，左右分栏布局与圆角阴影 */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-b from-indigo-600/70 via-indigo-500/70 to-slate-900 px-8 py-8 text-slate-50"> {/* 左侧品牌区域，仅在中等及以上屏幕展示 */}
          <div> {/* 顶部品牌信息容器 */}
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/30 px-3 py-1 text-xs font-medium"> {/* 小徽标容器，展示平台名称标签 */}
              <Sparkles className="h-3 w-3 text-amber-300" /> {/* 闪光图标，用于突出标签 */}
              <span>科研信息聚合平台</span> {/* 平台名称文字说明 */}
            </div> {/* 结束小徽标容器 */}
            <h1 className="mt-6 text-3xl font-bold leading-tight"> {/* 左侧主标题容器 */}
              让科研信息<br /> {/* 第一行主标题文字与换行 */}
              自动送上门 {/* 第二行主标题文字 */}
            </h1> {/* 结束主标题容器 */}
            <p className="mt-4 text-sm text-indigo-100/90"> {/* 副标题说明文字容器 */}
              聚合 arXiv 等多源文献，按你的研究方向自动生成每日科研摘要，用邮箱送达你的收件箱。 {/* 副标题详细说明内容 */}
            </p> {/* 结束副标题说明文字容器 */}
          </div> {/* 结束顶部品牌信息容器 */}
          <div className="mt-8 space-y-2 text-xs text-indigo-100/80"> {/* 底部说明文字区域容器 */}
            <p>• 支持多学科订阅与关键词配置</p> {/* 特色说明一 */}
            <p>• AI 生成结构化摘要，节省筛文时间</p> {/* 特色说明二 */}
            <p>• 支持邮件退订与重启，不打扰你的节奏</p> {/* 特色说明三 */}
          </div> {/* 结束底部说明文字区域容器 */}
        </div> {/* 结束左侧品牌区域 */}

        <div className="px-6 py-8 sm:px-8 bg-slate-950/60 backdrop-blur"> {/* 右侧登录表单区域容器 */}
          <div className="mb-6"> {/* 标题与说明容器 */}
            <p className="text-xs font-medium text-indigo-400 mb-2">欢迎回来</p> {/* 顶部欢迎标语文字 */}
            <h2 className="text-2xl font-semibold text-slate-50">登录你的科研账户</h2> {/* 登录主标题文字 */}
            <p className="mt-2 text-xs text-slate-400">使用注册邮箱和密码登录，以管理你的订阅与偏好。</p> {/* 登录说明文字 */}
          </div> {/* 结束标题与说明容器 */}

          <form className="space-y-4" onSubmit={handleSubmit}> {/* 登录表单容器与提交事件绑定 */}
            <div className="space-y-3"> {/* 输入区域组合容器 */}
              <div className="space-y-1.5"> {/* 邮箱输入块容器 */}
                <label className="block text-xs text-slate-400">邮箱地址</label> {/* 邮箱输入标签文字 */}
                <div className="relative"> {/* 邮箱输入与图标容器 */}
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /> {/* 邮箱图标装饰 */}
                  <input
                    type="email" // 设置输入类型为邮箱
                    required // 标记为必填字段
                    className="w-full rounded-md border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" // 邮箱输入框样式配置
                    placeholder="name@university.edu" // 输入占位示例地址
                    value={email} // 绑定邮箱状态值
                    onChange={(e) => setEmail(e.target.value)} // 在输入内容变化时更新邮箱状态
                  />
                </div> {/* 结束邮箱输入与图标容器 */}
              </div> {/* 结束邮箱输入块容器 */}

              <div className="space-y-1.5"> {/* 密码输入块容器 */}
                <label className="block text-xs text-slate-400">登录密码</label> {/* 密码输入标签文字 */}
                <div className="relative"> {/* 密码输入与图标容器 */}
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /> {/* 密码图标装饰 */}
                  <input
                    type="password" // 设置输入类型为密码
                    required // 标记为必填字段
                    className="w-full rounded-md border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" // 密码输入框样式配置
                    placeholder="请输入登录密码" // 密码输入占位文案
                    value={password} // 绑定密码状态值
                    onChange={(e) => setPassword(e.target.value)} // 在输入内容变化时更新密码状态
                  />
                </div> {/* 结束密码输入与图标容器 */}
              </div> {/* 结束密码输入块容器 */}
            </div> {/* 结束输入区域组合容器 */}

            {error && ( // 条件渲染错误提示，当 error 文本非空时显示
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"> {/* 错误提示容器样式 */}
                {error} {/* 展示错误提示文字内容 */}
              </div> // 结束错误提示容器
            )} {/* 结束条件渲染错误提示 */}

            <div className="flex items-center justify-between text-xs text-slate-500"> {/* 辅助说明与占位链接布局容器 */}
              <span>登录后你可以随时调整订阅与退订。</span> {/* 简单登录说明文字 */}
              <span className="italic">忘记密码？后续将支持邮箱找回</span> {/* 忘记密码占位提示文字 */}
            </div> {/* 结束辅助说明与占位链接布局容器 */}

            <button
              type="submit" // 指定按钮为提交类型
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950" // 登录按钮样式配置
            >
              <span>登录到平台</span> {/* 登录按钮文字内容 */}
              <ArrowRight className="h-4 w-4" /> {/* 向右箭头图标，表示前进 */}
            </button> {/* 结束登录按钮 */}

            <div className="mt-3 text-xs text-slate-400 text-center"> {/* 注册引导文字容器 */}
              还没有账号？ {/* 提示文字前半部分 */}
              <Link to="/register" className="ml-1 font-medium text-indigo-400 hover:text-indigo-300"> {/* 注册链接样式配置 */}
                使用邮箱注册新账户 {/* 注册链接文字内容 */}
              </Link> {/* 结束注册链接 */}
            </div> {/* 结束注册引导文字容器 */}
          </form> {/* 结束登录表单容器 */}
        </div> {/* 结束右侧登录表单区域容器 */}
      </div> {/* 结束卡片容器 */}
    </div> // 结束整体页面最外层容器
  ); // 结束组件返回语句
}; // 结束 Login 组件定义

export default Login; // 导出登录组件，供路由系统使用
