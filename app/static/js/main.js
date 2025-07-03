// 配置Vue的分隔符，避免与Flask的Jinja2模板冲突
Vue.options.delimiters = ['[[', ']]'];

// 创建Vue应用
new Vue({
    el: '#app',
    data: {
        // 日期相关
        dateRange: [],
        pickerOptions: {
            shortcuts: [{
                text: '最近一周',
                onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                    picker.$emit('pick', [start, end]);
                }
            }, {
                text: '最近一个月',
                onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                    picker.$emit('pick', [start, end]);
                }
            }, {
                text: '最近三个月',
                onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                    picker.$emit('pick', [start, end]);
                }
            }]
        },
        
        // 当前选中的数据领域和平台
        activeDomain: 'transaction',
        activePlatform: 'all',
        
        // 指标卡数据
        cards: [],
        
        // 图表和表格数据
        chartData: {},
        tableData: [],
        
        // 图表实例
        chart: null
    },
    
    // 生命周期钩子
    mounted() {
        // 初始化日期范围（默认近6周）
        const end = new Date();
        const start = new Date();
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 42); // 6周 = 42天
        this.dateRange = [start, end];
        
        // 初始化数据
        this.fetchData();
        
        // 初始化图表
        this.$nextTick(() => {
            this.initChart();
        });
        
        // 监听窗口大小变化，重新调整图表大小
        window.addEventListener('resize', this.resizeChart);
    },
    
    beforeDestroy() {
        // 移除事件监听
        window.removeEventListener('resize', this.resizeChart);
        
        // 销毁图表实例
        if (this.chart) {
            this.chart.dispose();
        }
    },
    
    methods: {
        // 获取数据
        fetchData() {
            // 显示加载动画
            const loading = this.$loading({
                lock: true,
                text: '加载中...',
                spinner: 'el-icon-loading',
                background: 'rgba(255, 255, 255, 0.7)'
            });
            
            // 构建请求参数
            let params = {
                domain: this.activeDomain,
                platform: this.activePlatform
            };
            
            // 添加日期范围参数（如果有选择）
            if (this.dateRange && this.dateRange.length === 2) {
                params.start_date = this.formatDate(this.dateRange[0]);
                params.end_date = this.formatDate(this.dateRange[1]);
            }
            
            // 发送API请求
            axios.get('/api/data', { params })
                .then(response => {
                    const data = response.data;
                    
                    // 更新指标卡数据
                    this.cards = data.cards.map(card => {
                        return {
                            ...card,
                            platformCode: this.getPlatformCode(card.platform)
                        };
                    });
                    
                    // 更新图表数据
                    this.chartData = data.chart_data;
                    
                    // 更新表格数据
                    this.tableData = data.table_data;
                    
                    // 更新图表
                    this.$nextTick(() => {
                        this.updateChart();
                    });
                    
                    // 关闭加载动画
                    loading.close();
                })
                .catch(error => {
                    console.error('获取数据失败:', error);
                    this.$message.error('获取数据失败，请稍后重试');
                    loading.close();
                });
        },
        
        // 初始化图表
        initChart() {
            // 初始化ECharts实例
            this.chart = echarts.init(this.$refs.chartContainer);
            
            // 更新图表
            this.updateChart();
        },
        
        // 更新图表
        updateChart() {
            if (!this.chart || !this.chartData || !this.chartData.weeks) return;
            
            let option = {
                title: {
                    text: this.getChartTitle(),
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: this.getChartLegend(),
                    bottom: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: this.chartData.weeks
                },
                yAxis: {
                    type: 'value'
                },
                series: this.getChartSeries()
            };
            
            // 设置图表配置
            this.chart.setOption(option);
        },
        
        // 重新调整图表大小
        resizeChart() {
            if (this.chart) {
                this.chart.resize();
            }
        },
        
        // 处理数据领域变更
        handleDomainChange(domain) {
            this.activeDomain = domain;
            this.fetchData();
        },
        
        // 处理平台变更
        handlePlatformChange(platform) {
            this.activePlatform = platform;
            this.fetchData();
        },
        
        // 处理平台Tab点击
        handlePlatformTabClick(tab) {
            this.activePlatform = tab.name;
            this.fetchData();
        },
        
        // 处理日期变更
        handleDateChange() {
            this.fetchData();
        },
        
        // 导出数据
        exportData() {
            this.$message({
                message: '数据导出功能即将上线',
                type: 'info'
            });
        },
        
        // 格式化数字
        formatNumber(value) {
            if (value === undefined || value === null) return '-';
            
            // 如果是整数，不显示小数点
            if (Number.isInteger(value)) {
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            
            // 否则保留两位小数
            return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
        
        // 格式化百分比
        formatPercent(value) {
            if (value === undefined || value === null) return '-';
            return (value * 100).toFixed(2) + '%';
        },
        
        // 百分比格式化函数（用于进度条）
        percentFormat(percentage) {
            return percentage.toFixed(0) + '%';
        },
        
        // 获取数值类名（用于环比、同比的颜色显示）
        getValueClass(value) {
            if (value === undefined || value === null) return '';
            return value > 0 ? 'increase' : (value < 0 ? 'decrease' : '');
        },
        
        // 格式化日期
        formatDate(date) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        
        // 获取平台代码
        getPlatformCode(platformName) {
            const platformMap = {
                '全平台': 'all',
                '京东到家': 'jd',
                '饿了么': 'ele',
                '美团': 'meituan',
                '多点': 'duodian',
                '淘鲜达': 'taoxianda'
            };
            return platformMap[platformName] || 'all';
        },
        
        // 获取图表标题
        getChartTitle() {
            const domainTitles = {
                'transaction': 'GMV趋势',
                'activity': '活动GMV趋势',
                'rtb': 'RTB指标趋势',
                'supply': '供给指标趋势',
                'user': '用户指标趋势'
            };
            return domainTitles[this.activeDomain] || '数据趋势';
        },
        
        // 获取图表图例
        getChartLegend() {
            const domainLegends = {
                'transaction': ['GMV'],
                'activity': ['活动GMV', '核销金额'],
                'rtb': ['曝光数', '点击数', '订单量'],
                'supply': ['GMV', '铺货门店数'],
                'user': ['新客数量', '老客数量']
            };
            return domainLegends[this.activeDomain] || [];
        },
        
        // 获取图表系列数据
        getChartSeries() {
            if (!this.chartData) return [];
            
            switch (this.activeDomain) {
                case 'transaction':
                    return [{
                        name: 'GMV',
                        type: 'line',
                        data: this.chartData.gmv,
                        smooth: true,
                        areaStyle: {
                            opacity: 0.3
                        }
                    }];
                    
                case 'activity':
                    return [{
                        name: '活动GMV',
                        type: 'line',
                        data: this.chartData.activity_gmv,
                        smooth: true
                    }];
                    
                case 'rtb':
                    return [{
                        name: '曝光数',
                        type: 'line',
                        data: this.chartData.impressions,
                        smooth: true
                    }, {
                        name: '点击数',
                        type: 'line',
                        data: this.chartData.clicks,
                        smooth: true
                    }];
                    
                case 'supply':
                    return [{
                        name: 'GMV',
                        type: 'line',
                        data: this.chartData.gmv,
                        smooth: true
                    }, {
                        name: '铺货门店数',
                        type: 'line',
                        data: this.chartData.stores,
                        smooth: true,
                        yAxisIndex: 1
                    }];
                    
                case 'user':
                    return [{
                        name: '新客数量',
                        type: 'line',
                        data: this.chartData.new_users,
                        smooth: true,
                        stack: '用户'
                    }, {
                        name: '老客数量',
                        type: 'line',
                        data: this.chartData.old_users,
                        smooth: true,
                        stack: '用户'
                    }];
                    
                default:
                    return [];
            }
        }
    }
}); 