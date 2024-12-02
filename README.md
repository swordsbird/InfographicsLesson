# 信息图表解释系统

这是一个基于 Vue 3 的信息图表解释系统，提供图表理解、图像分割和图表设计功能。

## 功能特点

- 图表理解：自动检测和标注图表中的关键元素
- 图像分割：支持交互式图像分割
- 图表设计：提供图表设计和编辑功能
- 支持多种交互方式：点击、拖拽、框选等
- 实时预览和编辑

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge 等）

## 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd <project-folder>
```

2. 安装依赖
```bash
cd frontend
npm install
```

3. 创建环境配置文件
```bash
cp .env.example .env
```

## 运行项目

### 开发环境
```bash
npm run dev
```
访问 `http://localhost:3000`

### 生产环境
```bash
npm run build
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── components/         # 组件文件
│   │   ├── UnderstandView.vue
│   │   ├── SegmentView.vue
│   │   └── DesignView.vue
│   ├── utils/             # 工具函数
│   │   ├── elements.js
│   │   ├── llm.js
│   │   └── samAPI.js
│   ├── assets/            # 静态资源
│   └── App.vue            # 主应用组件
├── public/                # 公共资源
│   ├── json/             # JSON 配置文件
│   ├── svg/              # SVG 图标
│   └── pictogram/        # 图标素材
└── package.json
```

## 使用说明

1. 图表理解功能
   - 上传或选择图表
   - 点击"检测元素"进行自动检测
   - 可手动调整标注框位置和大小
   - 生成图表解释

2. 图像分割功能
   - 选择图片
   - 使用点击或框选模式进行交互
   - 确认分割结果
   - 查看和管理分割图片

3. 图表设计功能
   - 选择 JSON 配置文件
   - 选择图表类型
   - 添加图标和装饰元素
   - 调整样式和布局

## 常见问题

1. 如果遇到依赖安装失败：
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

2. 如果出现跨域问题，检查 `.env` 文件中的 API 配置是否正确

3. 如果图片上传失败，检查文件大小是否超过 5MB 限制

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

[MIT License](LICENSE)

## 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。