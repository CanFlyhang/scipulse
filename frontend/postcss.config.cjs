// 导出 PostCSS 配置对象                                                   
module.exports = { // 使用 CommonJS 导出语法，供 Vite 与 PostCSS 读取配置     
  plugins: { // 定义需要启用的 PostCSS 插件列表                              
    tailwindcss: {}, // 启用 Tailwind CSS 插件，按 tailwind.config.js 生成样式
    autoprefixer: {}, // 启用 Autoprefixer 自动补全浏览器前缀                 
  }, // 结束 plugins 配置对象                                                
}; // 结束 module.exports 配置对象                                           

