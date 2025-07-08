// 颜色池
const CHART_COLORS = [
    'rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(99, 255, 132, 0.7)', 'rgba(192, 75, 192, 0.7)', 'rgba(206, 255, 86, 0.7)',
    'rgba(102, 153, 255, 0.7)'
];

// 默认数据
const DEFAULT_DATA = {
    kpis: {
        ytd: { value: '0', yoy: '0.00%', target_progress: 0 },
        mtd: { value: '0', yoy: '0.00%', target_progress: 0 },
        w20: { value: '0', wow: '0.00%', yoy: '0.00%' }
    },
    chart: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
        datasets: []
    }
};

const mockData = {
    random: function(min, max) {
        try {
            return Math.random() * (max - min) + min;
        } catch (error) {
            console.error('Error generating random number:', error);
            return 0;
        }
    },

    platformFactors: {
        'all': 1, 'meituan': 0.4, 'jd': 0.25, 'ele': 0.2, 'duodian': 0.1, 'taoxianda': 0.05
    },
    
    formatNumber: function(num) {
        try {
            if (typeof num !== 'number' || isNaN(num)) return '0';
            return Math.round(num).toLocaleString('en-US');
        } catch (error) {
            console.error('Error formatting number:', error);
            return '0';
        }
    },

    formatPercentage: function(num) {
        try {
            if (typeof num !== 'number' || isNaN(num)) return '0.00%';
            return `${num.toFixed(2)}%`;
        } catch (error) {
            console.error('Error formatting percentage:', error);
            return '0.00%';
        }
    },

    formatPercentagePoint: function(num) {
        try {
            if (typeof num !== 'number' || isNaN(num)) return '0.00pp';
            return `${num.toFixed(2)}pp`;
        } catch (error) {
            console.error('Error formatting percentage point:', error);
            return '0.00pp';
        }
    },

    getWeekLabels: function(count = 7, baseDate = null) {
        try {
            // 固定返回2025-W23到2025-W28的6周数据
            const fixedWeeks = ['2025-W23', '2025-W24', '2025-W25', '2025-W26', '2025-W27', '2025-W28'];

            if (count === 6) {
                return fixedWeeks;
            } else if (count === 7) {
                return ['2025-W22', ...fixedWeeks];
            } else {
                // 对于其他数量，从W23开始生成
                return Array.from({ length: count }, (_, i) => `2025-W${23 + i}`);
            }
        } catch (error) {
            console.error('Error generating week labels:', error);
            return Array.from({ length: count }, (_, i) => `2025-W${23 + i}`);
        }
    },

    getTransactionData: function(platform = 'all', weekNum, baseDate = null) {
        try {
            const factor = this.platformFactors[platform] || 1;
            const kpis = {
                ytd: {
                    value: this.formatNumber(134682586 * factor),
                    yoy: this.formatPercentage(this.random(20, 25)),
                    target_progress: this.random(85, 95).toFixed(2)
                },
                mtd: {
                    value: this.formatNumber(20199157 * factor),
                    yoy: this.formatPercentage(this.random(15, 20)),
                    mom: this.formatPercentage(this.random(3, 8))
                },
                week: {
                    value: this.formatNumber(this.random(11000000, 13000000) * factor),
                    yoy: this.formatPercentage(this.random(15, 25)),
                    wow: this.formatPercentage(this.random(3, 8))
                }
            };
            
            const chartData = {
                labels: this.getWeekLabels(6, baseDate),
                datasets: [
                    {
                        type: 'bar',
                        label: 'GMV',
                        yAxisID: 'y',
                        data: Array.from({ length: 6 }, () => this.random(12, 18) * 1000000 * factor),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    },
                    {
                        type: 'line',
                        label: '年同比',
                        yAxisID: 'y1',
                        data: Array.from({ length: 6 }, () => this.random(20, 50)),
                        borderColor: 'rgba(75, 192, 192, 0.7)',
                        tension: 0.3
                    },
                    {
                        type: 'line',
                        label: '周环比',
                        yAxisID: 'y1',
                        data: Array.from({ length: 6 }, () => this.random(-15, 15)),
                        borderColor: 'rgba(255, 159, 64, 0.7)',
                        tension: 0.3
                    }
                ]
            };
            
            return { kpis, chart: chartData };
        } catch (error) {
            console.error('Error generating transaction data:', error);
            return DEFAULT_DATA;
        }
    },

    getMultiDimensionData: function(platform, dimension, baseDate = null) {
        const factor = this.platformFactors[platform] || 1;
        const dimensions = {
            subBrand: ['Salty', 'Quaker', 'B&C'],
            productLine: ['品线1', '品线2', '品线3', '品线4', '品线5', '品线6'],
            channelType: ['O2O渠道', 'B2C渠道', '社区团购'],
            region: ['华东大区', '华南大区', '华北大区', '西南大区']
        };
        const items = dimensions[dimension];
        const weeks = 8;

        // 生成透视表数据结构 - 周次作为行，维度项目作为列
        const tableDataRows = [];

        // 生成多级表头结构
        const topHeader = [{ title: '周次', rowspan: 2 }];
        items.forEach(item => {
            topHeader.push({ title: item, colspan: 4 });
        });

        const bottomHeader = [];
        items.forEach(() => {
            ['GMV', 'GMV占比', '年同比%', '周环比%'].forEach(metricName => {
                bottomHeader.push({ title: metricName });
            });
        });

        const tableHeaders = { top: topHeader, bottom: bottomHeader };

        // 为每个周次生成一行数据 - 使用固定的8周数据，从2025-W21到2025-W28
        const fixedWeeks = ['2025-W21', '2025-W22', '2025-W23', '2025-W24', '2025-W25', '2025-W26', '2025-W27', '2025-W28'];

        for (let i = 0; i < weeks; i++) {
            const weekKey = fixedWeeks[i] || `2025-W${21 + i}`;
            const rowData = { week: weekKey };

            // 计算该周所有维度项目的总GMV用于占比计算
            const itemGmvs = {};
            let totalGmvThisWeek = 0;

            items.forEach(item => {
                const gmv = this.random(5000000, 20000000) * factor * (1 + (i - weeks / 2) * 0.05);
                itemGmvs[item] = gmv;
                totalGmvThisWeek += gmv;
            });

            // 为每个维度项目生成指标数据
            items.forEach(item => {
                const gmv = itemGmvs[item];
                const share = (gmv / totalGmvThisWeek) * 100;
                const yoy = this.random(-15, 60);
                const wow = this.random(-20, 30);

                rowData[`${item}_gmv`] = this.formatNumber(gmv);
                rowData[`${item}_share`] = this.formatPercentage(share);
                rowData[`${item}_yoy`] = this.formatPercentage(yoy);
                rowData[`${item}_wow`] = this.formatPercentage(wow);
            });

            tableDataRows.push(rowData);
        }

        // DataTables列定义
        const dtColumns = [
            {
                data: 'week',
                title: '周次',
                width: '80px',
                className: 'text-center fw-bold'
            }
        ];

        items.forEach(item => {
            dtColumns.push({
                data: `${item}_gmv`,
                title: 'GMV',
                className: 'text-right',
                width: '120px'
            });
            dtColumns.push({
                data: `${item}_share`,
                title: 'GMV占比',
                className: 'text-right',
                width: '80px'
            });
            dtColumns.push({
                data: `${item}_yoy`,
                title: '年同比%',
                className: 'text-right',
                width: '80px'
            });
            dtColumns.push({
                data: `${item}_wow`,
                title: '周环比%',
                className: 'text-right',
                width: '80px'
            });
        });

        // 生成饼图数据（按维度项目汇总所有周的GMV）
        const pieData = items.map(item => {
            return tableDataRows.reduce((sum, row) => {
                const value = parseFloat(row[`${item}_gmv`].replace(/,/g, ''));
                return sum + value;
            }, 0);
        });
        const pieChartData = {
            labels: items,
            datasets: [{ data: pieData, backgroundColor: CHART_COLORS }]
        };

        // 生成组合图数据（趋势线）
        const comboChartLabels = tableDataRows.map(row => row.week);

        const comboChartDatasets = items.map((item, index) => ({
            type: 'line',
            label: item,
            yAxisID: 'y',
            data: tableDataRows.map(row => parseFloat(row[`${item}_gmv`].replace(/,/g, ''))),
            borderColor: CHART_COLORS[index % CHART_COLORS.length],
            backgroundColor: 'transparent',
            tension: 0.3
        }));
        const comboChartData = { labels: comboChartLabels, datasets: comboChartDatasets };

        return {
            pie: pieChartData,
            combo: comboChartData,
            table: {
                headers: tableHeaders,
                rows: tableDataRows,
                columns: dtColumns
            }
        };
    },

    getData: function(domain, platform, weekNum, baseDate = null) {
        const factor = this.platformFactors[platform] || 1;
        const metrics = [
            { name: `${domain}指标A`, value: this.formatNumber(this.random(100,200)*factor), yoy: this.random(-10, 10), wow: this.random(-5,5) },
            { name: `${domain}指标B`, value: this.formatNumber(this.random(200,300)*factor), yoy: this.random(-10, 10), wow: this.random(-5,5) },
            { name: `${domain}指标C`, value: this.formatNumber(this.random(300,400)*factor), yoy: this.random(-10, 10), wow: this.random(-5,5) },
            { name: `${domain}指标D`, value: this.formatNumber(this.random(400,500)*factor), yoy: this.random(-10, 10), wow: this.random(-5,5) }
        ];
        
        const tableHeaders = ['日期', `${domain}维度X`, `${domain}维度Y`, '数值A', '数值B'];
        const tableRows = Array.from({length: 7}, (_, i) => {
            return [
                dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
                `X${this.random(1,10).toFixed(0)}`, `Y${this.random(1,10).toFixed(0)}`,
                this.random(100,1000).toFixed(2), this.random(100,1000).toFixed(2)
            ];
        });

        const chartData = {
            labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
            datasets: [{
                label: `${domain}趋势`,
                data: Array.from({length: 7}, () => this.random(100, 500) * factor),
                borderColor: '#1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                fill: true
            }]
        };

        return {
            title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} 数据分析`,
            metrics: metrics,
            chart: chartData,
            table: { headers: tableHeaders, rows: tableRows }
        };
    },

    /**
     * 获取活动数据
     * @param {string} platform - 平台类型
     * @returns {object} 活动数据对象
     */
    getActivityData: function(platform, baseDate = null) {
        const factor = this.platformFactors[platform] || 1;

        // 生成活动指标数据
        const activityMetrics = {
            // 活动GMV
            activityGmv: {
                value: this.formatNumber(this.random(50000000, 200000000) * factor),
                yoy: this.formatPercentage(this.random(-10, 40))
            },
            // 活动GMV占全量GMV比例
            activityGmvRatio: {
                value: this.formatPercentage(this.random(15, 35)),
                yoy: this.formatPercentagePoint(this.random(-5, 15))
            },
            // 核销金额
            verificationAmount: {
                value: this.formatNumber(this.random(30000000, 150000000) * factor),
                yoy: this.formatPercentage(this.random(-15, 50)),
                progress: this.formatPercentage(this.random(60, 95)) // 核销进度
            },
            // 活动费比
            activityCostRatio: {
                value: this.formatPercentage(this.random(8, 18)),
                yoy: this.formatPercentagePoint(this.random(-3, 8))
            },
            // 全量费比
            totalCostRatio: {
                value: this.formatPercentage(this.random(12, 25)),
                yoy: this.formatPercentagePoint(this.random(-2, 6))
            }
        };

        // 生成趋势图数据 - 6周
        const weeks = 6;
        const trendLabels = [];
        const activityGmvData = [];
        const verificationData = [];
        const activityCostRatioData = [];
        const totalCostRatioData = [];
        const activityGmvRatioData = [];

        for (let i = weeks - 1; i >= 0; i--) {
            const weekNum = dayjs().subtract(i, 'weeks').isoWeek();
            trendLabels.push(`W${weekNum}`);

            activityGmvData.push(this.random(40000000, 180000000) * factor);
            verificationData.push(this.random(25000000, 140000000) * factor);
            activityCostRatioData.push(this.random(8, 18));
            totalCostRatioData.push(this.random(12, 25));
            activityGmvRatioData.push(this.random(15, 35));
        }

        const trendChartData = {
            labels: trendLabels,
            datasets: [
                {
                    label: '活动GMV',
                    data: activityGmvData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y',
                    fill: false
                },
                {
                    label: '核销金额',
                    data: verificationData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y',
                    fill: false
                },
                {
                    label: '活动费比',
                    data: activityCostRatioData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y1',
                    fill: false
                },
                {
                    label: '全量费比',
                    data: totalCostRatioData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y1',
                    fill: false
                },
                {
                    label: '活动GMV占比',
                    data: activityGmvRatioData,
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    tension: 0.1,
                    yAxisID: 'y1',
                    fill: false,
                    hidden: true,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        };

        // 生成详细数据表格
        const tableData = [];
        for (let i = weeks - 1; i >= 0; i--) {
            const weekNum = dayjs().subtract(i, 'weeks').isoWeek();
            const weekKey = `W${weekNum}`;

            tableData.push({
                week: weekKey,
                activityGmv: this.formatNumber(this.random(40000000, 180000000) * factor),
                activityRatio: this.formatPercentage(this.random(15, 35)),
                verification: this.formatNumber(this.random(25000000, 140000000) * factor),
                activityCost: this.formatPercentage(this.random(8, 18)),
                totalCost: this.formatPercentage(this.random(12, 25))
            });
        }

        return {
            metrics: activityMetrics,
            chart: trendChartData,
            table: {
                columns: [
                    { title: '周次', data: 'week' },
                    { title: '活动GMV', data: 'activityGmv' },
                    { title: '活动占比', data: 'activityRatio' },
                    { title: '核销金额', data: 'verification' },
                    { title: '活动费比', data: 'activityCost' },
                    { title: '全量费比', data: 'totalCost' }
                ],
                data: tableData
            }
        };
    },

    /**
     * 获取供给数据
     * @param {string} platform - 平台类型
     * @returns {object} 供给数据对象
     */
    getSupplyData: function(platform, baseDate = null) {
        const factor = this.platformFactors[platform] || 1;

        const supplyMetrics = {
            // 铺货店铺数
            storeCount: {
                value: this.formatNumber(this.random(5000, 15000) * factor),
                wow: this.formatPercentage(this.random(-5, 12))
            },
            // 店铺动销率
            storeSalesRate: {
                value: this.formatPercentage(this.random(70, 90)),
                wow: this.formatPercentagePoint(this.random(-3, 5)) // 使用pp格式
            },
            // 店均在售SKU数
            avgSkuPerStore: {
                value: this.formatNumber(this.random(15, 45)),
                wow: this.formatPercentage(this.random(-8, 15))
            },
            // 店铺渗透率
            skuStorePenetration: {
                value: this.formatPercentage(this.random(60, 85)),
                wow: this.formatPercentagePoint(this.random(-2, 4)) // 使用pp格式
            },
            // SKU售罄率
            skuSelloutRate: {
                value: this.formatPercentage(this.random(5, 20)),
                wow: this.formatPercentagePoint(this.random(-1, 3)) // 使用pp格式
            }
        };

        return { metrics: supplyMetrics };
    },

    /**
     * 获取用户数据
     * @param {string} platform - 平台类型
     * @returns {object} 用户数据对象
     */
    getUserData: function(platform) {
        const factor = this.platformFactors[platform] || 1;

        const userMetrics = {
            // 新客数量
            newUserCount: {
                value: this.formatNumber(this.random(50000, 200000) * factor),
                ratio: this.formatPercentage(this.random(25, 45)),
                wow: this.formatPercentage(this.random(-8, 20))
            },
            // 新客销售额
            newUserSales: {
                value: this.formatNumber(this.random(30000000, 120000000) * factor),
                ratio: this.formatPercentage(this.random(20, 40)),
                wow: this.formatPercentage(this.random(-10, 25))
            },
            // 新客客单价
            newUserAvgOrder: {
                value: this.formatNumber(this.random(150, 800)),
                wow: this.formatPercentage(this.random(-5, 15))
            },
            // 老客数量
            oldUserCount: {
                value: this.formatNumber(this.random(100000, 400000) * factor),
                ratio: this.formatPercentage(this.random(55, 75)),
                wow: this.formatPercentage(this.random(-5, 12))
            },
            // 老客销售额
            oldUserSales: {
                value: this.formatNumber(this.random(60000000, 250000000) * factor),
                ratio: this.formatPercentage(this.random(60, 80)),
                wow: this.formatPercentage(this.random(-8, 18))
            },
            // 老客客单价
            oldUserAvgOrder: {
                value: this.formatNumber(this.random(200, 1200)),
                wow: this.formatPercentage(this.random(-3, 12))
            }
        };

        // 生成近6周的图表数据
        const chartData = this.generateUserChartData(factor);

        // 生成明细表格数据
        const detailData = this.generateUserDetailData(factor, chartData.distribution.labels);

        return {
            metrics: userMetrics,
            charts: chartData,
            detail: detailData
        };
    },

    /**
     * 生成用户图表数据
     * @param {number} factor - 平台因子
     * @returns {object} 图表数据对象
     */
    generateUserChartData: function(factor) {
        // 生成近6周的日期标签（2025-W1格式）
        const weeks = [];
        const today = new Date();
        const currentYear = today.getFullYear();

        for (let i = 5; i >= 0; i--) {
            const weekDate = new Date(today);
            weekDate.setDate(today.getDate() - i * 7);

            // 计算周数
            const startOfYear = new Date(weekDate.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((weekDate - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
            const weekNumber = Math.ceil(dayOfYear / 7);

            const weekStr = `${weekDate.getFullYear()}-W${weekNumber}`;
            weeks.push(weekStr);
        }

        // 生成新老客分布数据（堆叠柱状图）
        const newUserCounts = [];
        const oldUserCounts = [];
        const newUserCountsWoW = []; // 新客周环比
        const oldUserCountsWoW = []; // 老客周环比
        const totalSales = [];
        const avgOrderValues = [];

        weeks.forEach((week, index) => {
            const newUsers = Math.floor(this.random(30000, 80000) * factor);
            const oldUsers = Math.floor(this.random(60000, 150000) * factor);
            const sales = Math.floor(this.random(50000000, 200000000) * factor);
            const avgOrder = Math.floor(this.random(200, 800));

            // 计算周环比（第一周没有环比）
            let newUserWoW = 0;
            let oldUserWoW = 0;
            if (index > 0) {
                newUserWoW = ((newUsers - newUserCounts[index - 1]) / newUserCounts[index - 1] * 100);
                oldUserWoW = ((oldUsers - oldUserCounts[index - 1]) / oldUserCounts[index - 1] * 100);
            }

            newUserCounts.push(newUsers);
            oldUserCounts.push(oldUsers);
            newUserCountsWoW.push(newUserWoW);
            oldUserCountsWoW.push(oldUserWoW);
            totalSales.push(sales);
            avgOrderValues.push(avgOrder);
        });

        // 计算占比数据
        const newUserRatios = [];
        const oldUserRatios = [];

        newUserCounts.forEach((newUsers, index) => {
            const total = newUsers + oldUserCounts[index];
            newUserRatios.push((newUsers / total * 100).toFixed(1));
            oldUserRatios.push((oldUserCounts[index] / total * 100).toFixed(1));
        });

        return {
            // 新老客分布图表数据
            distribution: {
                labels: weeks,
                // 数值模式数据
                valueData: [
                    {
                        label: '新客数量',
                        data: newUserCounts,
                        backgroundColor: '#ff9f7f',
                        borderColor: '#ff9f7f',
                        borderWidth: 1,
                        stack: 'users',
                        weekOverWeek: newUserCountsWoW
                    },
                    {
                        label: '老客数量',
                        data: oldUserCounts,
                        backgroundColor: '#87ceeb',
                        borderColor: '#87ceeb',
                        borderWidth: 1,
                        stack: 'users',
                        weekOverWeek: oldUserCountsWoW
                    }
                ],
                // 占比模式数据
                ratioData: [
                    {
                        label: '新客占比',
                        data: newUserRatios,
                        backgroundColor: '#ff9f7f',
                        borderColor: '#ff9f7f',
                        borderWidth: 1,
                        stack: 'users'
                    },
                    {
                        label: '老客占比',
                        data: oldUserRatios,
                        backgroundColor: '#87ceeb',
                        borderColor: '#87ceeb',
                        borderWidth: 1,
                        stack: 'users'
                    }
                ]
            },
            // 新老客表现图表数据
            performance: {
                labels: weeks,
                datasets: {
                    sales: {
                        data: (function() {
                            const self = this;
                            const newSalesData = newUserCounts.map((count, i) => Math.floor(count * self.random(300, 600)));
                            const oldSalesData = oldUserCounts.map((count, i) => Math.floor(count * self.random(400, 800)));

                            // 计算销售额周环比
                            const newSalesWoW = [];
                            const oldSalesWoW = [];

                            newSalesData.forEach((value, index) => {
                                if (index > 0) {
                                    newSalesWoW.push(((value - newSalesData[index - 1]) / newSalesData[index - 1] * 100));
                                } else {
                                    newSalesWoW.push(0);
                                }
                            });

                            oldSalesData.forEach((value, index) => {
                                if (index > 0) {
                                    oldSalesWoW.push(((value - oldSalesData[index - 1]) / oldSalesData[index - 1] * 100));
                                } else {
                                    oldSalesWoW.push(0);
                                }
                            });

                            return [
                                {
                                    label: '新客销售额',
                                    data: newSalesData,
                                    backgroundColor: '#ff9f7f',
                                    borderColor: '#ff6b35',
                                    borderWidth: 2,
                                    type: 'line',
                                    yAxisID: 'y1',
                                    tension: 0.4,
                                    weekOverWeek: newSalesWoW
                                },
                                {
                                    label: '老客销售额',
                                    data: oldSalesData,
                                    backgroundColor: '#87ceeb',
                                    borderColor: '#4682b4',
                                    borderWidth: 2,
                                    type: 'line',
                                    yAxisID: 'y1',
                                    tension: 0.4,
                                    weekOverWeek: oldSalesWoW
                                }
                            ];
                        }).call(this),
                        // 销售额占比计算函数
                        getRatios: function() {
                            const newSales = this.data[0].data;
                            const oldSales = this.data[1].data;
                            const newRatios = [];
                            const oldRatios = [];

                            newSales.forEach((newVal, index) => {
                                const total = newVal + oldSales[index];
                                newRatios.push((newVal / total * 100).toFixed(1));
                                oldRatios.push((oldSales[index] / total * 100).toFixed(1));
                            });

                            return { newRatios, oldRatios };
                        }
                    },
                    avgOrder: {
                        data: (function() {
                            const self = this;
                            const newAvgOrderData = avgOrderValues.map(val => Math.floor(val * self.random(0.8, 1.2)));
                            const oldAvgOrderData = avgOrderValues.map(val => Math.floor(val * self.random(1.2, 1.8)));

                            // 计算客单价周环比
                            const newAvgOrderWoW = [];
                            const oldAvgOrderWoW = [];

                            newAvgOrderData.forEach((value, index) => {
                                if (index > 0) {
                                    newAvgOrderWoW.push(((value - newAvgOrderData[index - 1]) / newAvgOrderData[index - 1] * 100));
                                } else {
                                    newAvgOrderWoW.push(0);
                                }
                            });

                            oldAvgOrderData.forEach((value, index) => {
                                if (index > 0) {
                                    oldAvgOrderWoW.push(((value - oldAvgOrderData[index - 1]) / oldAvgOrderData[index - 1] * 100));
                                } else {
                                    oldAvgOrderWoW.push(0);
                                }
                            });

                            return [
                                {
                                    label: '新客客单价',
                                    data: newAvgOrderData,
                                    backgroundColor: '#ff9f7f',
                                    borderColor: '#ff6b35',
                                    borderWidth: 2,
                                    type: 'line',
                                    yAxisID: 'y1',
                                    tension: 0.4,
                                    weekOverWeek: newAvgOrderWoW
                                },
                                {
                                    label: '老客客单价',
                                    data: oldAvgOrderData,
                                    backgroundColor: '#87ceeb',
                                    borderColor: '#4682b4',
                                    borderWidth: 2,
                                    type: 'line',
                                    yAxisID: 'y1',
                                    tension: 0.4,
                                    weekOverWeek: oldAvgOrderWoW
                                }
                            ];
                        }).call(this)
                    }
                }
            }
        };
    },

    /**
     * 生成用户明细表格数据
     * @param {number} factor - 平台因子
     * @param {Array} weeks - 周标签数组
     * @returns {Array} 明细表格数据
     */
    generateUserDetailData: function(factor, weeks) {
        const detailData = [];

        // 安全检查
        if (!weeks || !Array.isArray(weeks)) {
            console.error('weeks parameter is not a valid array:', weeks);
            return [];
        }

        weeks.forEach((week, index) => {
            // 生成各项指标数据
            const newUserCount = Math.floor(this.random(30000, 80000) * factor);
            const oldUserCount = Math.floor(this.random(60000, 150000) * factor);
            const newUserSales = Math.floor(newUserCount * this.random(300, 600));
            const oldUserSales = Math.floor(oldUserCount * this.random(400, 800));
            const newUserAvgOrder = Math.floor(this.random(150, 800));
            const oldUserAvgOrder = Math.floor(this.random(200, 1200));

            // 计算占比
            const totalUsers = newUserCount + oldUserCount;
            const totalSales = newUserSales + oldUserSales;
            const newUserCountRatio = (newUserCount / totalUsers * 100).toFixed(1);
            const oldUserCountRatio = (oldUserCount / totalUsers * 100).toFixed(1);
            const newUserSalesRatio = (newUserSales / totalSales * 100).toFixed(1);
            const oldUserSalesRatio = (oldUserSales / totalSales * 100).toFixed(1);

            // 计算周环比（第一周没有环比）
            let newUserCountWow = '-';
            let oldUserCountWow = '-';
            let newUserSalesWow = '-';
            let oldUserSalesWow = '-';
            let newUserAvgOrderWow = '-';
            let oldUserAvgOrderWow = '-';

            if (index > 0) {
                const prevData = detailData[index - 1];
                newUserCountWow = this.formatPercentage(((newUserCount - prevData.newUserCount) / prevData.newUserCount * 100));
                oldUserCountWow = this.formatPercentage(((oldUserCount - prevData.oldUserCount) / prevData.oldUserCount * 100));
                newUserSalesWow = this.formatPercentage(((newUserSales - prevData.newUserSales) / prevData.newUserSales * 100));
                oldUserSalesWow = this.formatPercentage(((oldUserSales - prevData.oldUserSales) / prevData.oldUserSales * 100));
                newUserAvgOrderWow = this.formatPercentage(((newUserAvgOrder - prevData.newUserAvgOrder) / prevData.newUserAvgOrder * 100));
                oldUserAvgOrderWow = this.formatPercentage(((oldUserAvgOrder - prevData.oldUserAvgOrder) / prevData.oldUserAvgOrder * 100));
            }

            detailData.push({
                week: week,
                newUserCount: newUserCount,
                newUserCountRatio: newUserCountRatio + '%',
                newUserCountWow: newUserCountWow,
                oldUserCount: oldUserCount,
                oldUserCountRatio: oldUserCountRatio + '%',
                oldUserCountWow: oldUserCountWow,
                newUserSales: newUserSales,
                newUserSalesRatio: newUserSalesRatio + '%',
                newUserSalesWow: newUserSalesWow,
                oldUserSales: oldUserSales,
                oldUserSalesRatio: oldUserSalesRatio + '%',
                oldUserSalesWow: oldUserSalesWow,
                newUserAvgOrder: newUserAvgOrder,
                newUserAvgOrderWow: newUserAvgOrderWow,
                oldUserAvgOrder: oldUserAvgOrder,
                oldUserAvgOrderWow: oldUserAvgOrderWow
            });
        });

        return detailData;
    },

    /**
     * 获取RTB数据
     * @param {string} platform - 平台类型
     * @returns {object} RTB数据对象
     */
    getRtbData: function(platform, baseDate = null) {
        const factor = this.platformFactors[platform] || 1;

        const rtbMetrics = {
            // 消耗
            consumption: {
                value: this.formatNumber(this.random(500000, 2000000) * factor),
                wow: this.formatPercentage(this.random(-15, 25))
            },
            // T+1引导成交金额
            guidedSales: {
                value: this.formatNumber(this.random(2000000, 8000000) * factor),
                wow: this.formatPercentage(this.random(-10, 30))
            },
            // ROI
            roi: {
                value: Math.round(this.random(2, 6)).toString(),
                wow: this.formatPercentage(this.random(-20, 40))
            },
            // 消耗进度
            consumptionProgress: {
                value: this.formatPercentage(this.random(60, 95)),
                wow: this.formatPercentage(this.random(-5, 15))
            }
        };

        return { metrics: rtbMetrics };
    }
};