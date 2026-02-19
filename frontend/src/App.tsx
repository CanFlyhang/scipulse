import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // 引入路由组件与重定向工具
import Login from './pages/Login'; // 引入登录页面组件
import Register from './pages/Register'; // 引入注册页面组件
import Dashboard from './pages/Dashboard'; // 引入用户订阅工作台组件
import AdminDashboard from './pages/AdminDashboard'; // 引入管理后台页面组件

// 定义应用根组件，负责配置前端路由结构
function App() {
  return ( // 返回应用的路由配置结构
    <Router> {/* 包裹整个应用的路由容器 */}
      <Routes> {/* 定义所有路由映射关系 */}
        <Route path="/login" element={<Login />} /> {/* 登录页路由配置 */}
        <Route path="/register" element={<Register />} /> {/* 注册页路由配置 */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* 普通用户订阅工作台路由 */}
        <Route path="/admin" element={<AdminDashboard />} /> {/* 运营管理后台路由入口 */}
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* 根路径重定向到登录页 */}
      </Routes> {/* 结束路由映射定义 */}
    </Router> // 结束路由容器
  ); // 结束组件返回语句
} // 结束 App 根组件定义

export default App; // 导出根组件供 main.tsx 挂载渲染
