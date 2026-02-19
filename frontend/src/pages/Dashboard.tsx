import React, { useEffect, useState } from 'react'; // 引入 React 及状态、副作用 Hook
import { Bell, BookOpen, LogOut } from 'lucide-react'; // 引入图标组件美化界面
import { useNavigate } from 'react-router-dom'; // 引入路由导航 Hook
import {
  getCurrentUser, // 引入获取当前登录用户信息的 API 函数
  toggleSubscription, // 引入切换订阅开关状态的 API 函数
  getMyProfile, // 引入读取当前用户科研画像配置的 API 函数
  updateMyProfile, // 引入更新当前用户科研画像配置的 API 函数
  getMyDigests, // 引入获取当前用户历史推送记录列表的 API 函数
  getMyDigestTime, // 引入获取当前用户推送时间配置的 API 函数
  updateMyDigestTime, // 引入更新当前用户推送时间配置的 API 函数
  triggerTestDigest, // 引入触发一次测试推送的 API 函数
  getMyDigestDetail, // 引入获取指定每日摘要论文详情的 API 函数
} from '../api/auth'; // 从 auth API 模块集中导入用户相关接口封装函数

type ProfileState = { // 定义科研画像在前端展示使用的状态类型
  disciplines: string[]; // 用户研究方向学科标签列表
  keywords: string[]; // 用户关注的关键词列表
  journal_preferences: string[]; // 用户期刊偏好列表
}; // 结束 ProfileState 类型定义

type DigestItem = { // 定义历史推送记录在前端展示使用的类型
  id: number; // 每条推送记录的唯一标识 ID
  sent_at: string | null; // 推送发送时间的 ISO 字符串表示，可能为空
  paper_count: number; // 本次推送中包含的论文数量
}; // 结束 DigestItem 类型定义

type DigestPaper = { // 定义每日摘要中单篇论文在前端展示使用的类型
  id: number; // 论文主键 ID
  title: string; // 论文标题
  url: string; // 论文原文链接
  authors: string[]; // 论文作者列表
  abstract: string; // 原始摘要文本
  structured_abstract: string; // 结构化摘要文本
  source: string; // 论文来源，例如 arXiv
  published_date: string | null; // 发布时间的 ISO 字符串表示
}; // 结束 DigestPaper 类型定义

const Dashboard: React.FC = () => { // 定义用户工作台组件
  const [subscribed, setSubscribed] = useState<boolean>(true); // 定义订阅开关本地状态
  const [loading, setLoading] = useState<boolean>(false); // 定义异步操作加载状态
  const [profile, setProfile] = useState<ProfileState | null>(null); // 定义科研画像展示状态
  const [editingProfile, setEditingProfile] = useState<boolean>(false); // 定义是否处于科研画像编辑模式的状态
  const [editingDisciplines, setEditingDisciplines] = useState<string>(''); // 定义编辑态下研究方向输入框内容
  const [editingKeywords, setEditingKeywords] = useState<string>(''); // 定义编辑态下关注关键词输入框内容
  const [editingJournalPreferences, setEditingJournalPreferences] = useState<string>(''); // 定义编辑态下期刊偏好输入框内容
  const [savingProfile, setSavingProfile] = useState<boolean>(false); // 定义科研画像保存过程中的加载状态
  const [digests, setDigests] = useState<DigestItem[]>([]); // 定义历史推送记录列表状态
  const [digestTime, setDigestTime] = useState<string>(''); // 定义每日推送时间输入框内容，格式为 HH:MM
  const [savingDigestTime, setSavingDigestTime] = useState<boolean>(false); // 定义推送时间保存过程中的加载状态
  const [testingDigest, setTestingDigest] = useState<boolean>(false); // 定义测试推送按钮的加载状态
  const [testDigestMessage, setTestDigestMessage] = useState<string>(''); // 定义测试推送结果提示文案
  const [selectedDigestId, setSelectedDigestId] = useState<number | null>(null); // 定义当前选中的每日摘要记录 ID
  const [selectedDigestSentAt, setSelectedDigestSentAt] = useState<string | null>(null); // 定义当前选中摘要的发送时间
  const [digestPapers, setDigestPapers] = useState<DigestPaper[]>([]); // 定义当前选中摘要对应的论文列表
  const [loadingDigestDetail, setLoadingDigestDetail] = useState<boolean>(false); // 定义加载每日摘要详情的状态
  const [showAllDigests, setShowAllDigests] = useState<boolean>(false); // 定义历史推送列表是否展开为显示全部记录的状态
  const [digestDateFilter, setDigestDateFilter] = useState<string>(''); // 定义历史推送列表的日期筛选值，格式为 YYYY-MM-DD
  const navigate = useNavigate(); // 获取导航函数用于页面跳转

  useEffect(() => { // 使用 useEffect 在组件挂载后加载当前用户信息
    const fetchUserAndProfile = async () => { // 定义内部异步函数用于同时获取用户、科研画像与历史推送数据
      try { // 使用 try 块捕获请求异常
        const [user, profileData, digestResponse, digestTimeResponse] = await Promise.all([ // 并行调用多个接口以减少等待时间
          getCurrentUser(), // 获取当前登录用户信息
          getMyProfile(), // 获取当前登录用户的科研画像配置
          getMyDigests(), // 获取当前登录用户的历史推送记录列表
          getMyDigestTime(), // 获取当前登录用户的推送时间配置
        ]); // 结束 Promise.all 调用
        if (typeof user.subscription_enabled === 'boolean') { // 如果返回结果中包含订阅状态字段
          setSubscribed(user.subscription_enabled); // 使用后端状态初始化本地订阅开关
        } // 结束订阅字段判断
        setProfile({ // 使用获取到的科研画像数据初始化本地状态
          disciplines: profileData.disciplines || [], // 研究方向标签数组
          keywords: profileData.keywords || [], // 关注关键词数组
          journal_preferences: profileData.journal_preferences || [], // 期刊偏好数组
        }); // 结束 profile 状态更新
        if (digestResponse && Array.isArray(digestResponse.items)) { // 如果历史推送接口返回了 items 列表
          setDigests(digestResponse.items); // 使用后端返回的历史推送记录初始化本地状态
        } // 结束历史记录存在性判断
        if (digestTimeResponse && typeof digestTimeResponse.digest_time === 'string') { // 如果返回结果中包含推送时间字符串
          setDigestTime(digestTimeResponse.digest_time); // 使用后端配置初始化本地推送时间输入框
        } // 结束推送时间存在性判断
      } catch { // 捕获所有异常情况
        // 如果 token 失效或请求失败，则跳转回登录页面
        navigate('/login'); // 导航到登录页重新登录
      } // 结束 catch 块
    }; // 结束 fetchUserAndProfile 函数定义

    fetchUserAndProfile(); // 调用内部函数触发用户与科研画像信息加载
  }, [navigate]); // 当导航函数变化时重新执行（通常仅在初次渲染时执行一次）

  const handleLogout = () => { // 定义退出登录处理函数
    localStorage.removeItem('token'); // 从本地存储中移除访问令牌
    navigate('/login'); // 跳转到登录页面
  }; // 结束 handleLogout 函数定义

  const handleToggleSubscription = async () => { // 定义切换订阅开关的处理函数
    try { // 使用 try 块捕获请求异常
      setLoading(true); // 设置加载状态为 true，避免重复点击
      const updatedUser = await toggleSubscription(); // 调用后端接口切换订阅状态并获取最新用户数据
      if (typeof updatedUser.subscription_enabled === 'boolean') { // 确认返回结果中存在订阅字段
        setSubscribed(updatedUser.subscription_enabled); // 使用后端返回的订阅状态更新本地状态
      } // 结束字段存在性判断
    } catch { // 捕获所有异常情况
      // 在正式环境中可以添加错误提示，这里保持静默以简化逻辑
    } finally { // 无论成功失败都会执行
      setLoading(false); // 将加载状态重置为 false
    } // 结束 finally 块
  }; // 结束 handleToggleSubscription 函数定义

  const handleStartEditProfile = () => { // 定义进入科研画像编辑模式的处理函数
    if (profile) { // 如果当前已经存在科研画像配置
      setEditingDisciplines(profile.disciplines.join(', ')); // 使用现有研究方向数组预填充编辑输入框
      setEditingKeywords(profile.keywords.join(', ')); // 使用现有关注关键词数组预填充编辑输入框
      setEditingJournalPreferences(profile.journal_preferences.join(', ')); // 使用现有期刊偏好数组预填充编辑输入框
    } else { // 如果当前尚未配置科研画像
      setEditingDisciplines(''); // 将研究方向输入框重置为空
      setEditingKeywords(''); // 将关注关键词输入框重置为空
      setEditingJournalPreferences(''); // 将期刊偏好输入框重置为空
    } // 结束 profile 存在性判断
    setEditingProfile(true); // 将页面切换到科研画像编辑模式
  }; // 结束 handleStartEditProfile 函数定义

  const handleCancelEditProfile = () => { // 定义取消科研画像编辑的处理函数
    setEditingProfile(false); // 退出科研画像编辑模式
  }; // 结束 handleCancelEditProfile 函数定义

  const normalizeTagInput = (raw: string): string[] => { // 定义辅助函数用于将逗号分隔的字符串拆分为标签数组
    return raw // 从原始输入字符串开始处理
      .split(/[,，]/) // 按中英文逗号拆分为若干片段
      .map((item) => item.trim()) // 去除每个片段前后的空白字符
      .filter((item) => item.length > 0); // 过滤掉空字符串片段
  }; // 结束 normalizeTagInput 函数定义

  const handleSaveProfile = async (event: React.FormEvent) => { // 定义提交科研画像编辑表单的处理函数
    event.preventDefault(); // 阻止浏览器默认提交行为避免刷新页面
    try { // 使用 try 捕获异步请求中的异常
      setSavingProfile(true); // 将科研画像保存状态设置为进行中
      const payload = { // 构造提交给后端的科研画像更新请求体
        disciplines: normalizeTagInput(editingDisciplines), // 将研究方向输入框内容转换为标签数组
        keywords: normalizeTagInput(editingKeywords), // 将关注关键词输入框内容转换为标签数组
        journal_preferences: normalizeTagInput(editingJournalPreferences), // 将期刊偏好输入框内容转换为标签数组
      }; // 结束 payload 构造
      const updatedProfile = await updateMyProfile(payload); // 调用后端接口更新科研画像配置并获取更新后的数据
      setProfile({ // 使用后端返回的数据更新本地科研画像状态
        disciplines: updatedProfile.disciplines || [], // 更新研究方向标签数组，空值回退为空数组
        keywords: updatedProfile.keywords || [], // 更新关注关键词标签数组，空值回退为空数组
        journal_preferences: updatedProfile.journal_preferences || [], // 更新期刊偏好标签数组，空值回退为空数组
      }); // 结束 profile 状态更新
      setEditingProfile(false); // 在保存成功后退出编辑模式
    } catch { // 捕获所有异常情况
      // 目前保持静默失败处理，后续可接入全局错误提示组件
    } finally { // 无论成功失败都会执行
      setSavingProfile(false); // 将科研画像保存状态重置为未进行
    } // 结束 finally 块
  }; // 结束 handleSaveProfile 函数定义

  const handleSaveDigestTime = async () => { // 定义保存每日推送时间配置的处理函数
    try { // 使用 try 捕获异步请求中的异常
      setSavingDigestTime(true); // 将推送时间保存状态设置为进行中
      const trimmed = digestTime.trim(); // 去除输入字符串前后空白字符
      const finalValue = trimmed.length > 0 ? trimmed : null; // 将空字符串转换为 null 表示清除配置
      const response = await updateMyDigestTime(finalValue); // 调用后端接口更新推送时间配置
      if (response && typeof response.digest_time === 'string') { // 如果返回中包含有效的时间字符串
        setDigestTime(response.digest_time); // 使用后端最终存储的时间更新本地状态
      } else { // 如果后端返回为空表示清除配置
        setDigestTime(''); // 将本地推送时间输入框清空
      } // 结束返回值判断
    } catch { // 捕获所有异常情况
      // 此处暂不弹出错误提示，后续可以接入全局消息组件
    } finally { // 无论成功失败都会执行
      setSavingDigestTime(false); // 将推送时间保存状态重置为未进行
    } // 结束 finally 块
  }; // 结束 handleSaveDigestTime 函数定义

  const handleTestDigest = async () => { // 定义触发一次测试推送的处理函数
    try { // 使用 try 捕获异步请求中的异常
      setTestingDigest(true); // 将测试推送按钮状态设置为进行中
      setTestDigestMessage(''); // 在触发新一次测试前清空旧的提示信息
      const result = await triggerTestDigest(); // 调用后端接口触发一次测试推送
      if (result && typeof result.message === 'string') { // 如果后端返回了提示信息
        setTestDigestMessage(result.message); // 将提示信息展示在界面上
      } // 结束返回信息判断
      if (result && result.success) { // 如果后端标记测试推送成功
        const refreshed = await getMyDigests(); // 再次调用历史推送记录接口刷新列表
        if (refreshed && Array.isArray(refreshed.items)) { // 如果刷新结果中包含 items 列表
          setDigests(refreshed.items); // 使用最新的历史记录替换本地状态
        } // 结束刷新结果判断
      } // 结束成功状态判断
    } catch { // 捕获所有异常情况
      setTestDigestMessage('触发测试推送时出现异常，请稍后重试。'); // 在异常时给出统一错误提示
    } finally { // 无论成功失败都会执行
      setTestingDigest(false); // 将测试推送按钮状态重置为未进行
    } // 结束 finally 块
  }; // 结束 handleTestDigest 函数定义

  const handleOpenDigestDetail = async (digest: DigestItem) => { // 定义用户点击历史推送记录时加载详情的处理函数
    try { // 使用 try 捕获异步请求中的异常
      setSelectedDigestId(digest.id); // 记录当前选中的每日摘要 ID
      setSelectedDigestSentAt(digest.sent_at); // 记录当前选中的发送时间字符串
      setLoadingDigestDetail(true); // 将每日摘要详情加载状态设置为进行中
      setDigestPapers([]); // 在加载新数据前清空旧的论文列表
      const detail = await getMyDigestDetail(digest.id); // 调用后端接口获取指定每日摘要的论文详情
      if (detail && Array.isArray(detail.papers)) { // 如果返回结果中包含 papers 列表字段
        setDigestPapers(detail.papers); // 使用后端返回的论文列表更新本地状态
      } // 结束返回结构判断
    } catch { // 捕获所有异常情况
      // 目前保持静默失败处理，后续可接入全局错误提示组件
    } finally { // 无论成功失败都会执行
      setLoadingDigestDetail(false); // 将每日摘要详情加载状态重置为未进行
    } // 结束 finally 块
  }; // 结束 handleOpenDigestDetail 函数定义

  const handleCloseDigestDetail = () => { // 定义关闭每日摘要论文详情面板的处理函数
    setSelectedDigestId(null); // 清空当前选中的每日摘要 ID
    setSelectedDigestSentAt(null); // 清空当前选中的发送时间
    setDigestPapers([]); // 清空当前存储的论文列表
  }; // 结束 handleCloseDigestDetail 函数定义

  const filteredDigests = digestDateFilter // 根据当前日期筛选值对历史推送记录进行过滤
    ? digests.filter((item) => { // 当存在筛选日期时执行过滤逻辑
        if (!item.sent_at) { // 若某条记录缺少发送时间
          return false; // 直接过滤掉该条记录
        } // 结束 sent_at 判空处理
        return item.sent_at.startsWith(digestDateFilter); // 使用字符串前缀匹配判断记录日期是否与筛选日期一致
      }) // 结束过滤函数
    : digests; // 若未选择日期筛选则返回全部历史记录

  const visibleDigests = showAllDigests // 根据展开状态决定最终在界面上展示的历史推送记录列表
    ? filteredDigests // 展开状态下展示所有满足日期筛选条件的记录
    : filteredDigests.slice(0, 10); // 折叠状态下仅展示满足日期筛选条件的最近十条记录

  const hasProfile =
    profile !== null &&
    (profile.disciplines.length > 0 || profile.keywords.length > 0 || profile.journal_preferences.length > 0); // 预计算是否已经配置科研画像

  let profileContent: JSX.Element; // 定义变量用于承载科研画像模块主体内容

  if (editingProfile) { // 当处于科研画像编辑模式时渲染编辑表单
    profileContent = ( // 将科研画像编辑表单赋值给 profileContent 变量
      <form className="space-y-4" onSubmit={handleSaveProfile}> {/* 科研画像编辑表单容器 */}
        <div> {/* 研究方向输入区域容器 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">研究方向</label> {/* 研究方向标签文字 */}
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" // 文本域样式
            rows={2} // 设置文本域高度为两行
            placeholder="例如：机器学习, 计算机视觉, 自然语言处理" // 占位提示文字
            value={editingDisciplines} // 绑定研究方向编辑状态值
            onChange={(e) => setEditingDisciplines(e.target.value)} // 在输入变化时更新研究方向编辑状态
          />
          <p className="mt-1 text-xs text-gray-500">使用中文或英文逗号分隔多个研究方向。</p> {/* 研究方向输入说明文字 */}
        </div> {/* 结束研究方向输入区域容器 */}
        <div> {/* 关注关键词输入区域容器 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">关注关键词</label> {/* 关注关键词标签文字 */}
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" // 文本域样式
            rows={2} // 设置文本域高度为两行
            placeholder="例如：large language model, graph neural network" // 占位提示文字
            value={editingKeywords} // 绑定关注关键词编辑状态值
            onChange={(e) => setEditingKeywords(e.target.value)} // 在输入变化时更新关注关键词编辑状态
          />
          <p className="mt-1 text-xs text-gray-500">使用逗号分隔关键词，以提高匹配与推荐精度。</p> {/* 关注关键词输入说明文字 */}
        </div> {/* 结束关注关键词输入区域容器 */}
        <div> {/* 期刊偏好输入区域容器 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">期刊偏好</label> {/* 期刊偏好标签文字 */}
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" // 文本域样式
            rows={2} // 设置文本域高度为两行
            placeholder="例如：NeurIPS, ICML, Nature, Science" // 占位提示文字
            value={editingJournalPreferences} // 绑定期刊偏好编辑状态值
            onChange={(e) => setEditingJournalPreferences(e.target.value)} // 在输入变化时更新期刊偏好编辑状态
          />
          <p className="mt-1 text-xs text-gray-500">可以填写你偏好的期刊或会议，用逗号分隔。</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button" // 声明为普通按钮以便仅用于取消操作
            onClick={handleCancelEditProfile} // 点击时退出科研画像编辑模式
            className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit" // 声明为提交按钮以触发表单提交
            disabled={savingProfile} // 保存进行中时禁用按钮避免重复提交
            className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingProfile ? '保存中...' : '保存配置'}
          </button>
        </div>
      </form>
    ); // 结束编辑模式内容赋值
  } else if (hasProfile) { // 如果未处于编辑模式但已经配置过科研画像
    profileContent = ( // 将科研画像只读展示内容赋值给 profileContent 变量
      <div className="space-y-3 text-sm text-gray-700">
        {profile && profile.disciplines.length > 0 && (
          <div>
            <span className="text-gray-500 mr-2">研究方向：</span>
            <span>{profile.disciplines.join(', ')}</span>
          </div>
        )}
        {profile && profile.keywords.length > 0 && (
          <div>
            <span className="text-gray-500 mr-2">关注关键词：</span>
            <span>{profile.keywords.join(', ')}</span>
          </div>
        )}
        {profile && profile.journal_preferences.length > 0 && (
          <div>
            <span className="text-gray-500 mr-2">期刊偏好：</span>
            <span>{profile.journal_preferences.join(', ')}</span>
          </div>
        )}
      </div>
    ); // 结束已有科研画像展示内容赋值
  } else { // 既不在编辑模式且尚未配置科研画像时
    profileContent = ( // 将空状态提示内容赋值给 profileContent 变量
      <p className="text-sm text-gray-500">
        当前暂未配置研究方向，请点击右上角按钮完善科研画像，以便为你推荐更精准的论文。
      </p>
    ); // 结束空状态内容赋值
  } // 结束科研画像内容选择逻辑

  return ( // 返回组件渲染的 JSX 结构
    <div className="min-h-screen bg-gray-100"> {/* 整页浅色背景容器 */}
      <nav className="bg-white shadow-sm"> {/* 顶部导航栏容器 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* 导航栏宽度限制与内边距 */}
          <div className="flex justify-between h-16"> {/* 导航栏主内容布局 */}
            <div className="flex items-center"> {/* 左侧 Logo 与标题区域 */}
              <BookOpen className="h-8 w-8 text-indigo-600" /> {/* 平台 Logo 图标 */}
              <span className="ml-2 text-xl font-bold text-gray-900">科研信息聚合平台</span> {/* 平台名称文字 */}
            </div> {/* 结束左侧标题区域 */}
            <div className="flex items-center"> {/* 右侧操作按钮区域 */}
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700"> {/* 退出登录按钮 */}
                <LogOut className="h-6 w-6" /> {/* 退出图标 */}
              </button> {/* 结束退出按钮 */}
            </div> {/* 结束右侧操作按钮区域 */}
          </div> {/* 结束导航栏主内容布局 */}
        </div> {/* 结束导航栏宽度限制容器 */}
      </nav> {/* 结束顶部导航栏容器 */}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"> {/* 主体内容容器 */}
        <div className="px-4 py-6 sm:px-0"> {/* 主体内边距容器 */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6"> {/* 订阅开关卡片容器 */}
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between"> {/* 卡片内容布局 */}
              <div> {/* 左侧文字描述容器 */}
                <h3 className="text-lg leading-6 font-medium text-gray-900">每日论文摘要推送</h3> {/* 模块标题 */}
                <div className="mt-2 max-w-xl text-sm text-gray-500"> {/* 描述文本容器 */}
                  <p>开启后，我们将根据您的研究方向每日发送最新论文摘要到您的邮箱。</p> {/* 功能说明文本 */}
                  <div className="mt-4 space-y-2 text-xs text-gray-500"> {/* 推送时间与测试按钮整体布局容器，垂直堆叠元素并使用较小字号 */}
                    <div className="flex flex-wrap items-center gap-2"> {/* 时间输入与保存按钮所在的行容器，允许在窄屏下自动换行 */}
                      <span className="text-xs text-gray-500">推送时间</span> {/* 推送时间标签文字 */}
                      <input
                        type="time" // 使用浏览器原生时间选择器
                        value={digestTime} // 绑定当前推送时间输入框状态
                        onChange={(e) => setDigestTime(e.target.value)} // 在输入变化时更新推送时间状态
                        className="border-gray-300 rounded-md text-xs px-2 py-1 focus:border-indigo-500 focus:ring-indigo-500" // 时间输入框样式
                      />
                      <button
                        type="button" // 声明为普通按钮，避免触发表单提交
                        onClick={handleSaveDigestTime} // 点击时保存当前推送时间配置
                        disabled={savingDigestTime} // 保存进行中时禁用按钮
                        className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-60" // 保存按钮样式
                      >
                        {savingDigestTime ? '保存中...' : '保存时间'} {/* 根据保存状态展示不同按钮文案 */}
                      </button>
                    </div> {/* 结束时间输入与保存按钮所在的行容器 */}
                    <div className="flex flex-wrap items-center gap-2"> {/* 测试推送按钮与提示文字所在的行容器，允许内容在窄屏下换行 */}
                      <button
                        type="button" // 声明为普通按钮，仅负责触发测试推送
                        onClick={handleTestDigest} // 点击时调用测试推送处理函数
                        disabled={testingDigest} // 当测试进行中时禁用按钮
                        className="inline-flex items-center rounded-md border border-indigo-600 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60" // 测试推送按钮样式
                      >
                        {testingDigest ? '测试中...' : '测试推送'} {/* 根据测试状态展示不同按钮文案 */}
                      </button>
                      {testDigestMessage && ( // 如果存在测试推送提示信息
                        <span className="text-xs text-gray-500 break-words max-w-md"> {/* 测试结果提示文字样式，允许自动换行并限制最大宽度 */}
                          {testDigestMessage} {/* 展示测试推送返回的提示文案 */}
                        </span>
                      )}
                    </div> {/* 结束测试推送按钮与提示文字所在的行容器 */}
                  </div> {/* 结束推送时间与测试按钮整体布局容器 */}
                </div> {/* 结束描述文本容器 */}
              </div> {/* 结束左侧文字容器 */}
              <div className="flex items-center"> {/* 右侧开关按钮容器 */}
                <button
                  onClick={handleToggleSubscription} // 点击时调用切换订阅状态处理函数
                  disabled={loading} // 当请求进行中时禁用按钮
                  className={`${
                    subscribed ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60`} // 根据订阅状态和加载状态动态设置样式
                >
                  <span
                    aria-hidden="true" // 声明该元素对屏幕阅读器隐藏
                    className={`${
                      subscribed ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} // 圆点在开关中的位置与动画效果
                  />
                </button>
              </div> {/* 结束右侧开关按钮容器 */}
            </div> {/* 结束卡片内容布局 */}
          </div> {/* 结束订阅开关卡片容器 */}

          <div className="bg-white overflow-hidden shadow rounded-lg mb-6"> {/* 科研研究方向展示与配置卡片容器 */}
            <div className="px-4 py-5 sm:p-6"> {/* 卡片内容容器 */}
              <div className="flex items-center justify-between mb-3"> {/* 标题与操作按钮布局容器 */}
                <h3 className="text-lg leading-6 font-medium text-gray-900">我的科研研究方向</h3> {/* 模块标题 */}
                <button
                  type="button" // 声明按钮类型为普通按钮，避免在表单中触发提交
                  onClick={handleStartEditProfile} // 点击时进入科研画像编辑模式
                  className="text-sm text-indigo-600 hover:text-indigo-800" // 设置按钮的文字样式
                >
                  {hasProfile ? '编辑研究方向' : '立即配置'} {/* 根据是否已有科研画像展示不同按钮文案 */}
                </button>
              </div> {/* 结束标题与操作按钮布局容器 */}
              {profileContent} {/* 渲染根据当前状态选择好的科研画像内容 */}
            </div> {/* 结束卡片内容容器 */}
          </div> {/* 结束科研研究方向展示与配置卡片容器 */}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg"> {/* 历史推送列表容器，增加圆角以统一卡片风格 */}
            <div className="px-4 py-4 sm:px-6 border-b border-gray-200 space-y-3"> {/* 列表头部外层容器，使用垂直间距分隔标题与筛选区 */}
              <div className="flex items-center justify-between"> {/* 标题与右上角预留区域布局容器 */}
                <h3 className="text-lg leading-6 font-medium text-gray-900">历史推送</h3> {/* 列表标题 */}
                <p className="hidden sm:block text-xs text-gray-400">仅展示你账号的推送记录</p> {/* 在较大屏幕上展示的辅助说明文字 */}
              </div> {/* 结束标题行布局容器 */}
              <div className="flex flex-col gap-2 rounded-md bg-gray-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"> {/* 灰底筛选与折叠工具条容器 */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600"> {/* 左侧日期筛选区域容器 */}
                  <span className="font-medium text-gray-700">筛选日期</span> {/* 日期筛选标签文字 */}
                  <input
                    type="date" // 使用浏览器原生日期选择器
                    value={digestDateFilter} // 绑定当前历史推送日期筛选值
                    onChange={(e) => { // 监听日期选择变化事件
                      setDigestDateFilter(e.target.value); // 更新日期筛选状态
                      setShowAllDigests(false); // 在修改筛选日期时重置折叠状态为仅展示最近十条
                    }} // 结束日期变化处理函数
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 bg-white focus:border-indigo-500 focus:ring-indigo-500" // 日期输入框样式
                  />
                  {digestDateFilter && ( // 当存在已选日期时展示清空筛选按钮
                    <button
                      type="button" // 指定为普通按钮
                      onClick={() => { // 点击时清空日期筛选
                        setDigestDateFilter(''); // 将日期筛选状态重置为空字符串
                        setShowAllDigests(false); // 清空筛选时同样恢复为折叠状态
                      }} // 结束清空筛选处理函数
                      className="text-indigo-600 hover:text-indigo-800" // 清空筛选按钮样式
                    >
                      重置 {/* 清空筛选按钮文字 */}
                    </button>
                  )}
                  {!digestDateFilter && filteredDigests.length > 0 && ( /* 当未选择日期且存在记录时展示简要提示 */
                    <span className="text-gray-400">未选择日期时将展示最近的推送记录</span> /* 无日期筛选时的提示文案 */
                  )}
                </div> {/* 结束日期筛选区域容器 */}
                {filteredDigests.length > 4 && ( /* 当筛选后的历史推送记录数量超过四条时展示折叠控制区域 */
                  <div className="flex items-center space-x-2 text-xs text-gray-600"> {/* 折叠控制区域容器 */}
                    <span className="whitespace-nowrap"> {/* 使用不换行样式让统计信息整体显示 */}
                      共 {filteredDigests.length} 条，当前显示 {showAllDigests ? filteredDigests.length : Math.min(10, filteredDigests.length)} 条 {/* 展示总记录数与当前可见数量 */}
                    </span>
                    <button
                      type="button" // 指定为普通按钮，避免表单提交
                      onClick={() => setShowAllDigests(!showAllDigests)} // 点击时切换历史推送列表展开或折叠状态
                      className="text-indigo-600 hover:text-indigo-800 font-medium" // 折叠按钮文字样式
                    >
                      {showAllDigests ? '收起，仅显示最近 10 条' : '展开全部记录'} {/* 根据当前状态展示不同提示文案 */}
                    </button>
                  </div> // 结束折叠控制区域容器
                )} 
              </div> {/* 结束筛选与折叠工具条容器 */}
            </div> {/* 结束列表头部外层容器 */}
            <ul className="divide-y divide-gray-200"> {/* 列表主体容器，使用分隔线分隔每一项 */}
              {digests.length === 0 && ( // 当当前用户尚无历史推送记录时展示空状态
                <li> {/* 空状态列表单项容器 */}
                  <div className="px-4 py-4 sm:px-6 text-sm text-gray-500"> {/* 空状态说明文字容器 */}
                    当前还没有任何推送记录，配置好研究方向并开启订阅后，系统会在每天的推送时间为你生成科研日报。 {/* 空状态说明文字 */}
                  </div> {/* 结束空状态说明文字容器 */}
                </li>
              )}
              {visibleDigests.map((item) => ( // 遍历当前需要展示的历史推送记录渲染列表
                <li key={item.id}> {/* 列表单项容器 */}
                  <button
                    type="button" // 声明为普通按钮，用于触发详情面板打开
                    onClick={() => handleOpenDigestDetail(item)} // 点击时加载并展示该次推送的论文详情
                    className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50" // 将整行渲染为可点击区域并设置样式
                  > {/* 单项内容按钮容器 */}
                    <div className="flex items-center justify-between"> {/* 单项第一行布局 */}
                      <p className="text-sm font-medium text-indigo-600 truncate"> {/* 推送标题文本 */}
                        近期科研日报（{item.paper_count} 篇论文） {/* 使用论文数量构造标题 */}
                      </p> {/* 结束标题文本 */}
                      <div className="ml-2 flex-shrink-0 flex"> {/* 状态标签容器 */}
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"> {/* 已发送标签样式 */}
                          已发送 {/* 状态文字 */}
                        </p> {/* 结束状态标签 */}
                      </div> {/* 结束状态标签容器 */}
                    </div> {/* 结束单项第一行布局 */}
                    <div className="mt-2 sm:flex sm:justify-between"> {/* 单项第二行布局 */}
                      <div className="sm:flex"> {/* 描述区域容器 */}
                        <p className="flex items-center text-sm text-gray-500"> {/* 描述文本 */}
                          发送时间：{item.sent_at || '时间未知'} {/* 展示该次推送的发送时间 */}
                        </p> {/* 结束描述文本 */}
                      </div> {/* 结束描述区域容器 */}
                    </div> {/* 结束单项第二行布局 */}
                  </button> {/* 结束单项内容按钮容器 */}
                </li>
              ))} {/* 结束历史推送记录映射渲染 */}
            </ul> {/* 结束列表主体容器 */}
          </div> {/* 结束历史推送列表容器 */}
        </div> {/* 结束主体内边距容器 */}
        {selectedDigestId !== null && ( // 当存在选中的每日摘要 ID 时展示论文详情侧边面板
          <div className="fixed inset-0 bg-black bg-opacity-25 flex justify-end z-40"> {/* 覆盖全屏的半透明背景与右侧抽屉容器 */}
            <div className="w-full max-w-2xl bg-white shadow-xl h-full overflow-y-auto"> {/* 右侧论文详情抽屉容器 */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"> {/* 抽屉头部布局容器 */}
                <div> {/* 抽屉标题区域容器 */}
                  <h2 className="text-lg font-medium text-gray-900">本次推送包含的论文列表</h2> {/* 抽屉标题文本 */}
                  <p className="mt-1 text-xs text-gray-500">
                    发送时间：{selectedDigestSentAt || '时间未知'} {/* 抽屉副标题显示发送时间 */}
                  </p>
                </div> {/* 结束标题区域容器 */}
                <button
                  type="button" // 声明为普通按钮，仅用于关闭抽屉
                  onClick={handleCloseDigestDetail} // 点击时关闭论文详情抽屉
                  className="text-sm text-gray-500 hover:text-gray-700" // 关闭按钮样式
                >
                  关闭 {/* 关闭按钮文字 */}
                </button>
              </div> {/* 结束抽屉头部布局容器 */}
              <div className="px-6 py-4"> {/* 抽屉内容容器 */}
                {loadingDigestDetail && ( // 当正在加载每日摘要详情时展示加载提示
                  <p className="text-sm text-gray-500">正在加载论文列表...</p> // 加载状态提示文本
                )}
                {!loadingDigestDetail && digestPapers.length === 0 && ( // 当加载完成但论文列表为空时展示空状态
                  <p className="text-sm text-gray-500">
                    本次推送未记录任何论文，可能是抓取或发送过程出现异常。 {/* 空论文列表说明文本 */}
                  </p>
                )}
                {!loadingDigestDetail && digestPapers.length > 0 && ( // 当存在论文列表且不在加载中时展示论文列表
                  <ul className="space-y-4"> {/* 论文列表容器 */}
                    {digestPapers.map((paper) => ( // 遍历每一篇论文渲染列表项
                      <li key={paper.id} className="border-b border-gray-200 pb-3 last:border-b-0"> {/* 单篇论文容器 */}
                        <h3 className="text-sm font-medium text-indigo-700">
                          <a href={paper.url} target="_blank" rel="noreferrer" className="hover:underline">
                            {paper.title || '未命名论文'} {/* 展示论文标题，空值时显示占位文本 */}
                          </a>
                        </h3>
                        {paper.authors && paper.authors.length > 0 && ( // 当存在作者列表时展示作者信息
                          <p className="mt-1 text-xs text-gray-500">
                            作者：{paper.authors.join(', ')} {/* 将作者列表拼接为逗号分隔字符串 */}
                          </p>
                        )}
                        {paper.published_date && ( // 当存在发布时间时展示发布时间
                          <p className="mt-1 text-xs text-gray-500">
                            发布时间：{paper.published_date} {/* 展示发布时间字符串 */}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-700">
                          {paper.structured_abstract || paper.abstract || '暂无摘要内容'} {/* 优先展示结构化摘要，其次展示原始摘要 */}
                        </p>
                      </li>
                    ))} {/* 结束论文列表映射渲染 */}
                  </ul>
                )}
              </div> {/* 结束抽屉内容容器 */}
            </div> {/* 结束右侧论文详情抽屉容器 */}
          </div>
        )} {/* 结束每日摘要论文详情侧边面板 */}
      </main> {/* 结束主体内容容器 */}
    </div> // 结束页面最外层容器
  ); // 结束组件返回语句
}; // 结束 Dashboard 组件定义

export default Dashboard; // 导出 Dashboard 组件供路由使用
