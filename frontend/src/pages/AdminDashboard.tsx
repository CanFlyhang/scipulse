import React, { useEffect, useState } from 'react'; // 引入 React 库及 Hook，支持状态管理与副作用
import { useNavigate } from 'react-router-dom'; // 引入路由导航钩子，用于页面跳转
import { BarChart2, Mail, Users, ArrowLeftCircle, Settings } from 'lucide-react'; // 引入图标组件，美化管理界面与邮箱配置模块
import { getEmailSettings, upsertEmailSettings, getAdminOverview, getRecentSubscriptions } from '../api/admin'; // 引入邮箱配置与管理统计相关 API 封装函数

// 定义邮箱配置表单使用的本地状态类型
type EmailFormState = { // 声明邮箱配置表单状态对象的结构
  smtp_host: string; // SMTP 服务器地址字段
  smtp_port: number; // SMTP 服务器端口字段
  smtp_tls: boolean; // SMTP 是否启用 TLS 加密字段
  smtp_user: string; // SMTP 登录用户名字段
  smtp_password: string; // SMTP 登录密码字段
  from_email: string; // 发件人邮箱地址字段
  from_name: string; // 发件人名称字段
}; // 结束 EmailFormState 类型定义

// 定义管理后台统计卡片展示使用的状态类型
type AdminStatsState = { // 声明管理后台统计数据状态对象结构
  total_users: number; // 平台用户总数
  active_users: number; // 激活用户数量
  subscribed_users: number; // 订阅开启用户数量
  total_profiles: number; // 已配置科研画像的数量
  daily_emails: number; // 近 24 小时发送邮件数量
}; // 结束 AdminStatsState 类型定义

// 定义订阅状态监控列表单条记录的类型
type SubscriptionRow = { // 声明订阅状态表格单行记录结构
  email: string; // 用户邮箱
  discipline_display: string; // 研究方向展示文本
  subscription_enabled: boolean; // 订阅开关状态
}; // 结束 SubscriptionRow 类型定义

// 定义管理后台页面可用的功能分区标识
type AdminSection = 'overview' | 'subscriptions' | 'email'; // 使用联合类型约束可选分区枚举值

// 定义左侧导航栏中每个导航项的数据结构
type AdminNavItem = { // 声明导航项对象结构
  id: AdminSection; // 导航项对应的功能分区标识
  label: string; // 在界面中展示的导航标题文本
  icon: React.ComponentType<{ className?: string }>; // 导航项左侧展示的图标组件类型
}; // 结束 AdminNavItem 类型定义

// 定义管理后台左侧导航栏使用的导航项配置列表
const adminNavItems: AdminNavItem[] = [ // 创建包含所有导航项的数组
  {
    id: 'overview', // 导航项标识为总览统计分区
    label: '总览统计', // 在侧边栏展示“总览统计”标题
    icon: BarChart2, // 使用柱状图图标代表统计信息
  }, // 结束总览统计导航项配置
  {
    id: 'subscriptions', // 导航项标识为订阅监控分区
    label: '订阅监控', // 在侧边栏展示“订阅监控”标题
    icon: Users, // 使用用户图标代表订阅用户列表
  }, // 结束订阅监控导航项配置
  {
    id: 'email', // 导航项标识为邮件配置分区
    label: '邮件配置', // 在侧边栏展示“邮件配置”标题
    icon: Settings, // 使用设置图标代表系统配置
  }, // 结束邮件配置导航项配置
]; // 结束 adminNavItems 数组定义

// 定义每个功能分区在顶部工具栏中显示的标题映射关系
const sectionTitleMap: Record<AdminSection, string> = { // 使用 Record 将分区标识映射到标题文本
  overview: '总览统计', // 当当前分区为 overview 时显示“总览统计”
  subscriptions: '订阅状态监控', // 当当前分区为 subscriptions 时显示“订阅状态监控”
  email: '邮件发送配置', // 当当前分区为 email 时显示“邮件发送配置”
}; // 结束 sectionTitleMap 映射对象定义

// 定义管理后台页面组件，作为平台运营侧的入口界面
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate(); // 获取路由导航函数，用于返回用户端或其他页面

  const [emailForm, setEmailForm] = useState<EmailFormState>({ // 定义邮箱配置表单状态，并设置默认值
    smtp_host: 'smtp.qq.com', // 默认 SMTP 服务器地址设置为 QQ 邮箱服务器
    smtp_port: 587, // 默认端口设置为 587，适用于 STARTTLS 加密
    smtp_tls: true, // 默认开启 TLS 加密，提高传输安全性
    smtp_user: '', // 初始登录用户名为空，等待管理员填写
    smtp_password: '', // 初始登录密码为空，避免误暴露
    from_email: '', // 初始发件邮箱为空，由管理员配置
    from_name: '科研信息聚合平台', // 默认发件人名称为平台名称
  }); // 结束 emailForm 状态定义

  const [emailLoading, setEmailLoading] = useState(false); // 定义邮箱配置加载与提交的加载状态
  const [emailMessage, setEmailMessage] = useState<string | null>(null); // 定义邮箱配置保存成功或失败的提示信息
  const [emailError, setEmailError] = useState<string | null>(null); // 定义邮箱配置错误提示信息
  const [stats, setStats] = useState<AdminStatsState | null>(null); // 定义管理后台统计数据状态
  const [statsLoading, setStatsLoading] = useState<boolean>(false); // 定义统计数据加载状态
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]); // 定义订阅状态监控列表数据
  const [activeSection, setActiveSection] = useState<AdminSection>('overview'); // 定义当前右侧内容区域展示的功能分区，默认展示总览统计

  // 处理返回用户前台按钮点击事件，跳转到普通用户工作台
  const handleBackToUser = () => {
    navigate('/dashboard'); // 跳转到用户订阅工作台页面路由
  }; // 结束 handleBackToUser 函数定义

  // 在组件挂载时尝试从后端加载当前启用的邮箱配置与统计数据
  useEffect(() => { // 使用 useEffect 在组件初次渲染后执行副作用
    const fetchEmailSettings = async () => { // 定义内部异步函数用于获取邮箱配置
      try { // 使用 try 块捕获请求异常
        setEmailLoading(true); // 将加载状态设置为 true，避免重复提交
        setEmailError(null); // 清空之前的错误提示信息
        const data = await getEmailSettings(); // 调用 API 获取当前邮箱配置
        if (data) { // 如果后端已经配置了邮箱设置
          setEmailForm({ // 使用后端返回的数据更新表单状态
            smtp_host: data.smtp_host, // 设置 SMTP 服务器地址
            smtp_port: data.smtp_port, // 设置 SMTP 端口号
            smtp_tls: data.smtp_tls, // 设置 TLS 开关
            smtp_user: data.smtp_user, // 设置登录用户名
            smtp_password: '', // 出于安全考虑，密码字段不回显，仅留空等待重新填写
            from_email: data.from_email, // 设置发件邮箱地址
            from_name: data.from_name ?? '科研信息聚合平台', // 设置发件人名称，缺失时使用默认名称
          }); // 结束表单状态更新
        } // 结束 data 存在性判断
      } catch { // 捕获所有异常情况
        // 如果尚未配置邮箱，则保持默认表单值，不做额外处理
      } finally { // 无论成功还是失败都会执行
        setEmailLoading(false); // 将加载状态重置为 false
      } // 结束 finally 块
    }; // 结束 fetchEmailSettings 函数定义

    const fetchOverviewAndSubscriptions = async () => { // 定义内部异步函数用于获取总览统计与订阅列表
      try { // 使用 try 块捕获请求异常
        setStatsLoading(true); // 将统计数据加载状态设置为 true
        const [overview, recent] = await Promise.all([ // 并行调用两个接口以提升加载效率
          getAdminOverview(), // 调用后台总览统计接口
          getRecentSubscriptions(), // 调用近期订阅状态列表接口
        ]); // 结束 Promise.all 调用
        setStats(overview); // 将后台总览统计结果写入状态
        setSubscriptions(recent.items || []); // 将订阅状态列表写入状态，若不存在则回退为空数组
      } catch { // 捕获所有异常情况
        // 此处暂不展示错误，仅在界面保持默认占位
      } finally { // 无论成功失败都会执行
        setStatsLoading(false); // 将统计数据加载状态重置为 false
      } // 结束 finally 块
    }; // 结束 fetchOverviewAndSubscriptions 函数定义

    fetchEmailSettings(); // 调用内部函数触发一次邮箱配置加载
    fetchOverviewAndSubscriptions(); // 调用内部函数触发一次统计与订阅列表加载
  }, []); // 依赖数组为空，确保仅在组件挂载时执行一次

  // 处理邮箱配置表单输入变化事件
  const handleEmailInputChange = (field: keyof EmailFormState, value: string | boolean) => { // 定义通用表单变更处理函数
    setEmailForm((prev) => ({ // 使用函数式更新，基于之前的状态创建新对象
      ...prev, // 展开旧状态中的字段
      [field]: field === 'smtp_port' ? Number(value) : value, // 对端口字段进行数字转换，其余字段保持原值
    })); // 结束状态更新
  }; // 结束 handleEmailInputChange 函数定义

  // 处理邮箱配置保存按钮点击事件
  const handleSaveEmailSettings = async (e: React.FormEvent) => { // 定义异步提交处理函数
    e.preventDefault(); // 阻止表单默认提交刷新页面行为
    setEmailMessage(null); // 重置成功提示信息
    setEmailError(null); // 重置错误提示信息
    try { // 使用 try 块捕获接口调用异常
      setEmailLoading(true); // 将加载状态设置为 true
      const payload = { // 构造提交给后端的配置对象
        smtp_host: emailForm.smtp_host, // 服务器地址
        smtp_port: emailForm.smtp_port, // 端口号
        smtp_tls: emailForm.smtp_tls, // TLS 开关
        smtp_user: emailForm.smtp_user, // 登录用户名
        smtp_password: emailForm.smtp_password, // 登录密码
        from_email: emailForm.from_email, // 发件邮箱地址
        from_name: emailForm.from_name, // 发件人名称
      }; // 结束 payload 对象构造
      await upsertEmailSettings(payload); // 调用后端接口保存邮箱配置
      setEmailMessage('邮箱配置已保存，后续发送将使用该配置'); // 设置成功提示信息
    } catch { // 捕获所有异常情况
      setEmailError('保存失败，请检查配置是否正确或稍后重试'); // 设置错误提示信息
    } finally { // 无论成功失败都要执行
      setEmailLoading(false); // 重置加载状态为 false
    } // 结束 finally 块
  }; // 结束 handleSaveEmailSettings 函数定义

  return ( // 返回管理后台页面的 JSX 结构
    <div className="min-h-screen bg-slate-950 text-slate-50 flex"> {/* 整页深色背景与左右分栏布局容器 */}
      <aside className="w-60 border-r border-slate-800 bg-slate-950/90 flex flex-col"> {/* 左侧导航栏容器，固定宽度 */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800"> {/* 导航栏顶部品牌与标题区域 */}
          <BarChart2 className="h-6 w-6 text-indigo-400" /> {/* 平台 Logo 图标，稍小尺寸适配侧边栏 */}
          <div className="flex flex-col"> {/* 标题文本容器 */}
            <span className="text-sm font-semibold text-slate-200">科研信息聚合平台</span> {/* 平台名称文字 */}
            <span className="text-xs text-slate-500">运营管理后台</span> {/* 管理后台副标题 */}
          </div> {/* 结束标题文本容器 */}
        </div> {/* 结束品牌与标题区域 */}
        <nav className="flex-1 px-2 py-4 space-y-1 text-sm"> {/* 左侧导航项列表容器 */}
          {adminNavItems.map((item) => ( // 遍历导航项配置数组渲染每一项
            <button
              key={item.id} // 使用导航项标识作为唯一键
              type="button" // 指定按钮类型为普通按钮
              onClick={() => setActiveSection(item.id)} // 点击时切换当前激活的功能分区
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left ${
                activeSection === item.id // 根据当前激活分区决定样式
                  ? 'bg-slate-900 text-indigo-300' // 选中状态下背景与文字高亮
                  : 'text-slate-300 hover:bg-slate-900/70 hover:text-indigo-200' // 未选中状态下的默认与悬停样式
              }`}
            >
              <item.icon className="h-4 w-4" /> {/* 导航项左侧图标，使用统一尺寸 */}
              <span className="truncate">{item.label}</span> {/* 导航标题文本，超出宽度时截断 */}
            </button>
          ))} {/* 结束导航项映射渲染 */}
        </nav> {/* 结束左侧导航项列表容器 */}
      </aside> {/* 结束左侧导航栏容器 */}

      <div className="flex-1 flex flex-col"> {/* 右侧内容区域外层容器，纵向布局头部与主体 */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur"> {/* 顶部工具栏容器 */}
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"> {/* 顶部工具栏内容布局 */}
            <div className="flex flex-col"> {/* 左侧当前分区标题区域容器 */}
              <span className="text-xs text-slate-500">当前模块</span> {/* 小号说明文字 */}
              <span className="text-sm font-medium text-slate-100">
                {sectionTitleMap[activeSection]} {/* 根据当前激活分区展示对应标题 */}
              </span>
            </div> {/* 结束当前分区标题区域容器 */}
            <button
              type="button" // 指定按钮类型为普通按钮
              onClick={handleBackToUser} // 绑定返回用户端的点击事件
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:border-indigo-400 hover:text-indigo-300"
            >{/* 返回用户端按钮样式 */}
              <ArrowLeftCircle className="h-4 w-4" /> {/* 返回图标 */}
              返回用户前台 {/* 按钮文字说明 */}
            </button> {/* 结束返回按钮 */}
          </div> {/* 结束顶部工具栏内容布局 */}
        </header> {/* 结束顶部工具栏容器 */}

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"> {/* 主体内容区域容器，依据当前分区切换不同内容 */}
          {activeSection === 'overview' && ( // 当当前分区为总览统计时展示统计卡片
            <section className="grid gap-6 md:grid-cols-3"> {/* 顶部统计卡片分栏布局 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm"> {/* 用户总数统计卡片 */}
                <div className="flex items-center justify-between"> {/* 卡片头部布局 */}
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">平台用户</span> {/* 标题文字 */}
                  <Users className="h-4 w-4 text-indigo-400" /> {/* 用户图标 */}
                </div> {/* 结束卡片头部布局 */}
                <p className="mt-3 text-2xl font-semibold text-slate-50">
                  {stats ? stats.total_users : '—'} {/* 显示平台用户总数，若尚未加载则使用占位符 */}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {statsLoading ? '统计加载中...' : '包含所有注册用户数量'} {/* 根据加载状态切换说明文字 */}
                </p>
              </div> {/* 结束用户总数统计卡片 */}

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm"> {/* 每日邮件统计卡片 */}
                <div className="flex items-center justify-between"> {/* 卡片头部布局 */}
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">每日邮件发送量</span> {/* 标题文字 */}
                  <Mail className="h-4 w-4 text-emerald-400" /> {/* 邮件图标 */}
                </div> {/* 结束卡片头部布局 */}
                <p className="mt-3 text-2xl font-semibold text-slate-50">
                  {stats ? stats.daily_emails : '—'} {/* 显示近 24 小时发送邮件数量 */}
                </p>
                <p className="mt-1 text-xs text-slate-500">统计近 24 小时实际摘要投递数量</p> {/* 说明文字 */}
              </div> {/* 结束每日邮件统计卡片 */}

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm"> {/* 订阅主题统计卡片 */}
                <div className="flex items-center justify-between"> {/* 卡片头部布局 */}
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">研究方向覆盖</span> {/* 标题文字 */}
                  <BarChart2 className="h-4 w-4 text-sky-400" /> {/* 图标展示 */}
                </div> {/* 结束卡片头部布局 */}
                <p className="mt-3 text-2xl font-semibold text-slate-50">
                  {stats ? stats.total_profiles : '—'} {/* 显示已配置科研画像数量 */}
                </p>
                <p className="mt-1 text-xs text-slate-500">代表已经完善科研画像的核心用户数量</p> {/* 说明文字 */}
              </div> {/* 结束订阅主题统计卡片 */}
            </section> /* 结束总览统计分区布局 */
          )}

          {activeSection === 'subscriptions' && ( // 当当前分区为订阅监控时展示订阅状态表格
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"> {/* 订阅状态监控列表容器 */}
              <div className="flex items-center justify-between mb-3"> {/* 列表头部布局 */}
                <div className="flex flex-col"> {/* 列表标题容器 */}
                  <h2 className="text-sm font-semibold text-slate-100">订阅状态监控</h2> {/* 标题文字 */}
                  <p className="text-xs text-slate-500">用于查看近期用户订阅开关状态变化（当前为示例数据）</p> {/* 说明文字 */}
                </div> {/* 结束列表标题容器 */}
              </div> {/* 结束列表头部布局 */}

              <div className="overflow-hidden rounded-lg border border-slate-800"> {/* 列表表格外层容器 */}
                <table className="min-w-full divide-y divide-slate-800 text-sm"> {/* 简易表格结构 */}
                  <thead className="bg-slate-900"> {/* 表头背景区域 */}
                    <tr> {/* 表头行 */}
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"> {/* 用户列标题单元格 */}
                        用户邮箱 {/* 列标题文字 */}
                      </th> {/* 结束用户列标题单元格 */}
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"> {/* 研究方向列标题单元格 */}
                        研究方向示例 {/* 列标题文字 */}
                      </th> {/* 结束研究方向列标题单元格 */}
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"> {/* 订阅状态列标题单元格 */}
                        订阅状态 {/* 列标题文字 */}
                      </th> {/* 结束订阅状态列标题单元格 */}
                    </tr> {/* 结束表头行 */}
                  </thead> {/* 结束表头区域 */}
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40"> {/* 表体区域，带分隔线与背景 */}
                    {subscriptions.length === 0 ? ( // 如果当前没有任何订阅记录
                      <tr> {/* 空状态展示行 */}
                        <td
                          colSpan={3} // 合并三列单元格展示空状态文案
                          className="px-3 py-4 text-center text-xs text-slate-500"
                        >
                          当前暂未收集到用户订阅记录，等待更多用户配置科研画像与订阅开关
                        </td> {/* 结束空状态单元格 */}
                      </tr> /* 结束空状态展示行 */
                    ) : ( // 否则展示真实订阅列表
                      subscriptions.map((row) => ( // 遍历订阅记录列表渲染表格行
                        <tr key={row.email}> {/* 使用邮箱作为唯一键 */}
                          <td className="px-3 py-2 text-slate-100">{row.email}</td> {/* 用户邮箱列 */}
                          <td className="px-3 py-2 text-slate-300">{row.discipline_display}</td> {/* 研究方向列 */}
                          <td className="px-3 py-2">
                            <span
                              className={`text-xs ${
                                row.subscription_enabled ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {row.subscription_enabled ? '已开启' : '暂停中'} {/* 根据订阅状态显示文案 */}
                            </span>
                          </td> {/* 结束订阅状态列 */}
                        </tr>
                      ))
                    )} {/* 结束订阅记录条件渲染 */}
                  </tbody> {/* 结束表体区域 */}
                </table> {/* 结束表格结构 */}
              </div> {/* 结束表格外层容器 */}
            </section> /* 结束订阅监控分区布局 */
          )}

          {activeSection === 'email' && ( // 当当前分区为邮件配置时展示邮箱配置表单
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"> {/* 邮箱配置表单容器 */}
              <div className="flex items-center justify-between mb-3"> {/* 邮箱配置标题与图标布局容器 */}
                <div className="flex items-center gap-2"> {/* 左侧标题与图标组合容器 */}
                  <Settings className="h-4 w-4 text-indigo-400" /> {/* 邮箱配置模块图标 */}
                  <h2 className="text-sm font-semibold text-slate-100">邮件发送配置（推荐 QQ 邮箱）</h2> {/* 模块标题文字 */}
                </div> {/* 结束标题与图标组合容器 */}
              </div> {/* 结束标题布局容器 */}

              <p className="text-xs text-slate-500 mb-3"> {/* 说明文字容器 */}
                推荐使用 QQ 邮箱开启 SMTP 服务：在「账号设置 - 账户安全」中开启 POP3/SMTP 服务，使用授权码作为密码。
              </p> {/* 结束说明文字容器 */}

              <form className="space-y-3" onSubmit={handleSaveEmailSettings}> {/* 邮箱配置表单容器与提交事件绑定 */}
                <div className="grid grid-cols-2 gap-3"> {/* 基础服务器信息两列布局容器 */}
                  <div> {/* SMTP 服务器地址输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">SMTP 服务器</label> {/* 输入说明标签 */}
                    <input
                      type="text" // 文本输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.smtp_host} // 绑定 SMTP 服务器地址值
                      onChange={(e) => handleEmailInputChange('smtp_host', e.target.value)} // 输入变更时更新状态
                      placeholder="例如 smtp.qq.com" // 占位示例文本
                    />
                  </div> {/* 结束 SMTP 服务器地址输入容器 */}

                  <div> {/* 端口号输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">端口</label> {/* 端口号标签文字 */}
                    <input
                      type="number" // 数字输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.smtp_port} // 绑定端口号状态值
                      onChange={(e) => handleEmailInputChange('smtp_port', e.target.value)} // 输入变更时更新端口号
                      placeholder="例如 587" // 占位文本提示端口示例
                    />
                  </div> {/* 结束端口号输入容器 */}
                </div> {/* 结束基础服务器信息两列布局容器 */}

                <div className="flex items-center gap-2"> {/* TLS 开关与说明横向布局容器 */}
                  <input
                    id="smtp_tls" // 复选框对应的标识 ID
                    type="checkbox" // 输入类型设置为复选框
                    checked={emailForm.smtp_tls} // 绑定 TLS 开关状态值
                    onChange={(e) => handleEmailInputChange('smtp_tls', e.target.checked)} // 状态变化时更新 TLS 字段
                    className="h-3 w-3 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-400" // 复选框样式
                  />
                  <label htmlFor="smtp_tls" className="text-xs text-slate-400"> {/* 复选框文本标签 */}
                    启用 TLS（QQ 邮箱推荐端口 587 + TLS）
                  </label> {/* 结束 TLS 文本标签 */}
                </div> {/* 结束 TLS 开关与说明横向布局容器 */}

                <div className="grid grid-cols-2 gap-3"> {/* 登录账号与密码两列布局容器 */}
                  <div> {/* 登录用户名输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">登录账号</label> {/* 登录账号标签文字 */}
                    <input
                      type="text" // 文本输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.smtp_user} // 绑定 SMTP 用户名状态值
                      onChange={(e) => handleEmailInputChange('smtp_user', e.target.value)} // 输入变更时更新用户名
                      placeholder="例如 your@qq.com" // 占位文本示例 QQ 邮箱
                    />
                  </div> {/* 结束登录用户名输入容器 */}

                  <div> {/* 授权码输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">授权码 / 密码</label> {/* 授权码标签文字 */}
                    <input
                      type="password" // 密码输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.smtp_password} // 绑定 SMTP 密码状态值
                      onChange={(e) => handleEmailInputChange('smtp_password', e.target.value)} // 输入变更时更新密码
                      placeholder="QQ 邮箱生成的 SMTP 授权码" // 占位文本说明使用授权码而非登录密码
                    />
                  </div> {/* 结束授权码输入容器 */}
                </div> {/* 结束登录账号与密码两列布局容器 */}

                <div className="grid grid-cols-2 gap-3"> {/* 发件邮箱与名称两列布局容器 */}
                  <div> {/* 发件邮箱输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">发件邮箱</label> {/* 发件邮箱标签文字 */}
                    <input
                      type="email" // 邮箱输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.from_email} // 绑定发件邮箱状态值
                      onChange={(e) => handleEmailInputChange('from_email', e.target.value)} // 输入变更时更新发件邮箱
                      placeholder="与登录账号保持一致更易区分" // 占位文本提示发件邮箱建议
                    />
                  </div> {/* 结束发件邮箱输入容器 */}

                  <div> {/* 发件人名称输入容器 */}
                    <label className="block text-xs text-slate-400 mb-1">发件人名称</label> {/* 发件人名称标签文字 */}
                    <input
                      type="text" // 文本输入类型
                      className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none" // 输入框样式
                      value={emailForm.from_name} // 绑定发件人名称状态值
                      onChange={(e) => handleEmailInputChange('from_name', e.target.value)} // 输入变更时更新发件人名称
                      placeholder="例如 科研信息聚合平台" // 占位文本示例发件人名称
                    />
                  </div> {/* 结束发件人名称输入容器 */}
                </div> {/* 结束发件邮箱与名称两列布局容器 */}

                {emailError && ( // 条件渲染错误提示信息
                  <div className="text-xs text-red-400">{emailError}</div> // 错误提示文本样式
                )} {/* 结束错误提示条件渲染 */}
                {emailMessage && ( // 条件渲染成功提示信息
                  <div className="text-xs text-emerald-400">{emailMessage}</div> // 成功提示文本样式
                )} {/* 结束成功提示条件渲染 */}

                <div className="flex justify-end"> {/* 底部按钮布局容器，右对齐 */}
                  <button
                    type="submit" // 按钮类型为提交按钮
                    disabled={emailLoading} // 当加载状态为 true 时禁用按钮
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-slate-600" // 按钮样式与禁用状态样式
                  >
                    {emailLoading ? '保存中...' : '保存邮箱配置'} {/* 根据加载状态切换按钮文字 */}
                  </button> {/* 结束保存按钮 */}
                </div> {/* 结束底部按钮布局容器 */}
              </form> {/* 结束邮箱配置表单容器 */}
            </section> /* 结束邮件配置分区布局 */
          )}
        </main> {/* 结束主体内容区域容器 */}
      </div> {/* 结束右侧内容区域外层容器 */}
    </div> // 结束整个管理后台页面最外层容器
  ); // 结束组件返回语句
}; // 结束 AdminDashboard 组件定义

export default AdminDashboard; // 导出管理后台组件，供路由与其他模块引用

