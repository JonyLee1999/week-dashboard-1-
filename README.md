# 周维度数据看板

一个基于Python Flask和Bootstrap的周维度Web应用数据看板，用于展示和分析不同平台的数据指标。

## 功能特性

### 1. 页面布局
- 自上而下的垂直布局
- 包含筛选器、指标卡区域、Tab导航和数据展示区域
- 响应式设计，适配不同屏幕尺寸

### 2. 日期筛选器
- 位于页面顶部
- 包含日期范围选择器，默认周维度选择
- 默认显示近6周数据

### 3. 数据领域侧边栏
- 位于页面左侧
- 纵向排列5个主要数据领域：
  - 交易
  - 活动
  - RTB
  - 供给
  - 用户
- Tab样式突出当前选中项

### 4. 指标卡片区域
- 横向排列6个指标卡片，等宽分布
- 每个指标卡对应不同平台：全平台、京东到家、饿了么、美团、多点、淘鲜达
- 每张指标卡的数据随着数据领域的切换而变动
- 同比和环比数据带颜色标识（上涨绿色，下跌红色）
- 达成率使用进度条样式

### 5. 平台切换Tab
- 横向排列6个平台选项
- 可切换显示不同平台数据

### 6. 数据展示区域
- 左图右表的样式排版
- 图表使用Chart.js绘制趋势图
- 表格支持排序和筛选
- 数据支持导出功能

### 7. 交互特性
- Tab切换时平滑过渡
- 数据更新时有加载动画
- 响应式设计

## 数据指标

### 交易数据
- GMV、GMV占比、GMV环比增长率、GMV同比增长率
- GMV YTD达成率

### 活动数据
- 活动GMV（值，占比，环比，同比）
- 活动GMV占全量GMV比例（值，环比，同比）
- 核销金额（值，占比，环比，同比）
- 活动费比（值，环比，同比）
- 全量费比（值，环比，同比）

### RTB数据
- 曝光数、点击数、点击率
- 订单量、订单转化率、引导GMV
- 预算金额、消耗金额、预算消耗进度
- 千次曝光成本、点击成本

### 供给数据
- GMV（值，占比，环比）
- 铺货门店数（值，环比）
- 店铺渗透率（值，环比）
- 店铺动销率（值，环比）
- 店均在售SKU数（值，环比）
- SKU售罄率（值，环比）
- 售罄SKU预估损失（值，环比）

### 用户数据
- 新客数量（值，占比，环比）
- 新客销售额（值，占比，环比）
- 新客客单价（值，环比）
- 老客数量（值，占比，环比）
- 老客销售额（值，占比，环比）
- 老客客单价（值，环比）

## 技术栈

### 后端
- Python 3.x
- Flask 2.0.1
- Flask-CORS 3.0.10
- Pandas 1.3.3
- NumPy 1.21.2

### 前端
- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5.1.3
- Chart.js
- Font Awesome 6.0.0

## 安装和运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd week-dashboard
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 运行应用
```bash
python app.py
```

### 4. 访问应用
打开浏览器访问：http://localhost:5000

## 项目结构

```
week-dashboard/
├── app/
│   ├── __init__.py          # Flask应用初始化
│   ├── routes.py            # 路由和API接口
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css    # 样式文件
│   │   ├── js/
│   │   │   └── app.js       # 前端JavaScript
│   │   └── img/             # 图片资源
│   └── templates/
│       └── index.html       # 主页面模板
├── data/                    # 数据文件目录
├── app.py                   # 应用入口文件
├── requirements.txt         # Python依赖
└── README.md               # 项目说明
```

## API接口

### 获取数据
- **URL**: `/api/data`
- **方法**: GET
- **参数**:
  - `domain`: 数据领域 (transaction/activity/rtb/supply/user)
  - `platform`: 平台 (all/jd/ele/meituan/duodian/taoxianda)
  - `start_date`: 开始日期 (YYYY-MM-DD)
  - `end_date`: 结束日期 (YYYY-MM-DD)
- **返回**: JSON格式的数据

## 开发说明

### 添加新的数据领域
1. 在 `app/routes.py` 中添加新的数据生成函数
2. 在 `app/static/js/app.js` 中添加对应的卡片生成函数
3. 在HTML模板中添加新的Tab按钮
4. 在CSS中添加相应的样式

### 自定义样式
- 主要样式文件：`app/static/css/style.css`
- 使用Bootstrap 5作为基础框架
- 支持响应式设计

### 数据源配置
- 当前使用模拟数据
- 可以修改 `app/routes.py` 中的数据生成函数来连接真实数据源
- 支持数据库、API、文件等多种数据源

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。 