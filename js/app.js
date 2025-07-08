/* eslint-disable no-undef */

// 初始化 dayjs
dayjs.locale('zh-cn');
dayjs.extend(window.dayjs_plugin_isoWeek);

// 全局变量
let currentDomain = 'transaction';
let currentPlatform = 'all';
let currentDimension = 'subBrand';
let weekPicker = null;
let gmvTrendChart;
let dimensionPieChart, dimensionComboChart, dimensionDataTable;
let trendChart;
let dataTable;
let supplyTrendChart;
let rtbTrendChart;
let currentWeek = dayjs().isoWeek();
let currentYear = dayjs().year();
let charts = {};
let currentDataTable = null;
let currentSupplyMetric = 'storeCount';
let currentRtbMetric = 'rtbConsumption';

// DOM 元素缓存
const domElements = {};

/**
 * 缓存DOM元素，避免重复查询
 */
function cacheDOMElements() {
    domElements.loadingOverlay = document.getElementById('loadingOverlay');

    // 领域 & 平台
    domElements.domainTabs = document.getElementById('domainTabs');
    domElements.platformTabs = document.getElementById('platformTabs');
    
    // 日期选择
    domElements.weekPickerInput = document.getElementById('weekPicker');
    
    // 内容容器
    domElements.transactionContent = document.getElementById('transaction-content');
    domElements.genericContent = document.getElementById('generic-content');

    // 交易视图指标卡
    domElements.gmvYTD = document.getElementById('gmvYTD');
    domElements.gmvYOY = document.getElementById('gmvYOY');
    domElements.gmvTarget = document.getElementById('gmvTarget');
    domElements.gmvTargetBar = document.getElementById('gmvTargetBar');
    
    domElements.gmvMTD = document.getElementById('gmvMTD');
    domElements.gmvMTDYOY = document.getElementById('gmvMTDYOY');
    domElements.gmvMTDTarget = document.getElementById('gmvMTDTarget');
    domElements.gmvMTDTargetBar = document.getElementById('gmvMTDTargetBar');

    domElements.gmvWeekTitle = document.getElementById('gmvWeekTitle');
    domElements.gmvWeek = document.getElementById('gmvWeek');
    domElements.gmvWeekYOY = document.getElementById('gmvWeekYOY');
    domElements.gmvWOW = document.getElementById('gmvWOW');

    // 交易视图图表
    domElements.gmvTrendChartCanvas = document.getElementById('gmvTrendChart');
    
    // 多维表现
    domElements.dimensionTypeSelector = document.getElementById('dimensionTypeSelector');
    domElements.dimensionPieChartCanvas = document.getElementById('dimensionPieChart');
    domElements.dimensionComboChartCanvas = document.getElementById('dimensionComboChart');
    domElements.dimensionDataTable = document.getElementById('dimensionDataTable');

    // 商品表现
    domElements.productDimensionSelector = document.getElementById('productDimensionSelector');
    domElements.productDataTable = document.getElementById('productDataTable');

    // 通用视图
    domElements.genericMetricCards = document.getElementById('genericMetricCards');
    domElements.trendChartCanvas = document.getElementById('trendChart');
    domElements.chartTypeToggle = document.getElementById('chartTypeToggle');
    domElements.dataTable = document.getElementById('dataTable');
}


/**
 * 显示加载动画
 */
function showLoading() {
    if (domElements.loadingOverlay) {
        domElements.loadingOverlay.style.display = 'flex';
    }
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
    if (domElements.loadingOverlay) {
        domElements.loadingOverlay.style.display = 'none';
    }
}

/**
 * 安全地更新DOM内容
 * @param {HTMLElement} element - 目标元素
 * @param {string} content - 要设置的内容
 * @param {string} [defaultValue='-'] - 如果内容为空则使用的默认值
 */
function safeUpdate(element, content, defaultValue = '-') {
    if (element) {
        element.textContent = content || defaultValue;
    }
}


/**
 * 更新交易视图的指标卡
 * @param {object} kpis - 关键绩效指标数据
 * @param {string} weekText - 当前周的文本描述
 */
function updateTransactionKPIs(kpis, weekText) {
    if (!kpis) return;

    // GMV YTD - 年同比 + 达成率
    safeUpdate(document.getElementById('gmvYTD'), `${kpis.ytd.value}`);
    safeUpdate(document.getElementById('gmvYOY'), `年同比 ${getChangeSymbol(kpis.ytd.yoy)} ${kpis.ytd.yoy}`);
    safeUpdate(document.getElementById('gmvTargetPercent'), `达成率 ${kpis.ytd.target_progress}%`);

    // 为达成率添加颜色样式
    const targetElement = document.getElementById('gmvTargetPercent');
    if (targetElement) {
        const progress = parseFloat(kpis.ytd.target_progress);
        targetElement.className = 'metric-change';
        if (progress >= 80) {
            targetElement.classList.add('positive');
        } else if (progress >= 60) {
            targetElement.classList.add('neutral');
        } else {
            targetElement.classList.add('negative');
        }
    }

    // GMV MTD - 年同比 + 月环比
    safeUpdate(document.getElementById('gmvMTD'), `${kpis.mtd.value}`);
    safeUpdate(document.getElementById('gmvMTDYOY'), `年同比 ${getChangeSymbol(kpis.mtd.yoy)} ${kpis.mtd.yoy}`);
    safeUpdate(document.getElementById('gmvMTDMOM'), `月环比 ${getChangeSymbol(kpis.mtd.mom)} ${kpis.mtd.mom}`);

    // GMV Week - 年同比 + 周环比
    safeUpdate(document.getElementById('gmvWeekTitle'), weekText || 'GMV Week');
    safeUpdate(document.getElementById('gmvWeek'), `${kpis.week.value}`);
    safeUpdate(document.getElementById('gmvWeekYOY'), `年同比 ${getChangeSymbol(kpis.week.yoy)} ${kpis.week.yoy}`);
    safeUpdate(document.getElementById('gmvWOW'), `周环比 ${getChangeSymbol(kpis.week.wow)} ${kpis.week.wow}`);

    // 更新颜色样式
    updateTransactionChangeColors();
}

/**
 * 根据百分比值获取变化符号
 * @param {string} percentage - 百分比字符串或百分点字符串
 * @returns {string} 变化符号
 */
function getChangeSymbol(percentage) {
    const value = parseFloat(percentage.replace(/[%p]/g, ''));
    return value >= 0 ? '▲' : '▼';
}

/**
 * 更新所有指标卡的变化颜色（红跌绿涨）
 * 绿色: 正增长（上涨）- #27ae60
 * 红色: 负增长（下跌）- #e74c3c
 */
function updateAllChangeColors() {
    // 更新所有模块的颜色
    document.querySelectorAll('.metric-change').forEach(element => {
        const text = element.textContent;
        if (text.includes('▲')) {
            // 上涨 = 绿色
            element.className = 'metric-change positive';
        } else if (text.includes('▼')) {
            // 下跌 = 红色
            element.className = 'metric-change negative';
        } else if (text.includes('%') || text.includes('pp')) {
            // 处理百分比数据和百分点数据
            const value = parseFloat(text.replace(/[^-\d.]/g, ''));
            if (!isNaN(value)) {
                if (value >= 0) {
                    // 正增长 = 绿色
                    element.className = 'metric-change positive';
                } else {
                    // 负增长 = 红色
                    element.className = 'metric-change negative';
                }
            }
        }
    });
}

/**
 * 更新交易数据变化颜色
 */
function updateTransactionChangeColors() {
    updateAllChangeColors();
}

/**
 * 更新通用视图的指标卡
 * @param {Array<object>} metrics - 指标数组
 */
function updateGenericKPIs(metrics) {
    if (!domElements.genericMetricCards) return;
    
    domElements.genericMetricCards.innerHTML = '';
    if (!metrics || metrics.length === 0) {
        domElements.genericMetricCards.innerHTML = '<p>无可用数据</p>';
        return;
    }

    metrics.forEach(metric => {
        const signYOY = metric.yoy >= 0 ? 'positive' : 'negative';
        const iconYOY = metric.yoy >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const signWOW = metric.wow >= 0 ? 'positive' : 'negative';
        const iconWOW = metric.wow >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

        const cardHTML = `
            <div class="col">
                <div class="card metric-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${metric.name}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <p class="card-text fs-4 fw-bold mb-0">${metric.value}</p>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <span class="me-3">
                                    同比: <span class="metric-value ${signYOY}"><i class="fas ${iconYOY}"></i> ${Math.abs(metric.yoy)}%</span>
                                </span>
                                <span>
                                    环比: <span class="metric-value ${signWOW}"><i class="fas ${iconWOW}"></i> ${Math.abs(metric.wow)}%</span>
                                </span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>`;
        domElements.genericMetricCards.innerHTML += cardHTML;
    });
}


/**
 * 切换视图
 * @param {string} domain - 要显示的数据领域
 */
function switchView(domain) {
    currentDomain = domain;
    if (domain === 'transaction') {
        if (domElements.transactionContent) domElements.transactionContent.style.display = 'block';
        if (domElements.genericContent) domElements.genericContent.style.display = 'none';
    } else {
        if (domElements.transactionContent) domElements.transactionContent.style.display = 'none';
        if (domElements.genericContent) domElements.genericContent.style.display = 'block';
    }
    const selectedWeek = weekPicker.selectedDates[0];
    if (selectedWeek) {
        loadDataForWeek(selectedWeek);
    }
}

/**
 * 更新图表
 * @param {Chart} chartInstance - Chart.js 实例
 * @param {Array<string>} labels - 图表标签
 * @param {Array<object>} datasets - 图表数据集
 */
function updateChart(chartInstance, labels, datasets) {
    if (!chartInstance) return;
    chartInstance.data.labels = labels;
    chartInstance.data.datasets = datasets;
    chartInstance.update();
}


/**
 * 创建或更新GMV趋势组合图
 * @param {object} chartData - 图表数据
 */
function createOrUpdateGmvTrendChart(chartData) {
    if (!domElements.gmvTrendChartCanvas) return;
    const ctx = domElements.gmvTrendChartCanvas.getContext('2d');
    
    if (gmvTrendChart) {
        updateChart(gmvTrendChart, chartData.labels, chartData.datasets);
    } else {
        gmvTrendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'GMV'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '增长率 (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }
}

/**
 * 创建或更新维度饼图
 * @param {object} chartData - 饼图数据
 */
function createOrUpdateDimensionPieChart(chartData) {
    if (!domElements.dimensionPieChartCanvas) return;
    const ctx = domElements.dimensionPieChartCanvas.getContext('2d');
    if (dimensionPieChart) {
        updateChart(dimensionPieChart, chartData.labels, chartData.datasets);
    } else {
        dimensionPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = (context.parsed / total * 100).toFixed(2) + '%';
                                    label += percentage;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * 创建或更新维度组合图
 * @param {object} chartData - 图表数据
 */
function createOrUpdateDimensionComboChart(chartData) {
    if (!domElements.dimensionComboChartCanvas) return;
    const ctx = domElements.dimensionComboChartCanvas.getContext('2d');
    if (dimensionComboChart) {
        updateChart(dimensionComboChart, chartData.labels, chartData.datasets);
    } else {
        dimensionComboChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 100,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            autoSkipPadding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'GMV',
                            font: {
                                size: 11
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1) + 'M';
                                }
                                return value;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 2,
                        hoverRadius: 4
                    },
                    line: {
                        borderWidth: 1.5
                    }
                },
                layout: {
                    padding: {
                        left: 5,
                        right: 20,
                        top: 20,
                        bottom: 5
                    }
                }
            }
        });
    }
}

/**
 * 更新多维表现表格
 * @param {object} tableData - 表格数据
 */
function updateDimensionTable(tableData) {
    if (!tableData) {
        console.warn("updateDimensionTable received no data!");
        return;
    }

    try {
        // 获取表格元素
        const table = document.getElementById('dimensionDataTable');
        if (!table) {
            console.warn("Table element not found!");
            return;
        }

        // 清空表格
        table.innerHTML = '';

        // 创建简单的测试表格来验证固定表头功能
        const selectedWeek = weekPicker && weekPicker.selectedDates.length > 0 ? weekPicker.selectedDates[0] : null;
        createSimpleTestTable(table, selectedWeek);

        return; // 使用简单测试表格

        // 隐藏加载提示，显示表格
        const loadingDiv = document.getElementById('table-loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        table.style.display = 'table';

        // 使用简单的DataTable初始化
        const result = $(table).DataTable({
            pageLength: 8,
            lengthMenu: [8, 15, 25],
            scrollX: true,
            scrollY: '300px',
            scrollCollapse: true,
            responsive: false,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/2.0.2/i18n/zh.json'
            },
            destroy: true,
            order: [[0, 'desc']]
        });

        console.log('DataTable initialized successfully');
        return result;
    } catch (error) {
        console.error('Error in updateDimensionTable:', error);
        showError('更新维度表格失败，请检查控制台获取详细信息');
        return null;
    }
}

// 创建动态表格根据维度类型
function createSimpleTestTable(table, baseDate = null) {
    // 获取当前维度类型
    const dimensionSelector = document.getElementById('dimensionTypeSelector');
    const currentDimension = dimensionSelector ? dimensionSelector.value : 'subBrand';

    // 根据维度类型定义数据
    const dimensionData = {
        subBrand: {
            name: '子品牌',
            items: ['Salty', 'Quaker', 'B&C']
        },
        productLine: {
            name: '品线',
            items: ['品线1', '品线2', '品线3']
        },
        channelType: {
            name: '渠道类型',
            items: ['O2O渠道', 'B2C渠道', '社区团购']
        },
        region: {
            name: '大区',
            items: ['华东', '华南', '华北', '西南']
        }
    };

    const currentData = dimensionData[currentDimension] || dimensionData.subBrand;

    // 创建表头
    const thead = document.createElement('thead');
    thead.className = 'table-light';

    // 第一行表头
    const headerRow1 = document.createElement('tr');
    const headers1 = [{ text: '周次', rowspan: 2 }];

    // 为每个维度项添加列组
    currentData.items.forEach(item => {
        headers1.push({ text: item, colspan: 4 });
    });

    headers1.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.text;
        th.className = 'text-center';
        if (header.colspan) th.setAttribute('colspan', header.colspan);
        if (header.rowspan) th.setAttribute('rowspan', header.rowspan);
        headerRow1.appendChild(th);
    });

    // 第二行表头
    const headerRow2 = document.createElement('tr');
    const subHeaders = ['GMV', 'GMV占比', '年同比%', '周环比%'];
    const headers2 = [];

    // 为每个维度项重复子表头
    currentData.items.forEach(() => {
        headers2.push(...subHeaders);
    });

    headers2.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.className = 'text-center';
        headerRow2.appendChild(th);
    });

    thead.appendChild(headerRow1);
    thead.appendChild(headerRow2);

    // 创建表格主体
    const tbody = document.createElement('tbody');

    // 添加测试数据行
    const base = baseDate ? dayjs(baseDate) : dayjs();
    for (let i = 14; i >= 0; i--) {
        const tr = document.createElement('tr');

        // 周次列
        const weekTd = document.createElement('td');
        // 从基准日期的前一天开始，往前推i周
        const weekDate = base.subtract(1, 'day').subtract(i, 'week');
        weekTd.textContent = `${weekDate.year()}-W${weekDate.isoWeek()}`;
        weekTd.className = 'text-center fw-bold';
        tr.appendChild(weekTd);

        // 根据维度项数量生成数据列
        const totalColumns = currentData.items.length * 4; // 每个维度项有4列
        for (let j = 0; j < totalColumns; j++) {
            const td = document.createElement('td');
            if (j % 4 === 0) {
                // GMV列
                td.textContent = (Math.random() * 10000000 + 5000000).toLocaleString('zh-CN', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3
                });
            } else if (j % 4 === 1) {
                // 占比列
                td.textContent = (Math.random() * 30 + 10).toFixed(1) + '%';
            } else {
                // 同比/环比列
                const value = (Math.random() - 0.5) * 40;
                td.textContent = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
            }
            td.className = 'text-center';
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    // 显示表格
    table.style.display = 'table';

    // 隐藏加载提示
    const loading = document.getElementById('table-loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// 更新活动详细数据表格（周次数据）
function updateActivityDetailDataTable(baseDate = null) {
    const tbody = document.getElementById('activity-table-body');
    if (!tbody) {
        console.warn("Activity table body not found!");
        return;
    }

    // 清空表格内容
    tbody.innerHTML = '';

    // 生成6周的数据
    const base = baseDate ? dayjs(baseDate) : dayjs();
    for (let i = 5; i >= 0; i--) {
        // 从基准日期的前一天开始，往前推i周
        const weekDate = base.subtract(1, 'day').subtract(i, 'week');
        const weekLabel = `${weekDate.year()}-W${weekDate.isoWeek()}`;

        const tr = document.createElement('tr');

        // 周次列
        const weekTd = document.createElement('td');
        weekTd.textContent = weekLabel;
        weekTd.className = 'text-center fw-bold';
        tr.appendChild(weekTd);

        // 活动GMV
        const gmvTd = document.createElement('td');
        gmvTd.textContent = (Math.random() * 50000000 + 30000000).toLocaleString('zh-CN');
        gmvTd.className = 'text-end';
        tr.appendChild(gmvTd);

        // GMV年同比
        const gmvYoyTd = document.createElement('td');
        const gmvYoyValue = (Math.random() - 0.3) * 50;
        gmvYoyTd.textContent = (gmvYoyValue >= 0 ? '+' : '') + gmvYoyValue.toFixed(1) + '%';
        gmvYoyTd.className = 'text-center';
        tr.appendChild(gmvYoyTd);

        // 核销金额
        const verificationTd = document.createElement('td');
        verificationTd.textContent = (Math.random() * 30000000 + 20000000).toLocaleString('zh-CN');
        verificationTd.className = 'text-end';
        tr.appendChild(verificationTd);

        // 核销年同比
        const verificationYoyTd = document.createElement('td');
        const verificationYoyValue = (Math.random() - 0.2) * 40;
        verificationYoyTd.textContent = (verificationYoyValue >= 0 ? '+' : '') + verificationYoyValue.toFixed(1) + '%';
        verificationYoyTd.className = 'text-center';
        tr.appendChild(verificationYoyTd);

        // 活动费比
        const costRatioTd = document.createElement('td');
        costRatioTd.textContent = (Math.random() * 8 + 10).toFixed(1) + '%';
        costRatioTd.className = 'text-center';
        tr.appendChild(costRatioTd);

        // 费比年同比
        const costRatioYoyTd = document.createElement('td');
        const costRatioYoyValue = (Math.random() - 0.5) * 6;
        costRatioYoyTd.textContent = (costRatioYoyValue >= 0 ? '+' : '') + costRatioYoyValue.toFixed(1) + 'pp';
        costRatioYoyTd.className = 'text-center';
        tr.appendChild(costRatioYoyTd);

        tbody.appendChild(tr);
    }

    console.log('Activity detail data table updated');
}

// 更新活动明细表格
function updateActivityDetailTable(filterType, baseDate = null) {
    const thead = document.getElementById('activityDetailTableHead');
    const tbody = document.getElementById('activityDetailTableBody');
    if (!thead || !tbody) {
        console.warn("Activity detail table elements not found!");
        return;
    }

    // 根据筛选类型生成数据
    const filterData = {
        city: ['北京', '上海', '广州', '深圳', '杭州'],
        retailer: ['沃尔玛', '家乐福', '大润发', '华润万家', '永辉超市'],
        product: ['薯片A', '薯片B', '燕麦C', '燕麦D', '饼干E'],
        discount: ['满100减20', '满200减50', '满300减80', '满500减120', '满1000减200']
    };

    const items = filterData[filterType] || filterData.city;
    const filterNames = {
        city: '城市',
        retailer: '零售商',
        product: '商品',
        discount: '满减机制'
    };

    // 清空并重新生成表头
    thead.innerHTML = '';

    const headerRow = document.createElement('tr');

    // 第一列：筛选维度
    const dimensionTh = document.createElement('th');
    dimensionTh.textContent = filterNames[filterType];
    dimensionTh.className = 'text-center';
    headerRow.appendChild(dimensionTh);

    // 活动GMV相关列
    ['活动GMV', 'GMV占比', 'GMV同比'].forEach(metric => {
        const th = document.createElement('th');
        th.textContent = metric;
        th.className = 'text-center';
        headerRow.appendChild(th);
    });

    // 活动GMV占全量GMV比例相关列
    ['GMV占全量比例', '占比同比'].forEach(metric => {
        const th = document.createElement('th');
        th.textContent = metric;
        th.className = 'text-center';
        headerRow.appendChild(th);
    });

    // 核销金额相关列
    ['核销金额', '核销占比', '核销同比'].forEach(metric => {
        const th = document.createElement('th');
        th.textContent = metric;
        th.className = 'text-center';
        headerRow.appendChild(th);
    });

    // 费比相关列
    ['活动费比', '费比同比', '全量费比', '全量费比同比'].forEach(metric => {
        const th = document.createElement('th');
        th.textContent = metric;
        th.className = 'text-center';
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    // 清空并生成表格数据
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');

        // 维度名称列
        const itemTd = document.createElement('td');
        itemTd.textContent = item;
        itemTd.className = 'text-center fw-bold';
        tr.appendChild(itemTd);

        // 活动GMV
        const gmvTd = document.createElement('td');
        gmvTd.textContent = (Math.random() * 20000000 + 10000000).toLocaleString('zh-CN');
        gmvTd.className = 'text-end';
        tr.appendChild(gmvTd);

        // GMV占比
        const gmvShareTd = document.createElement('td');
        gmvShareTd.textContent = (Math.random() * 15 + 5).toFixed(1) + '%';
        gmvShareTd.className = 'text-center';
        tr.appendChild(gmvShareTd);

        // GMV同比
        const gmvYoyTd = document.createElement('td');
        const gmvYoyValue = (Math.random() - 0.3) * 40;
        gmvYoyTd.textContent = (gmvYoyValue >= 0 ? '+' : '') + gmvYoyValue.toFixed(1) + '%';
        gmvYoyTd.className = 'text-center';
        tr.appendChild(gmvYoyTd);

        // GMV占全量比例
        const totalRatioTd = document.createElement('td');
        totalRatioTd.textContent = (Math.random() * 25 + 15).toFixed(1) + '%';
        totalRatioTd.className = 'text-center';
        tr.appendChild(totalRatioTd);

        // 占比同比
        const ratioYoyTd = document.createElement('td');
        const ratioYoyValue = (Math.random() - 0.5) * 8;
        ratioYoyTd.textContent = (ratioYoyValue >= 0 ? '+' : '') + ratioYoyValue.toFixed(1) + 'pp';
        ratioYoyTd.className = 'text-center';
        tr.appendChild(ratioYoyTd);

        // 核销金额
        const verificationTd = document.createElement('td');
        verificationTd.textContent = (Math.random() * 15000000 + 8000000).toLocaleString('zh-CN');
        verificationTd.className = 'text-end';
        tr.appendChild(verificationTd);

        // 核销占比
        const verificationShareTd = document.createElement('td');
        verificationShareTd.textContent = (Math.random() * 12 + 8).toFixed(1) + '%';
        verificationShareTd.className = 'text-center';
        tr.appendChild(verificationShareTd);

        // 核销同比
        const verificationYoyTd = document.createElement('td');
        const verificationYoyValue = (Math.random() - 0.2) * 35;
        verificationYoyTd.textContent = (verificationYoyValue >= 0 ? '+' : '') + verificationYoyValue.toFixed(1) + '%';
        verificationYoyTd.className = 'text-center';
        tr.appendChild(verificationYoyTd);

        // 活动费比
        const activityCostTd = document.createElement('td');
        activityCostTd.textContent = (Math.random() * 6 + 8).toFixed(1) + '%';
        activityCostTd.className = 'text-center';
        tr.appendChild(activityCostTd);

        // 费比同比
        const activityCostYoyTd = document.createElement('td');
        const activityCostYoyValue = (Math.random() - 0.5) * 4;
        activityCostYoyTd.textContent = (activityCostYoyValue >= 0 ? '+' : '') + activityCostYoyValue.toFixed(1) + 'pp';
        activityCostYoyTd.className = 'text-center';
        tr.appendChild(activityCostYoyTd);

        // 全量费比
        const totalCostTd = document.createElement('td');
        totalCostTd.textContent = (Math.random() * 4 + 6).toFixed(1) + '%';
        totalCostTd.className = 'text-center';
        tr.appendChild(totalCostTd);

        // 全量费比同比
        const totalCostYoyTd = document.createElement('td');
        const totalCostYoyValue = (Math.random() - 0.5) * 3;
        totalCostYoyTd.textContent = (totalCostYoyValue >= 0 ? '+' : '') + totalCostYoyValue.toFixed(1) + 'pp';
        totalCostYoyTd.className = 'text-center';
        tr.appendChild(totalCostYoyTd);

        tbody.appendChild(tr);
    });

    console.log('Activity detail table updated for:', filterType);
}

// 抽取 DataTable 初始化逻辑到单独的函数
function initializeDataTable(table, tableData) {
    return $(table).DataTable({
        data: tableData.rows || [],
        columns: tableData.columns || [],
        pageLength: 8,
        lengthMenu: [8, 15, 25],
        scrollX: true,
        scrollY: '300px',
        scrollCollapse: true,
        responsive: false,  /* 禁用响应式，使用水平滚动 */
        language: {
            url: 'https://cdn.datatables.net/plug-ins/2.0.2/i18n/zh.json'
        },
        destroy: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        autoWidth: false,
        columnDefs: [
            {
                targets: 0,
                width: '70px',
                className: 'text-center fw-bold'
            },
            {
                targets: '_all',
                className: 'text-right',
                width: '90px'
            }
        ],
        autoWidth: false,
        order: [[0, 'desc']],
        createdRow: function(row) {
            // 为百分比列添加正负值颜色
            $(row).find('td').each(function() {
                const text = $(this).text();
                if (text.includes('%')) {
                    const value = parseFloat(text.replace('%', ''));
                    if (!isNaN(value)) {
                        $(this).addClass(value >= 0 ? 'positive' : 'negative');
                    }
                }
            });
        },
        initComplete: function() {
            console.log('DataTable initialization complete');
            const api = this.api();
            
            // 调整列宽
            api.columns.adjust();
            
            // 确保表格容器样式正确
            $(table).closest('.dataTables_wrapper').addClass('w-100');
            
            // 监听窗口大小变化
            $(window).off('resize.dataTable').on('resize.dataTable', debounce(() => {
                api.columns.adjust();
            }, 150));
        }
    });
}

/**
 * 加载并更新多维表现数据
 */
function loadDimensionData(baseDate = null) {
    console.log('=== loadDimensionData called ===');
    console.log('Loading dimension data for:', currentPlatform, currentDimension);
    const data = mockData.getMultiDimensionData(currentPlatform, currentDimension, baseDate);
    console.log('Generated data:', data);
    console.log('Table data exists:', !!data.table);

    if (data.pie) {
        createOrUpdateDimensionPieChart(data.pie);
    }
    if (data.combo) {
        createOrUpdateDimensionComboChart(data.combo);
    }
    if (data.table) {
        console.log('Updating table with data:', data.table);
        updateDimensionTable(data.table);
    }
}


/**
 * 创建或更新通用趋势图
 * @param {object} chartData - 图表数据
 */
function createOrUpdateTrendChart(chartData) {
    if (!domElements.trendChartCanvas) return;
    const ctx = domElements.trendChartCanvas.getContext('2d');
    if (trendChart) {
        updateChart(trendChart, chartData.labels, chartData.datasets);
    } else {
        trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

/**
 * 创建或更新通用数据表格
 * @param {object} tableData - 表格数据
 */
function createOrUpdateDataTable(tableData) {
    if (!domElements.dataTable) return;
    
    if (dataTable) {
        dataTable.clear().destroy();
    }
    dataTable = $(domElements.dataTable).DataTable({
        data: tableData.rows,
        columns: tableData.headers.map(h => ({title: h})),
        responsive: true,
        paging: true,
        pageLength: 5,
        searching: true,
        lengthChange: false,
        info: true,
        autoWidth: false,
        destroy: true
    });
}


/**
 * 加载并显示指定周的数据
 * @param {Date} date - 选定周的任何一天
 */
function loadDataForWeek(date) {
    showLoading();
    setTimeout(() => {
        try {
            const weekNum = dayjs(date).isoWeek();
            const weekText = `Week ${weekNum}`;

            if (currentDomain === 'transaction') {
                const data = mockData.getTransactionData(currentPlatform, weekNum, date);
                if(data.kpis) updateTransactionKPIs(data.kpis, weekText);
                if(data.chart) createOrUpdateGmvTrendChart(data.chart);
                loadDimensionData(date);
            } else if (currentDomain === 'activity') {
                console.log('Loading activity data for week:', weekNum);
                const data = mockData.getActivityData(currentPlatform, date);
                console.log('Activity data loaded:', data);
                updateActivityData(date);
            } else {
                const data = mockData.getData(currentDomain, currentPlatform, weekNum, date);
                if(data.metrics) updateGenericKPIs(data.metrics);
                if(data.chart) createOrUpdateTrendChart(data.chart);
                if(data.table) createOrUpdateDataTable(data.table);
            }
        } catch (error) {
            console.error('加载数据时出错:', error);
            alert('加载数据失败，请查看控制台获取更多信息。');
        } finally {
            hideLoading();
        }
    }, 500);
}

/**
 * 初始化周选择器
 */
function initWeekPicker() {
    try {
        const weekPickerElem = document.getElementById('weekPicker');
        if (!weekPickerElem) {
            throw new Error('Week picker element not found');
        }

        // 设置初始值
        const initialDate = new Date();
        const initialWeek = dayjs(initialDate).isoWeek();
        const initialYear = dayjs(initialDate).year();
        weekPickerElem.value = `第${initialWeek}周 ${initialYear}年`;

        // 配置周选择器
        weekPicker = flatpickr(weekPickerElem, {
            defaultDate: initialDate,
            dateFormat: "Y-m-d",
            locale: "zh",
            weekNumbers: true,
            onChange: function(selectedDates) {
                if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    const selectedWeek = dayjs(selectedDate).isoWeek();
                    const selectedYear = dayjs(selectedDate).year();
                    
                    if (selectedWeek !== currentWeek || selectedYear !== currentYear) {
                        currentWeek = selectedWeek;
                        currentYear = selectedYear;
                        weekPickerElem.value = `第${selectedWeek}周 ${selectedYear}年`;
                        refreshData();
                    }
                }
            }
        });

        return weekPicker;
    } catch (error) {
        console.error('Error initializing week picker:', error);
        return null;
    }
}

/**
 * 初始化领域切换Tabs
 */
function initDomainTabs() {
    console.log('Initializing domain tabs...');
    console.log('domElements.domainTabs:', domElements.domainTabs);

    if(!domElements.domainTabs) {
        console.error('domainTabs element not found!');
        return;
    }

    domElements.domainTabs.addEventListener('click', (event) => {
        console.log('Domain tab clicked:', event.target);
        const target = event.target.closest('[data-domain]');
        console.log('Target with data-domain:', target);

        if (target) {
            const domain = target.dataset.domain;
            console.log('Switching to domain:', domain);

            if (domain === currentDomain) {
                console.log('Already on this domain, skipping');
                return;
            }

            const currentActive = domElements.domainTabs.querySelector('.active');
            if(currentActive) currentActive.classList.remove('active');

            target.classList.add('active');
            switchView(domain);
        } else {
            console.log('No target with data-domain found');
        }
    });

    console.log('Domain tabs initialized successfully');
}

/**
 * 初始化平台切换Tabs
 */
function initPlatformTabs() {
    if(!domElements.platformTabs) return;
    domElements.platformTabs.addEventListener('click', (event) => {
        const target = event.target.closest('[data-platform]');
        if (target) {
            const platform = target.dataset.platform;
            if (platform === currentPlatform) return;
            
            currentPlatform = platform;

            const currentActive = domElements.platformTabs.querySelector('.active');
            if(currentActive) currentActive.classList.remove('active');
            
            target.classList.add('active');
            
            const selectedWeek = weekPicker.selectedDates[0];
            if (selectedWeek) {
                 loadDataForWeek(selectedWeek);
            }
        }
    });
}

/**
 * 初始化图表类型切换
 */
function initChartTypeToggle() {
    if (!domElements.chartTypeToggle) return;
    domElements.chartTypeToggle.addEventListener('click', () => {
        if (trendChart) {
            const currentType = trendChart.config.type;
            trendChart.config.type = currentType === 'bar' ? 'line' : 'bar';
            trendChart.update();
        }
    });
}

/**
 * 初始化多维表现维度选择器
 */
function initDimensionSelector() {
    if (!domElements.dimensionTypeSelector) return;
    domElements.dimensionTypeSelector.addEventListener('change', (e) => {
        currentDimension = e.target.value;
        updateMultiDimensionData(currentDimension);
    });
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
     cacheDOMElements();
     initWeekPicker();
     initDomainTabs();
     initPlatformTabs();
     initChartTypeToggle();
     initDimensionSelector();
     initActivityTrendToggle();
     initActivityFilterSelect();
     initMetricCardClicks();

     // 初始加载
     if (weekPicker.selectedDates.length > 0) {
        loadDataForWeek(weekPicker.selectedDates[0]);
     } else {
        loadDataForWeek(new Date());
     }
     
     // 为指标卡添加占位元素
     addPlaceholderSections();

     // 确保默认视图正确
     switchView(currentDomain);
     const initialActiveDomain = document.querySelector(`.nav-link[data-domain="${currentDomain}"]`);
     if (initialActiveDomain) initialActiveDomain.classList.add('active');
});

/**
 * 初始化活动趋势图切换按钮（已删除按钮，保留函数以避免错误）
 */
function initActivityTrendToggle() {
    // 按钮已删除，无需处理
}

/**
 * 为没有进度条的指标卡添加占位元素
 */
function addPlaceholderSections() {
    // 查找所有指标卡
    const metricCards = document.querySelectorAll('.metric-card .card-body');

    metricCards.forEach(cardBody => {
        // 检查是否已有进度条或占位元素
        const hasProgressSection = cardBody.querySelector('.progress-section');
        const hasPlaceholder = cardBody.querySelector('.placeholder-section');

        // 如果没有进度条且没有占位元素，则添加占位元素
        if (!hasProgressSection && !hasPlaceholder) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder-section';
            cardBody.appendChild(placeholder);
        }
    });
}

// 初始化事件监听
function initEventListeners() {
    // 数据领域切换
    document.querySelectorAll('#domainTabs .nav-link').forEach(button => {
        button.addEventListener('click', function() {
            const domain = this.dataset.domain;
            if (domain !== currentDomain) {
                document.querySelectorAll('#domainTabs .nav-link').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentDomain = domain;
                toggleDomainContent();
                refreshData();
            }
        });
    });

    // 平台切换
    document.querySelectorAll('#platformTabs .nav-link').forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.dataset.platform;
            if (platform !== currentPlatform) {
                document.querySelectorAll('#platformTabs .nav-link').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentPlatform = platform;
                refreshData();
            }
        });
    });

    // 图表类型切换
    document.getElementById('chartTypeToggle')?.addEventListener('click', function() {
        const icon = this.querySelector('i');
        const isLine = icon.classList.contains('fa-chart-line');
        icon.classList.remove(isLine ? 'fa-chart-line' : 'fa-chart-bar');
        icon.classList.add(isLine ? 'fa-chart-bar' : 'fa-chart-line');
        updateChartType(!isLine);
    });
}

// 切换数据领域内容
function toggleDomainContent() {
    const transactionContent = document.getElementById('transaction-content');
    const activityContent = document.getElementById('activity-content');
    const supplyContent = document.getElementById('supply-content');
    const userContent = document.getElementById('user-content');
    const rtbContent = document.getElementById('rtb-content');
    const genericContent = document.getElementById('generic-content');

    const contents = [transactionContent, activityContent, supplyContent, userContent, rtbContent, genericContent];

    if (contents.some(content => !content)) {
        console.error('Some content containers not found!');
        return;
    }

    // 隐藏所有内容
    contents.forEach(content => {
        if (content) content.style.display = 'none';
    });

    // 显示对应的内容
    switch (currentDomain) {
        case 'transaction':
            transactionContent.style.display = 'block';
            break;
        case 'activity':
            activityContent.style.display = 'block';
            break;
        case 'supply':
            supplyContent.style.display = 'block';
            break;
        case 'user':
            userContent.style.display = 'block';
            break;
        case 'rtb':
            rtbContent.style.display = 'block';
            break;
        default:
            genericContent.style.display = 'block';
            break;
    }
}

// 刷新数据
function refreshData() {
    try {
        // 获取当前选中的日期
        const selectedDate = weekPicker && weekPicker.selectedDates.length > 0 ? weekPicker.selectedDates[0] : new Date();

        switch (currentDomain) {
            case 'transaction':
                updateTransactionData(selectedDate);
                break;
            case 'activity':
                updateActivityData(selectedDate);
                break;
            case 'supply':
                updateSupplyData(selectedDate);
                break;
            case 'user':
                updateUserData(selectedDate);
                break;
            case 'rtb':
                updateRtbData(selectedDate);
                break;
            default:
                updateGenericData(selectedDate);
                break;
        }
    } catch (error) {
        console.error(`[${currentDomain}] Failed to refresh data:`, error);
        alert(`加载 ${currentDomain} 数据时出错，请按F12在控制台中查看详细错误信息。`);
    }
}

// 更新交易数据
function updateTransactionData(baseDate = null) {
    try {
        const selectedDate = baseDate || new Date();
        const weekNum = dayjs(selectedDate).isoWeek();
        const data = mockData.getTransactionData(currentPlatform, weekNum, selectedDate);
        
        // 更新KPI指标
        if (data.kpis) {
            updateTransactionKPIs(data.kpis, `Week ${weekNum}`);
        }
        
        // 更新GMV趋势图
        if (data.chart) {
            createOrUpdateGmvTrendChart(data.chart);
        }
        
        // 更新多维度数据
        updateMultiDimensionData(currentDimension, selectedDate);
    } catch (error) {
        console.error('Error in updateTransactionData:', error);
        throw error;
    }
}

// 更新多维度数据
function updateMultiDimensionData(dimensionType, baseDate = null) {
    try {
        showLoading();
        console.log('Updating dimension data:', { dimensionType, platform: currentPlatform });
        const data = mockData.getMultiDimensionData(currentPlatform, dimensionType, baseDate);
        
        // 更新饼图
        if (data.pie) {
            createOrUpdateDimensionPieChart(data.pie);
        }
        
        // 更新组合图
        if (data.combo) {
            createOrUpdateDimensionComboChart(data.combo);
        }
        
        // 更新表格
        if (data.table) {
            updateDimensionTable(data.table);
        }
    } catch (error) {
        console.error('Error in updateMultiDimensionData:', error);
        showError('更新维度数据失败，请检查控制台获取详细信息');
    } finally {
        hideLoading();
    }
}

// 更新活动数据指标卡
function updateActivityKPIs(metrics) {
    // 活动GMV
    safeUpdate(document.getElementById('activityGmv'), metrics.activityGmv.value);
    safeUpdate(document.getElementById('activityGmvYoy'), `年同比 ${getChangeSymbol(metrics.activityGmv.yoy)} ${metrics.activityGmv.yoy}`);

    // 活动GMV占比
    safeUpdate(document.getElementById('activityGmvRatio'), metrics.activityGmvRatio.value);
    safeUpdate(document.getElementById('activityGmvRatioYoy'), `年同比 ${getChangeSymbol(metrics.activityGmvRatio.yoy)} ${metrics.activityGmvRatio.yoy}`);

    // 核销金额
    safeUpdate(document.getElementById('verificationAmount'), metrics.verificationAmount.value);
    safeUpdate(document.getElementById('verificationAmountYoy'), `年同比 ${getChangeSymbol(metrics.verificationAmount.yoy)} ${metrics.verificationAmount.yoy}`);
    safeUpdate(document.getElementById('verificationProgress'), metrics.verificationAmount.progress);

    // 更新核销进度百分数
    safeUpdate(document.getElementById('verificationProgress'), `核销进度 ${metrics.verificationAmount.progress || '-'}`);

    // 为核销进度添加颜色样式
    const verificationProgressElement = document.getElementById('verificationProgress');
    if (verificationProgressElement && metrics.verificationAmount.progress) {
        const progressValue = parseFloat(metrics.verificationAmount.progress.replace('%', ''));
        if (!isNaN(progressValue)) {
            verificationProgressElement.className = 'metric-change';
            if (progressValue >= 80) {
                verificationProgressElement.classList.add('positive');
            } else if (progressValue >= 60) {
                verificationProgressElement.classList.add('neutral');
            } else {
                verificationProgressElement.classList.add('negative');
            }
        }
    }

    // 活动费比
    safeUpdate(document.getElementById('activityCostRatio'), metrics.activityCostRatio.value);
    safeUpdate(document.getElementById('activityCostRatioYoy'), `年同比 ${getChangeSymbol(metrics.activityCostRatio.yoy)} ${metrics.activityCostRatio.yoy}`);

    // 全量费比
    safeUpdate(document.getElementById('totalCostRatio'), metrics.totalCostRatio.value);
    safeUpdate(document.getElementById('totalCostRatioYoy'), `年同比 ${getChangeSymbol(metrics.totalCostRatio.yoy)} ${metrics.totalCostRatio.yoy}`);

    // 添加颜色样式
    updateAllChangeColors();
}

// 当前活动趋势图显示的指标
let currentActivityMetric = 'activityGmv';
let currentActivityDisplayMode = 'value'; // 'value' 或 'percentage'

/**
 * 获取活动指标配置
 * @param {string} metric - 指标类型
 * @param {string} displayMode - 显示模式
 * @returns {object} 指标配置
 */
function getActivityMetricConfig(metric, displayMode) {
    const baseData = {
        activityGmv: {
            label: '活动GMV',
            data: [45000000, 52000000, 48000000, 58000000, 55000000, 62000000],
            yoyData: [12.5, 18.3, 15.7, 22.1, 19.8, 25.4], // 年同比数据
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgb(54, 162, 235)',
            unit: '元'
        },
        activityGmvRatio: {
            label: '活动GMV占比',
            data: [18.5, 19.2, 17.8, 20.1, 19.5, 21.3],
            yoyData: [2.1, 2.8, 1.5, 3.2, 2.4, 3.7], // 年同比数据（pp格式）
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgb(75, 192, 192)',
            unit: '%',
            isPercentage: true // 标记为百分比指标
        },
        verificationAmount: {
            label: '核销金额',
            data: [28000000, 35000000, 32000000, 42000000, 38000000, 45000000],
            yoyData: [15.8, 22.4, 18.9, 28.7, 24.3, 32.1], // 年同比数据
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgb(255, 206, 86)',
            unit: '元'
        },
        activityCostRatio: {
            label: '活动费比',
            data: [12.5, 13.2, 11.8, 14.1, 13.5, 15.3],
            yoyData: [1.3, 2.1, 0.8, 2.8, 1.9, 3.2], // 年同比数据（pp格式）
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgb(255, 99, 132)',
            unit: '%',
            isPercentage: true
        },
        totalCostRatio: {
            label: '全量费比',
            data: [8.2, 8.9, 7.5, 9.8, 8.7, 10.1],
            yoyData: [0.9, 1.5, 0.4, 2.1, 1.2, 2.5], // 年同比数据（pp格式）
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgb(153, 102, 255)',
            unit: '%',
            isPercentage: true
        }
    };

    const config = baseData[metric] || baseData.activityGmv;

    // 如果是百分比模式，转换数据
    if (displayMode === 'percentage' && config.unit === '元') {
        // 将金额转换为占比（模拟数据）
        const total = config.data.reduce((sum, val) => sum + val, 0);
        config.data = config.data.map(val => ((val / total) * 100).toFixed(1));
        config.unit = '%';
        config.label += '占比';
    }

    return config;
}

// 创建或更新活动趋势图
function createOrUpdateActivityTrendChart(metric = 'activityGmv', displayMode = 'value') {
    console.log('=== Activity Trend Chart Debug ===');
    console.log('Metric:', metric, 'Display Mode:', displayMode);

    const canvas = document.getElementById('activityTrendChart');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }

    const ctx = canvas.getContext('2d');

    // 安全地销毁现有图表
    if (window.activityTrendChart && typeof window.activityTrendChart.destroy === 'function') {
        try {
            window.activityTrendChart.destroy();
        } catch (error) {
            console.error('Error destroying chart:', error);
        }
    }
    window.activityTrendChart = null;

    // 更新当前状态
    currentActivityMetric = metric;
    currentActivityDisplayMode = displayMode;

    // 根据选择的指标生成数据
    const metricConfig = getActivityMetricConfig(metric, displayMode);

    const completeData = {
        labels: ['2025-W23', '2025-W24', '2025-W25', '2025-W26', '2025-W27', '2025-W28'],
        datasets: [{
            type: 'bar',
            label: metricConfig.label,
            data: metricConfig.data,
            backgroundColor: metricConfig.backgroundColor,
            borderColor: metricConfig.borderColor,
            borderWidth: 1,
            yAxisID: 'y'
        }, {
            type: 'line',
            label: metricConfig.isPercentage ? '年同比pp' : '年同比%',
            data: metricConfig.yoyData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y1',
            tension: 0.3,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
        }]
    };

    console.log('Creating chart with simple data...');
    try {
        window.activityTrendChart = new Chart(ctx, {
            type: 'bar', // 主类型为bar，但每个dataset可以有自己的type
            data: completeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    onClick: function(e, legendItem, legend) {
                        // 图例点击切换显示/隐藏
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    },
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }

                            if (context.dataset.yAxisID === 'y1') {
                                // 右Y轴 - 年同比
                                if (metricConfig.isPercentage) {
                                    label += context.parsed.y + 'pp';
                                } else {
                                    label += context.parsed.y + '%';
                                }
                            } else {
                                // 左Y轴 - 根据指标类型显示
                                if (metricConfig.unit === '%') {
                                    label += context.parsed.y + '%';
                                } else {
                                    label += new Intl.NumberFormat('zh-CN').format(context.parsed.y);
                                }
                            }

                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '周'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: metricConfig.label
                    },
                    ticks: {
                        callback: function(value) {
                            if (metricConfig.unit === '%') {
                                return value + '%';
                            } else {
                                return new Intl.NumberFormat('zh-CN', {
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value);
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: metricConfig.isPercentage ? '年同比pp' : '年同比%'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            const unit = metricConfig.isPercentage ? 'pp' : '%';
                            return value + unit;
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderWidth: 1,
                    borderRadius: 2
                },
                line: {
                    tension: 0.1,
                    borderWidth: 2
                },
                point: {
                    radius: 4,
                    hoverRadius: 6,
                    borderWidth: 2
                }
            }
        }
    });

    console.log('Chart created successfully:', window.activityTrendChart);
    } catch (error) {
        console.error('Error creating activity trend chart:', error);
        window.activityTrendChart = null;
    }
}

/**
 * 处理活动指标卡点击事件
 * @param {string} metric - 点击的指标
 */
function handleActivityMetricClick(metric) {
    console.log('Activity metric clicked:', metric);

    // 排除核销进度，不在趋势分析中展示
    if (metric === 'verificationProgress') {
        console.log('核销进度不在趋势分析中展示');
        return;
    }

    // 更新活动趋势图
    createOrUpdateActivityTrendChart(metric, currentActivityDisplayMode);

    // 更新指标卡的激活状态
    updateActivityMetricCardStates(metric);
}

/**
 * 更新活动指标卡的激活状态
 * @param {string} activeMetric - 当前激活的指标
 */
function updateActivityMetricCardStates(activeMetric) {
    const activityCards = document.querySelectorAll('#activityMetricCards .clickable-metric');
    activityCards.forEach(card => {
        const metric = card.getAttribute('data-metric');
        if (metric === activeMetric) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

// 创建或更新活动数据表格
function createOrUpdateActivityDataTable(tableData) {
    const tableElement = document.getElementById('activityDataTable');
    if (!tableElement) return;

    // 清空表格
    tableElement.innerHTML = '';

    // 添加表格样式类
    tableElement.className = 'table table-hover table-striped';

    // 创建表头
    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    const headerRow = document.createElement('tr');

    const columns = [
        { title: '券机制', align: 'center' },
        { title: '活动GMV', align: 'right' },
        { title: '年同比', align: 'right' },
        { title: '核销金额', align: 'right' },
        { title: '年同比', align: 'right' },
        { title: '活动费比', align: 'right' },
        { title: '年同比', align: 'right' }
    ];

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.title;
        th.className = `text-${col.align}`;
        th.style.whiteSpace = 'nowrap';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // 创建表体
    const tbody = document.createElement('tbody');

    // 生成6周数据
    const couponMechanisms = ['满减券', '折扣券', '立减券', '新人券', '会员券', '品类券'];

    for (let i = 0; i < 6; i++) {
        const tr = document.createElement('tr');

        // 券机制
        const mechanismTd = document.createElement('td');
        mechanismTd.textContent = couponMechanisms[i];
        mechanismTd.className = 'text-center fw-bold';
        tr.appendChild(mechanismTd);

        // 活动GMV
        const gmvTd = document.createElement('td');
        const gmvValue = [45000000, 52000000, 48000000, 58000000, 55000000, 62000000][i];
        gmvTd.textContent = `${new Intl.NumberFormat('zh-CN').format(gmvValue)}`;
        gmvTd.className = 'text-end';
        tr.appendChild(gmvTd);

        // 活动GMV年同比
        const gmvYoyTd = document.createElement('td');
        const gmvYoy = [15.2, 18.5, 12.8, 22.1, 19.5, 25.3][i];
        const gmvYoySymbol = gmvYoy >= 0 ? '▲' : '▼';
        const gmvYoyClass = gmvYoy >= 0 ? 'text-success' : 'text-danger';
        gmvYoyTd.innerHTML = `<span class="${gmvYoyClass}">${gmvYoySymbol} ${Math.abs(gmvYoy)}%</span>`;
        gmvYoyTd.className = 'text-end';
        tr.appendChild(gmvYoyTd);

        // 核销金额
        const verificationTd = document.createElement('td');
        const verificationValue = [28000000, 35000000, 32000000, 42000000, 38000000, 45000000][i];
        verificationTd.textContent = `${new Intl.NumberFormat('zh-CN').format(verificationValue)}`;
        verificationTd.className = 'text-end';
        tr.appendChild(verificationTd);

        // 核销金额年同比
        const verificationYoyTd = document.createElement('td');
        const verificationYoy = [12.8, 16.2, 9.5, 19.8, 15.7, 22.1][i];
        const verificationYoySymbol = verificationYoy >= 0 ? '▲' : '▼';
        const verificationYoyClass = verificationYoy >= 0 ? 'text-success' : 'text-danger';
        verificationYoyTd.innerHTML = `<span class="${verificationYoyClass}">${verificationYoySymbol} ${Math.abs(verificationYoy)}%</span>`;
        verificationYoyTd.className = 'text-end';
        tr.appendChild(verificationYoyTd);

        // 活动费比
        const activityCostTd = document.createElement('td');
        const activityCostValue = [12.5, 13.2, 11.8, 14.1, 13.5, 15.3][i];
        activityCostTd.textContent = `${activityCostValue}%`;
        activityCostTd.className = 'text-end';
        tr.appendChild(activityCostTd);

        // 活动费比年同比
        const activityCostYoyTd = document.createElement('td');
        const activityCostYoy = [2.1, -1.5, 3.2, 1.8, -0.8, 2.5][i];
        const activityCostYoySymbol = activityCostYoy >= 0 ? '▲' : '▼';
        const activityCostYoyClass = activityCostYoy >= 0 ? 'text-success' : 'text-danger';
        activityCostYoyTd.innerHTML = `<span class="${activityCostYoyClass}">${activityCostYoySymbol} ${Math.abs(activityCostYoy)}pp</span>`;
        activityCostYoyTd.className = 'text-end';
        tr.appendChild(activityCostYoyTd);

        tbody.appendChild(tr);
    }

    tableElement.appendChild(thead);
    tableElement.appendChild(tbody);
}

// 更新供给数据指标卡
function updateSupplyKPIs(metrics) {
    // 铺货店铺数
    safeUpdate(document.getElementById('storeCount'), metrics.storeCount.value);
    safeUpdate(document.getElementById('storeCountWow'), `周环比 ${getChangeSymbol(metrics.storeCount.wow)} ${metrics.storeCount.wow}`);

    // 店铺动销率
    safeUpdate(document.getElementById('storeSalesRate'), metrics.storeSalesRate.value);
    safeUpdate(document.getElementById('storeSalesRateWow'), `周环比 ${getChangeSymbol(metrics.storeSalesRate.wow)} ${metrics.storeSalesRate.wow}`);

    // 店均在售SKU数
    safeUpdate(document.getElementById('avgSkuPerStore'), metrics.avgSkuPerStore.value);
    safeUpdate(document.getElementById('avgSkuPerStoreWow'), `周环比 ${getChangeSymbol(metrics.avgSkuPerStore.wow)} ${metrics.avgSkuPerStore.wow}`);

    // SKU店铺渗透率
    safeUpdate(document.getElementById('skuStorePenetration'), metrics.skuStorePenetration.value);
    safeUpdate(document.getElementById('skuStorePenetrationWow'), `周环比 ${getChangeSymbol(metrics.skuStorePenetration.wow)} ${metrics.skuStorePenetration.wow}`);

    // SKU售罄率
    safeUpdate(document.getElementById('skuSelloutRate'), metrics.skuSelloutRate.value);
    safeUpdate(document.getElementById('skuSelloutRateWow'), `周环比 ${getChangeSymbol(metrics.skuSelloutRate.wow)} ${metrics.skuSelloutRate.wow}`);

    // 添加颜色样式
    updateAllChangeColors();
}

// 创建或更新供给明细表
function createOrUpdateSupplyDetailTable(filterType = 'overall') {
    const tableElement = document.getElementById('supplyDetailTable');
    if (!tableElement) return;

    // 清空表格
    tableElement.innerHTML = '';
    tableElement.className = 'table table-hover table-striped';
    
    // 根据列数设置合适的最小宽度
    if (filterType === 'overall' || filterType === 'channel' || filterType === 'product') {
        tableElement.style.minWidth = '1800px'; // 确保表格有足够宽度显示所有列
    }

    // 创建表头
    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    const headerRow = document.createElement('tr');

    let columns = [];

    if (filterType === 'overall') {
        columns = [
            { title: '周次', align: 'center' },
            { title: 'GMV', align: 'right' },
            { title: 'GMV占比', align: 'right' },
            { title: 'GMV周环比', align: 'right' },
            { title: '铺货门店数', align: 'right' },
            { title: '门店数周环比', align: 'right' },
            { title: '店铺渗透率', align: 'right' },
            { title: '渗透率周环比', align: 'right' },
            { title: '店铺动销率', align: 'right' },
            { title: '动销率周环比', align: 'right' },
            { title: '店均在售SKU数', align: 'right' },
            { title: 'SKU数周环比', align: 'right' },
            { title: 'SKU售罄率', align: 'right' },
            { title: '售罄率周环比', align: 'right' },
            { title: '售罄SKU预估损失', align: 'right' },
            { title: '损失周环比', align: 'right' }
        ];
    } else if (filterType === 'channel') {
        columns = [
            { title: '重点渠道', align: 'left' },
            { title: 'GMV', align: 'right' },
            { title: 'GMV占比', align: 'right' },
            { title: 'GMV周环比', align: 'right' },
            { title: '铺货门店数', align: 'right' },
            { title: '门店数周环比', align: 'right' },
            { title: '店铺渗透率', align: 'right' },
            { title: '渗透率周环比', align: 'right' },
            { title: '店铺动销率', align: 'right' },
            { title: '动销率周环比', align: 'right' },
            { title: '店均在售SKU数', align: 'right' },
            { title: 'SKU数周环比', align: 'right' },
            { title: 'SKU售罄率', align: 'right' },
            { title: '售罄率周环比', align: 'right' },
            { title: '售罄SKU预估损失', align: 'right' },
            { title: '损失周环比', align: 'right' }
        ];
    } else if (filterType === 'product') {
        columns = [
            { title: '重点商品', align: 'left' },
            { title: 'GMV', align: 'right' },
            { title: 'GMV占比', align: 'right' },
            { title: 'GMV周环比', align: 'right' },
            { title: '铺货门店数', align: 'right' },
            { title: '门店数周环比', align: 'right' },
            { title: '店铺渗透率', align: 'right' },
            { title: '渗透率周环比', align: 'right' },
            { title: '店铺动销率', align: 'right' },
            { title: '动销率周环比', align: 'right' },
            { title: '店均在售SKU数', align: 'right' },
            { title: 'SKU数周环比', align: 'right' },
            { title: 'SKU售罄率', align: 'right' },
            { title: '售罄率周环比', align: 'right' },
            { title: '售罄SKU预估损失', align: 'right' },
            { title: '损失周环比', align: 'right' }
        ];
    }

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.title;
        th.className = `text-${col.align}`;
        th.style.whiteSpace = 'nowrap';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // 创建表体
    const tbody = document.createElement('tbody');

    // 生成数据
    const rowCount = filterType === 'overall' ? 6 : 8;

    // 计算近6周GMV总和用于占比计算
    const totalGmv = 1500000000; // 假设近6周GMV总和

    for (let i = 0; i < rowCount; i++) {
        const tr = document.createElement('tr');

        // 第一列：维度字段
        const dimensionTd = document.createElement('td');
        if (filterType === 'overall') {
            const weekNum = dayjs().subtract(5-i, 'weeks').isoWeek();
            dimensionTd.textContent = `W${weekNum}`;
            dimensionTd.className = 'text-center fw-bold';
        } else if (filterType === 'channel') {
            const channels = ['天猫旗舰店', '京东自营', '抖音小店', '拼多多官方', '微信小程序', '线下门店', '苏宁易购', '唯品会'];
            dimensionTd.textContent = channels[i];
            dimensionTd.className = 'text-start fw-bold';
        } else if (filterType === 'product') {
            const products = ['iPhone 15 Pro', '华为Mate60', '小米14 Ultra', 'OPPO Find X7', 'vivo X100', '荣耀Magic6', '一加12', '真我GT5'];
            dimensionTd.textContent = products[i];
            dimensionTd.className = 'text-start fw-bold';
        }
        tr.appendChild(dimensionTd);

        // 生成各项数据
        const gmv = Math.floor(Math.random() * 200000000) + 50000000;
        const gmvRatio = ((gmv / totalGmv) * 100).toFixed(1);
        const gmvWow = (Math.random() * 40 - 20).toFixed(1);
        const storeCount = Math.floor(Math.random() * 5000) + 1000;
        const storeCountWow = (Math.random() * 20 - 10).toFixed(1);
        const storePenetration = (Math.random() * 30 + 60).toFixed(1);
        const storePenetrationWow = (Math.random() * 10 - 5).toFixed(1);
        const storeSalesRate = (Math.random() * 20 + 70).toFixed(1);
        const storeSalesRateWow = (Math.random() * 8 - 4).toFixed(1);
        const avgSkuPerStore = Math.floor(Math.random() * 30) + 15;
        const avgSkuPerStoreWow = (Math.random() * 15 - 8).toFixed(1);
        const skuSelloutRate = (Math.random() * 15 + 5).toFixed(1);
        const skuSelloutRateWow = (Math.random() * 25 - 10).toFixed(1);
        const selloutLoss = Math.floor(Math.random() * 5000000) + 1000000;
        const selloutLossWow = (Math.random() * 30 - 15).toFixed(1);

        const data = [
            // GMV相关
            new Intl.NumberFormat('zh-CN').format(gmv),
            gmvRatio + '%',
            (gmvWow >= 0 ? '▲ ' : '▼ ') + Math.abs(gmvWow) + '%',
            // 铺货门店数相关
            new Intl.NumberFormat('zh-CN').format(storeCount),
            (storeCountWow >= 0 ? '▲ ' : '▼ ') + Math.abs(storeCountWow) + '%',
            // 店铺渗透率相关
            storePenetration + '%',
            (storePenetrationWow >= 0 ? '▲ ' : '▼ ') + Math.abs(storePenetrationWow) + 'pp',
            // 店铺动销率相关
            storeSalesRate + '%',
            (storeSalesRateWow >= 0 ? '▲ ' : '▼ ') + Math.abs(storeSalesRateWow) + 'pp',
            // 店均在售SKU数相关
            avgSkuPerStore.toString(),
            (avgSkuPerStoreWow >= 0 ? '▲ ' : '▼ ') + Math.abs(avgSkuPerStoreWow) + '%',
            // SKU售罄率相关
            skuSelloutRate + '%',
            (skuSelloutRateWow >= 0 ? '▲ ' : '▼ ') + Math.abs(skuSelloutRateWow) + 'pp',
            // 售罄SKU预估损失相关
            new Intl.NumberFormat('zh-CN').format(selloutLoss),
            (selloutLossWow >= 0 ? '▲ ' : '▼ ') + Math.abs(selloutLossWow) + '%'
        ];

        data.forEach((value, index) => {
            const td = document.createElement('td');
            td.innerHTML = value;
            td.className = 'text-end';

            // 为环比数据添加颜色
            if (index % 3 === 2 && index > 0) { // 环比列
                const isPositive = value.includes('▲');
                td.className += isPositive ? ' text-success' : ' text-danger';
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }

    tableElement.appendChild(thead);
    tableElement.appendChild(tbody);
}

// 更新用户数据指标卡
function updateUserKPIs(metrics) {
    // 新客数量
    safeUpdate(document.getElementById('newUserCount'), metrics.newUserCount.value);
    safeUpdate(document.getElementById('newUserCountRatio'), `占比 ${metrics.newUserCount.ratio}`);
    safeUpdate(document.getElementById('newUserCountWow'), `周环比 ${getChangeSymbol(metrics.newUserCount.wow)} ${metrics.newUserCount.wow}`);

    // 新客销售额
    safeUpdate(document.getElementById('newUserSales'), metrics.newUserSales.value);
    safeUpdate(document.getElementById('newUserSalesRatio'), `占比 ${metrics.newUserSales.ratio}`);
    safeUpdate(document.getElementById('newUserSalesWow'), `周环比 ${getChangeSymbol(metrics.newUserSales.wow)} ${metrics.newUserSales.wow}`);

    // 新客客单价
    safeUpdate(document.getElementById('newUserAvgOrder'), metrics.newUserAvgOrder.value);
    safeUpdate(document.getElementById('newUserAvgOrderWow'), `周环比 ${getChangeSymbol(metrics.newUserAvgOrder.wow)} ${metrics.newUserAvgOrder.wow}`);

    // 老客数量
    safeUpdate(document.getElementById('oldUserCount'), metrics.oldUserCount.value);
    safeUpdate(document.getElementById('oldUserCountRatio'), `占比 ${metrics.oldUserCount.ratio}`);
    safeUpdate(document.getElementById('oldUserCountWow'), `周环比 ${getChangeSymbol(metrics.oldUserCount.wow)} ${metrics.oldUserCount.wow}`);

    // 老客销售额
    safeUpdate(document.getElementById('oldUserSales'), metrics.oldUserSales.value);
    safeUpdate(document.getElementById('oldUserSalesRatio'), `占比 ${metrics.oldUserSales.ratio}`);
    safeUpdate(document.getElementById('oldUserSalesWow'), `周环比 ${getChangeSymbol(metrics.oldUserSales.wow)} ${metrics.oldUserSales.wow}`);

    // 老客客单价
    safeUpdate(document.getElementById('oldUserAvgOrder'), metrics.oldUserAvgOrder.value);
    safeUpdate(document.getElementById('oldUserAvgOrderWow'), `周环比 ${getChangeSymbol(metrics.oldUserAvgOrder.wow)} ${metrics.oldUserAvgOrder.wow}`);

    // 添加颜色样式
    updateAllChangeColors();
}

// 更新RTB数据指标卡
function updateRtbKPIs(metrics) {
    // 消耗
    safeUpdate(document.getElementById('rtbConsumption'), metrics.consumption.value);
    safeUpdate(document.getElementById('rtbConsumptionWow'), `周环比 ${getChangeSymbol(metrics.consumption.wow)} ${metrics.consumption.wow}`);
    safeUpdate(document.getElementById('rtbConsumptionProgress'), `消耗进度 ${metrics.consumptionProgress.value}`);

    // T+1引导成交金额
    safeUpdate(document.getElementById('rtbGuidedSales'), metrics.guidedSales.value);
    safeUpdate(document.getElementById('rtbGuidedSalesWow'), `周环比 ${getChangeSymbol(metrics.guidedSales.wow)} ${metrics.guidedSales.wow}`);

    // ROI
    safeUpdate(document.getElementById('rtbRoi'), metrics.roi.value);
    safeUpdate(document.getElementById('rtbRoiWow'), `周环比 ${getChangeSymbol(metrics.roi.wow)} ${metrics.roi.wow}`);

    // 添加颜色样式
    updateAllChangeColors();
}

// 创建或更新RTB明细表
function createOrUpdateRtbDetailTable(filterType = 'overall') {
    const tableElement = document.getElementById('rtbDetailTable');
    if (!tableElement) return;

    // 清空表格
    tableElement.innerHTML = '';
    tableElement.className = 'table table-hover table-striped';
    
    // 根据列数设置合适的最小宽度
    if (filterType === 'overall' || filterType === 'plan' || filterType === 'product') {
        tableElement.style.minWidth = '1500px'; // 确保表格有足够宽度显示所有列
    }

    // 创建表头
    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    const headerRow = document.createElement('tr');

    let columns = [];

    if (filterType === 'overall') {
        columns = [
            { title: '周次', align: 'center' },
            { title: '曝光数', align: 'right' },
            { title: '点击数', align: 'right' },
            { title: '点击率', align: 'right' },
            { title: '订单量', align: 'right' },
            { title: '订单转化率', align: 'right' },
            { title: '引导GMV', align: 'right' },
            { title: '预算金额', align: 'right' },
            { title: '消耗金额', align: 'right' },
            { title: '预算消耗进度', align: 'right' },
            { title: '千次曝光成本', align: 'right' },
            { title: '点击成本', align: 'right' }
        ];
    } else if (filterType === 'plan') {
        columns = [
            { title: '投放计划', align: 'left' },
            { title: '曝光数', align: 'right' },
            { title: '点击数', align: 'right' },
            { title: '点击率', align: 'right' },
            { title: '订单量', align: 'right' },
            { title: '订单转化率', align: 'right' },
            { title: '引导GMV', align: 'right' },
            { title: '预算金额', align: 'right' },
            { title: '消耗金额', align: 'right' },
            { title: '预算消耗进度', align: 'right' },
            { title: '千次曝光成本', align: 'right' },
            { title: '点击成本', align: 'right' }
        ];
    } else if (filterType === 'product') {
        columns = [
            { title: '商品名称', align: 'left' },
            { title: '曝光数', align: 'right' },
            { title: '点击数', align: 'right' },
            { title: '点击率', align: 'right' },
            { title: '订单量', align: 'right' },
            { title: '订单转化率', align: 'right' },
            { title: '引导GMV', align: 'right' },
            { title: '预算金额', align: 'right' },
            { title: '消耗金额', align: 'right' },
            { title: '预算消耗进度', align: 'right' },
            { title: '千次曝光成本', align: 'right' },
            { title: '点击成本', align: 'right' }
        ];
    }

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.title;
        th.className = `text-${col.align}`;
        th.style.whiteSpace = 'nowrap';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // 创建表体
    const tbody = document.createElement('tbody');

    // 生成数据
    const rowCount = filterType === 'overall' ? 6 : 8;
    for (let i = 0; i < rowCount; i++) {
        const tr = document.createElement('tr');

        // 第一列：维度字段
        const dimensionTd = document.createElement('td');
        if (filterType === 'overall') {
            const weekNum = dayjs().subtract(5-i, 'weeks').isoWeek();
            dimensionTd.textContent = `W${weekNum}`;
            dimensionTd.className = 'text-center fw-bold';
        } else if (filterType === 'plan') {
            const plans = ['品牌推广计划', '商品推广计划', '店铺推广计划', '活动推广计划', '新品推广计划', '清仓推广计划', '节日推广计划', '会员推广计划'];
            dimensionTd.textContent = plans[i];
            dimensionTd.className = 'text-start fw-bold';
        } else if (filterType === 'product') {
            const products = ['iPhone 15 Pro', '华为Mate60', '小米14 Ultra', 'OPPO Find X7', 'vivo X100', '荣耀Magic6', '一加12', '真我GT5'];
            dimensionTd.textContent = products[i];
            dimensionTd.className = 'text-start fw-bold';
        }
        tr.appendChild(dimensionTd);

        // 其他数据列
        const impressions = Math.floor(Math.random() * 500000) + 100000;
        const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
        const ctr = ((clicks / impressions) * 100).toFixed(2);
        const orders = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
        const cvr = ((orders / clicks) * 100).toFixed(2);
        const gmv = Math.floor(orders * (Math.random() * 500 + 200));
        const budget = Math.floor(Math.random() * 50000) + 20000;
        const consumption = Math.floor(budget * (Math.random() * 0.4 + 0.6));
        const progress = ((consumption / budget) * 100).toFixed(1);
        const cpm = (consumption / impressions * 1000).toFixed(2);
        const cpc = (consumption / clicks).toFixed(2);

        const data = [
            new Intl.NumberFormat('zh-CN').format(impressions),
            new Intl.NumberFormat('zh-CN').format(clicks),
            ctr + '%',
            new Intl.NumberFormat('zh-CN').format(orders),
            cvr + '%',
            new Intl.NumberFormat('zh-CN').format(gmv),
            new Intl.NumberFormat('zh-CN').format(budget),
            new Intl.NumberFormat('zh-CN').format(consumption),
            progress + '%',
            '¥' + cpm,
            '¥' + cpc
        ];

        data.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            td.className = 'text-end';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }

    tableElement.appendChild(thead);
    tableElement.appendChild(tbody);
}

// 更新供给数据
function updateSupplyData(baseDate = null) {
    try {
        showLoading();
        console.log('Updating supply data:', { platform: currentPlatform });
        const data = mockData.getSupplyData(currentPlatform, baseDate);

        // 更新指标卡
        updateSupplyKPIs(data.metrics);

        // 初始化趋势图
        setTimeout(() => {
            updateSupplyTrendChart(currentSupplyMetric, document.querySelector(`[data-metric="${currentSupplyMetric}"]`)?.dataset.metricName || '铺货店铺数');
        }, 100);

        // 初始化筛选器事件
        initSupplyFilterEvents();

        // 初始化明细表 - 现在使用React组件
        // createOrUpdateSupplyDetailTable('overall');

    } catch (error) {
        console.error('Error in updateSupplyData:', error);
        showError('更新供给数据失败，请检查控制台获取详细信息');
    } finally {
        hideLoading();
    }
}

// 初始化供给筛选器事件
function initSupplyFilterEvents() {
    const filterButtons = document.querySelectorAll('input[name="supplyFilter"]');
    filterButtons.forEach(button => {
        button.addEventListener('change', function() {
            if (this.checked) {
                // 现在使用React组件，筛选功能在组件内部处理
                // createOrUpdateSupplyDetailTable(this.value);
            }
        });
    });
}

// 更新用户数据
function updateUserData(baseDate = null) {
    try {
        showLoading();
        console.log('Updating user data:', { platform: currentPlatform });

        // 检查mockData是否存在
        if (!mockData || !mockData.getUserData) {
            console.error('mockData or getUserData function not found');
            showError('数据模块未正确加载');
            return;
        }

        const data = mockData.getUserData(currentPlatform);
        console.log('User data received:', data);

        // 更新指标卡
        if (data && data.metrics) {
            console.log('Updating user KPIs...');
            updateUserKPIs(data.metrics);
        } else {
            console.error('No metrics data found');
        }

        // 更新图表
        if (data && data.charts) {
            console.log('Updating user charts...');
            try {
                createOrUpdateUserDistributionChart(data.charts.distribution);
                createOrUpdateUserPerformanceChart(data.charts.performance);
            } catch (chartError) {
                console.error('Error updating charts:', chartError);
            }
        } else {
            console.error('No charts data found');
        }

        // 更新明细表格
        if (data && data.detail) {
            console.log('Updating user detail table...');
            try {
                updateUserDetailTable(data.detail);
            } catch (tableError) {
                console.error('Error updating table:', tableError);
            }
        } else {
            console.error('No detail data found');
        }

        console.log('User data update completed successfully');

    } catch (error) {
        console.error('Error in updateUserData:', error);
        showError('更新用户数据失败，请检查控制台获取详细信息');
    } finally {
        hideLoading();
    }
}

// 更新RTB数据
function updateRtbData(baseDate = null) {
    try {
        showLoading();
        console.log('Updating RTB data:', { platform: currentPlatform });
        const data = mockData.getRtbData(currentPlatform, baseDate);

        // 更新指标卡
        updateRtbKPIs(data.metrics);

        // 初始化趋势图
        setTimeout(() => {
            updateRtbTrendChart(currentRtbMetric, document.querySelector(`[data-metric="${currentRtbMetric}"]`)?.dataset.metricName || '消耗');
        }, 100);

        // 初始化筛选器事件
        initRtbFilterEvents();

        // 初始化明细表 - 现在使用React组件
        // createOrUpdateRtbDetailTable('overall');

    } catch (error) {
        console.error('Error in updateRtbData:', error);
        showError('更新RTB数据失败，请检查控制台获取详细信息');
    } finally {
        hideLoading();
    }
}

// 初始化RTB筛选器事件
function initRtbFilterEvents() {
    const filterButtons = document.querySelectorAll('input[name="rtbFilter"]');
    filterButtons.forEach(button => {
        button.addEventListener('change', function() {
            if (this.checked) {
                // 现在使用React组件，筛选功能在组件内部处理
                // createOrUpdateRtbDetailTable(this.value);
            }
        });
    });
}

// 更新活动数据
function updateActivityData(baseDate = null) {
    try {
        showLoading();
        console.log('Updating activity data:', { platform: currentPlatform });
        const data = mockData.getActivityData(currentPlatform, baseDate);

        // 更新指标卡
        updateActivityKPIs(data.metrics);

        // 更新趋势图
        createOrUpdateActivityTrendChart(data.chart);

        // 更新活动详细数据表格
        updateActivityDetailDataTable(baseDate);

        // 更新活动明细表格
        updateActivityDetailTable('city');

    } catch (error) {
        console.error('Error in updateActivityData:', error);
        showError('更新活动数据失败，请检查控制台获取详细信息');
    } finally {
        hideLoading();
    }
}

// 更新通用数据
function updateGenericData(baseDate = null) {
    const selectedDate = baseDate || new Date();
    const weekNum = dayjs(selectedDate).isoWeek();
    const data = mockData.getData(currentDomain, currentPlatform, weekNum, selectedDate);
    
    // 更新标题
    document.querySelector('#generic-content h5').textContent = data.title;
    
    // 更新指标卡片
    const metricsContainer = document.getElementById('genericMetricCards');
    metricsContainer.innerHTML = data.metrics.map(metric => `
        <div class="col-md-3">
            <div class="card metric-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${metric.name}</h5>
                    <div class="metric-main">
                        <p class="metric-value">${metric.value}</p>
                    </div>
                    <div class="metric-secondary">
                        <div>
                            <span class="metric-label">同比</span>
                            <span class="metric-value ${metric.yoy >= 0 ? 'text-success' : 'text-danger'}">
                                ${metric.yoy >= 0 ? '+' : ''}${metric.yoy}%
                            </span>
                        </div>
                        <div>
                            <span class="metric-label">环比</span>
                            <span class="metric-value ${metric.wow >= 0 ? 'text-success' : 'text-danger'}">
                                ${metric.wow >= 0 ? '+' : ''}${metric.wow}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // 更新趋势图
    updateTrendChart(data.chart);
}

// 更新通用趋势图
function updateTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 更新图表类型
function updateChartType(isLine) {
    if (charts.trend) {
        charts.trend.config.type = isLine ? 'line' : 'bar';
        charts.trend.update();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initWeekPicker();
    initEventListeners();
    refreshData();
}); 

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 显示错误信息
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'alert alert-danger alert-dismissible fade show';
    errorEl.role = 'alert';
    errorEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorEl, container.firstChild);
    }
} 

// 更新窗口调整大小的处理
window.addEventListener('resize', debounce(() => {
    const charts = [
        dimensionComboChart,
        gmvTrendChart,
        dimensionPieChart,
        trendChart,
        userDistributionChart,
        userPerformanceChart
    ].filter(Boolean);
    charts.forEach(chart => {
        if (chart) {
            chart.canvas.style.width = '100%';
            chart.canvas.style.maxWidth = '100%';
            chart.resize();

            // 强制重新计算布局
            setTimeout(() => {
                chart.update('none');
            }, 50);
        }
    });
}, 250));

// Ant Design风格表格渲染函数

// 渲染变化值的辅助函数
function renderChangeValue(value, unit = '%') {
    const isPositive = value >= 0;
    const symbol = isPositive ? '▲' : '▼';
    const className = isPositive ? 'text-success' : 'text-danger';
    return `<span class="${className}">${symbol} ${Math.abs(value)}${unit}</span>`;
}

// 数字格式化
function formatNumber(num) {
    return new Intl.NumberFormat('zh-CN').format(num);
}

// 添加表格信息提示
function addTableInfo(tableBodyId, rowCount) {
    const tbody = document.getElementById(tableBodyId);
    if (tbody) {
        const tableContainer = tbody.closest('.table-scroll-container');
        if (tableContainer) {
            // 移除已存在的信息提示
            const existingInfo = tableContainer.parentElement.querySelector('.table-info');
            if (existingInfo) {
                existingInfo.remove();
            }

            // 创建新的信息提示
            const infoDiv = document.createElement('div');
            infoDiv.className = 'table-info';
            infoDiv.style.cssText = `
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 8px;
                padding: 4px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            `;
            infoDiv.innerHTML = `📊 共 ${rowCount} 条数据 | 支持垂直和水平滚动查看完整内容`;

            // 将信息提示添加到表格容器后面
            tableContainer.parentElement.appendChild(infoDiv);
        }
    }
}

// 活动详细数据表格渲染
function renderActivityTable() {
    const mechanisms = ['满减券', '折扣券', '立减券', '新人券', '会员券', '品类券', '生日券', '节日券', '限时券', '首购券', '复购券', '邀请券', '积分券', '等级券', '专享券'];

    const data = mechanisms.map(mechanism => {
        const gmv = Math.floor(Math.random() * 50000000) + 20000000;
        const verification = Math.floor(gmv * (Math.random() * 0.4 + 0.5));
        const costRatio = (Math.random() * 10 + 8).toFixed(1);
        const userCount = Math.floor(Math.random() * 500000) + 100000;
        const conversionRate = (Math.random() * 15 + 5).toFixed(1);
        const unitPrice = Math.floor(gmv / userCount);
        const repurchaseRate = (Math.random() * 30 + 20).toFixed(1);
        const usageRate = (Math.random() * 40 + 60).toFixed(1);

        return {
            mechanism,
            gmv,
            gmvYoy: (Math.random() * 40 - 20).toFixed(1),
            verification,
            verificationYoy: (Math.random() * 35 - 15).toFixed(1),
            costRatio: parseFloat(costRatio),
            costRatioYoy: (Math.random() * 8 - 4).toFixed(1),
            userCount,
            conversionRate: parseFloat(conversionRate),
            unitPrice,
            repurchaseRate: parseFloat(repurchaseRate),
            usageRate: parseFloat(usageRate)
        };
    });

    const tbody = document.getElementById('activity-table-body');
    if (tbody) {
        tbody.innerHTML = data.map(row => `
            <tr>
                <td class="fixed-left" style="font-weight: 600;">${row.mechanism}</td>
                <td>${formatNumber(row.gmv)}</td>
                <td>${renderChangeValue(parseFloat(row.gmvYoy))}</td>
                <td>${formatNumber(row.verification)}</td>
                <td>${renderChangeValue(parseFloat(row.verificationYoy))}</td>
                <td>${row.costRatio}%</td>
                <td>${renderChangeValue(parseFloat(row.costRatioYoy), 'pp')}</td>
                <td>${formatNumber(row.userCount)}</td>
                <td>${row.conversionRate}%</td>
                <td>¥${formatNumber(row.unitPrice)}</td>
                <td>${row.repurchaseRate}%</td>
                <td>${row.usageRate}%</td>
            </tr>
        `).join('');

        // 添加数据行数提示
        addTableInfo('activity-table-body', data.length);
        console.log('Activity table rendered successfully');
    }
}

// 供给明细数据表格渲染
function renderSupplyTable(type = 'overall') {
    const headers = {
        overall: ['周次', 'GMV', 'GMV占比', 'GMV周环比', '铺货门店数', '门店数周环比', '店铺渗透率', '渗透率周环比', '店铺动销率', '动销率周环比', '店均SKU数', 'SKU数周环比', 'SKU售罄率', '售罄率周环比'],
        channel: ['重点渠道', 'GMV', 'GMV占比', 'GMV周环比', '铺货门店数', '门店数周环比', '店铺渗透率', '渗透率周环比', '店铺动销率', '动销率周环比', '店均SKU数', 'SKU数周环比', 'SKU售罄率', '售罄率周环比'],
        product: ['重点商品', 'GMV', 'GMV占比', 'GMV周环比', '铺货门店数', '门店数周环比', '店铺渗透率', '渗透率周环比', '店铺动销率', '动销率周环比', '店均SKU数', 'SKU数周环比', 'SKU售罄率', '售罄率周环比']
    };

    const thead = document.getElementById('supply-table-head');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th class="fixed-left">${headers[type][0]}</th>
                ${headers[type].slice(1).map(h => `<th>${h}</th>`).join('')}
            </tr>
        `;
    }

    // 生成示例数据
    const generateData = () => {
        const dimensions = {
            overall: ['W40', 'W41', 'W42', 'W43', 'W44', 'W45', 'W46', 'W47', 'W48', 'W49', 'W50', 'W51'],
            channel: ['天猫旗舰店', '京东自营', '抖音小店', '拼多多官方', '微信小程序', '线下门店', '苏宁易购', '唯品会', '小红书', '快手小店', '美团', '饿了么'],
            product: ['iPhone 15 Pro', '华为Mate60', '小米14 Ultra', 'OPPO Find X7', 'vivo X100', '荣耀Magic6', '一加12', '真我GT5', 'iQOO 12', '红米K70', '华为nova12', 'OPPO Reno11']
        };

        return dimensions[type].map(dim => ({
            dimension: dim,
            gmv: Math.floor(Math.random() * 200000000) + 50000000,
            gmvRatio: (Math.random() * 20 + 5).toFixed(1),
            gmvWow: (Math.random() * 40 - 20).toFixed(1),
            storeCount: Math.floor(Math.random() * 5000) + 1000,
            storeCountWow: (Math.random() * 20 - 10).toFixed(1),
            storePenetration: (Math.random() * 30 + 60).toFixed(1),
            storePenetrationWow: (Math.random() * 10 - 5).toFixed(1),
            storeSalesRate: (Math.random() * 20 + 70).toFixed(1),
            storeSalesRateWow: (Math.random() * 8 - 4).toFixed(1),
            avgSkuPerStore: Math.floor(Math.random() * 30) + 15,
            avgSkuPerStoreWow: (Math.random() * 15 - 8).toFixed(1),
            skuSelloutRate: (Math.random() * 15 + 5).toFixed(1),
            skuSelloutRateWow: (Math.random() * 25 - 10).toFixed(1)
        }));
    };

    const data = generateData();
    const tbody = document.getElementById('supply-table-body');
    if (tbody) {
        tbody.innerHTML = data.map(row => `
            <tr>
                <td class="fixed-left" style="font-weight: 600;">${row.dimension}</td>
                <td>${formatNumber(row.gmv)}</td>
                <td>${row.gmvRatio}%</td>
                <td>${renderChangeValue(parseFloat(row.gmvWow))}</td>
                <td>${formatNumber(row.storeCount)}</td>
                <td>${renderChangeValue(parseFloat(row.storeCountWow))}</td>
                <td>${row.storePenetration}%</td>
                <td>${renderChangeValue(parseFloat(row.storePenetrationWow), 'pp')}</td>
                <td>${row.storeSalesRate}%</td>
                <td>${renderChangeValue(parseFloat(row.storeSalesRateWow), 'pp')}</td>
                <td>${row.avgSkuPerStore}</td>
                <td>${renderChangeValue(parseFloat(row.avgSkuPerStoreWow))}</td>
                <td>${row.skuSelloutRate}%</td>
                <td>${renderChangeValue(parseFloat(row.skuSelloutRateWow), 'pp')}</td>
            </tr>
        `).join('');

        // 添加数据行数提示
        addTableInfo('supply-table-body', data.length);
        console.log(`Supply table rendered for ${type}`);
    }
}

// RTB明细数据表格渲染
function renderRTBTable(type = 'overall') {
    const headers = {
        overall: ['周次', '曝光数', '点击数', '点击率', '订单量', '订单转化率', '引导GMV', '预算金额', '消耗金额', '预算消耗进度', '千次曝光成本', '点击成本', '获客成本', 'ROI'],
        plan: ['投放计划', '曝光数', '点击数', '点击率', '订单量', '订单转化率', '引导GMV', '预算金额', '消耗金额', '预算消耗进度', '千次曝光成本', '点击成本', '获客成本', 'ROI'],
        product: ['商品名称', '曝光数', '点击数', '点击率', '订单量', '订单转化率', '引导GMV', '预算金额', '消耗金额', '预算消耗进度', '千次曝光成本', '点击成本', '获客成本', 'ROI']
    };

    const thead = document.getElementById('rtb-table-head');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th class="fixed-left">${headers[type][0]}</th>
                ${headers[type].slice(1).map(h => `<th>${h}</th>`).join('')}
            </tr>
        `;
    }

    // 生成示例数据
    const generateData = () => {
        const dimensions = {
            overall: ['W40', 'W41', 'W42', 'W43', 'W44', 'W45', 'W46', 'W47', 'W48', 'W49', 'W50', 'W51'],
            plan: ['品牌推广计划', '商品推广计划', '店铺推广计划', '活动推广计划', '新品推广计划', '清仓推广计划', '节日推广计划', '会员推广计划', '新客推广计划', '复购推广计划', '直播推广计划', '短视频推广计划'],
            product: ['iPhone 15 Pro', '华为Mate60', '小米14 Ultra', 'OPPO Find X7', 'vivo X100', '荣耀Magic6', '一加12', '真我GT5', 'iQOO 12', '红米K70', '华为nova12', 'OPPO Reno11']
        };

        return dimensions[type].map(dim => {
            const impressions = Math.floor(Math.random() * 500000) + 100000;
            const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
            const orders = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
            const budget = Math.floor(Math.random() * 50000) + 20000;
            const consumption = Math.floor(budget * (Math.random() * 0.4 + 0.6));
            const gmv = Math.floor(orders * (Math.random() * 500 + 200));
            const progress = ((consumption / budget) * 100).toFixed(1);
            const cpm = (consumption / impressions * 1000).toFixed(2);
            const cpc = (consumption / clicks).toFixed(2);
            const cpa = (consumption / orders).toFixed(2);
            const roi = (gmv / consumption).toFixed(2);

            return {
                dimension: dim,
                impressions,
                clicks,
                ctr: ((clicks / impressions) * 100).toFixed(2),
                orders,
                cvr: ((orders / clicks) * 100).toFixed(2),
                gmv,
                budget,
                consumption,
                progress,
                cpm,
                cpc,
                cpa,
                roi
            };
        });
    };

    const data = generateData();
    const tbody = document.getElementById('rtb-table-body');
    if (tbody) {
        tbody.innerHTML = data.map(row => `
            <tr>
                <td class="fixed-left" style="font-weight: 600;">${row.dimension}</td>
                <td>${formatNumber(row.impressions)}</td>
                <td>${formatNumber(row.clicks)}</td>
                <td>${row.ctr}%</td>
                <td>${formatNumber(row.orders)}</td>
                <td>${row.cvr}%</td>
                <td>${formatNumber(row.gmv)}</td>
                <td>${formatNumber(row.budget)}</td>
                <td>${formatNumber(row.consumption)}</td>
                <td>${row.progress}%</td>
                <td>¥${row.cpm}</td>
                <td>¥${row.cpc}</td>
                <td>¥${row.cpa}</td>
                <td>${row.roi}</td>
            </tr>
        `).join('');

        // 添加数据行数提示
        addTableInfo('rtb-table-body', data.length);
        console.log(`RTB table rendered for ${type}`);
    }
}

// 筛选器切换函数
function switchSupplyFilter(type, button) {
    // 更新按钮状态
    const buttons = button.parentElement.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // 重新渲染表格
    renderSupplyTable(type);
}

function switchRTBFilter(type, button) {
    // 更新按钮状态
    const buttons = button.parentElement.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // 重新渲染表格
    renderRTBTable(type);
}

// 初始化Ant Design风格表格
function initAntDesignTables() {
    console.log('Initializing Ant Design style tables...');

    // 延迟渲染，确保DOM已完全加载
    setTimeout(() => {
        renderActivityTable();
        renderSupplyTable('overall');
        renderRTBTable('overall');
        console.log('All Ant Design style tables rendered successfully');
    }, 500);
}

// 用户图表变量
let userDistributionChart = null;
let userPerformanceChart = null;
let currentUserMetric = 'sales'; // 当前选择的指标
let currentDistributionMode = 'value'; // 当前分布图模式：value(数值) 或 ratio(占比)
let userChartData = null; // 存储图表数据

// 创建或更新新老客分布图表
function createOrUpdateUserDistributionChart(data) {
    const ctx = document.getElementById('userDistributionChart');
    if (!ctx) return;

    // 存储数据供切换使用
    userChartData = data;

    if (userDistributionChart) {
        userDistributionChart.destroy();
    }

    // 根据当前模式选择数据
    const chartData = {
        labels: data.labels,
        datasets: currentDistributionMode === 'value' ? data.valueData : data.ratioData
    };

    userDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            const value = context.parsed.y;
                            const lines = [];

                            if (currentDistributionMode === 'value') {
                                // 数值模式：只显示数值和周环比
                                lines.push(new Intl.NumberFormat('zh-CN').format(value));

                                // 添加周环比信息（上下结构）
                                if (dataset.weekOverWeek && dataset.weekOverWeek[context.dataIndex] !== 0) {
                                    const wow = dataset.weekOverWeek[context.dataIndex];
                                    const wowStr = wow > 0 ? `↑ ${wow.toFixed(1)}%` : `↓ ${Math.abs(wow).toFixed(1)}%`;
                                    lines.push(`周环比 ${wowStr}`);
                                }

                                // 不显示占比信息

                            } else {
                                // 占比模式：显示标题和百分比
                                const ratioTitle = dataset.label === '新客占比' ? '新客占比' : '老客占比';
                                lines.push(`${ratioTitle}: ${value}%`);
                            }

                            return lines;
                        },
                        title: function(context) {
                            const datasetIndex = context[0].datasetIndex;
                            const dataset = context[0].chart.data.datasets[datasetIndex];

                            // 根据模式返回不同的标题
                            if (currentDistributionMode === 'value') {
                                return dataset.label;
                            } else {
                                // 占比模式不显示标题，因为标题已经包含在label中
                                return '';
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: currentDistributionMode === 'ratio' ? 100 : undefined,
                    ticks: {
                        callback: function(value) {
                            if (currentDistributionMode === 'value') {
                                return new Intl.NumberFormat('zh-CN').format(value);
                            } else {
                                return value + '%';
                            }
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// 创建或更新新老客表现图表
function createOrUpdateUserPerformanceChart(data) {
    const ctx = document.getElementById('userPerformanceChart');
    if (!ctx) return;

    if (userPerformanceChart) {
        userPerformanceChart.destroy();
    }

    const chartData = {
        labels: data.labels,
        datasets: data.datasets[currentUserMetric].data
    };

    // 计算占比（仅销售额时显示）
    let ratios = null;
    if (currentUserMetric === 'sales' && data.datasets[currentUserMetric].getRatios) {
        ratios = data.datasets[currentUserMetric].getRatios();
    }

    userPerformanceChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const dataset = context.dataset;
                            const lines = [];

                            if (currentUserMetric === 'sales') {
                                // 主要数值
                                lines.push(new Intl.NumberFormat('zh-CN').format(value));

                                // 添加周环比信息
                                if (dataset.weekOverWeek && dataset.weekOverWeek[context.dataIndex] !== 0) {
                                    const wow = dataset.weekOverWeek[context.dataIndex];
                                    const wowStr = wow > 0 ? `↑ ${wow.toFixed(1)}%` : `↓ ${Math.abs(wow).toFixed(1)}%`;
                                    lines.push(`周环比 ${wowStr}`);
                                }

                                // 添加占比信息（上下结构）
                                if (ratios) {
                                    const ratio = context.datasetIndex === 0 ? ratios.newRatios[context.dataIndex] : ratios.oldRatios[context.dataIndex];
                                    const ratioLabel = context.datasetIndex === 0 ? '新客销售额占比' : '老客销售额占比';
                                    lines.push(`${ratioLabel}: ${ratio}%`);
                                }
                            } else {
                                // 主要数值
                                lines.push(new Intl.NumberFormat('zh-CN').format(value));

                                // 添加周环比信息
                                if (dataset.weekOverWeek && dataset.weekOverWeek[context.dataIndex] !== 0) {
                                    const wow = dataset.weekOverWeek[context.dataIndex];
                                    const wowStr = wow > 0 ? `↑ ${wow.toFixed(1)}%` : `↓ ${Math.abs(wow).toFixed(1)}%`;
                                    lines.push(`周环比 ${wowStr}`);
                                }
                            }

                            return lines;
                        },
                        title: function(context) {
                            const datasetIndex = context[0].datasetIndex;
                            const dataset = context[0].chart.data.datasets[datasetIndex];
                            return dataset.label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('zh-CN').format(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// 在页面加载完成后初始化表格
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Ant Design tables...');
    initAntDesignTables();

    // 初始化用户图表事件监听器
    initUserChartEventListeners();
});

// 初始化用户图表事件监听器
function initUserChartEventListeners() {
    // 指标切换事件
    const metricSelect = document.getElementById('userPerformanceMetricSelect');
    if (metricSelect) {
        metricSelect.addEventListener('change', function() {
            currentUserMetric = this.value;
            // 重新获取数据并更新图表
            const data = mockData.getUserData(currentPlatform);
            if (data.charts) {
                createOrUpdateUserPerformanceChart(data.charts.performance);
            }
        });
    }

    // 分布图数值/占比切换事件
    const distributionValueBtn = document.getElementById('userDistributionValueBtn');
    const distributionRatioBtn = document.getElementById('userDistributionRatioBtn');

    if (distributionValueBtn && distributionRatioBtn) {
        distributionValueBtn.addEventListener('click', function() {
            currentDistributionMode = 'value';
            distributionValueBtn.classList.add('active');
            distributionRatioBtn.classList.remove('active');

            // 重新更新图表
            if (userChartData) {
                createOrUpdateUserDistributionChart(userChartData);
            }
        });

        distributionRatioBtn.addEventListener('click', function() {
            currentDistributionMode = 'ratio';
            distributionRatioBtn.classList.add('active');
            distributionValueBtn.classList.remove('active');

            // 重新更新图表
            if (userChartData) {
                createOrUpdateUserDistributionChart(userChartData);
            }
        });
    }
}

// 用户明细表格相关变量
let currentUserFilter = 'overall';
let userDetailData = null;

// 更新用户明细表格
function updateUserDetailTable(data) {
    userDetailData = data;
    renderUserDetailTable();
}

// 渲染用户明细表格
function renderUserDetailTable() {
    if (!userDetailData) return;

    const tableHead = document.getElementById('user-table-head');
    const tableBody = document.getElementById('user-table-body');

    if (!tableHead || !tableBody) return;

    // 根据当前筛选条件生成表头和数据
    const { topHeaders, bottomHeaders, rows } = generateUserTableData();

    // 渲染多级表头
    tableHead.innerHTML = `
        <tr>
            ${topHeaders.map(header => {
                let attrs = '';
                if (header.colspan) attrs += ` colspan="${header.colspan}"`;
                if (header.rowspan) attrs += ` rowspan="${header.rowspan}"`;
                return `<th${attrs} class="text-center">${header.title}</th>`;
            }).join('')}
        </tr>
        <tr>
            ${bottomHeaders.map(header => `<th class="text-center">${header.title}</th>`).join('')}
        </tr>
    `;

    // 渲染表体
    tableBody.innerHTML = rows.map(row => `
        <tr>
            ${row.map((cell, index) => `<td class="${index === 0 ? 'text-center fw-bold' : 'text-right'}">${cell}</td>`).join('')}
        </tr>
    `).join('');
}

// 生成用户表格数据
function generateUserTableData() {
    let topHeaders = [];
    let bottomHeaders = [];
    let rows = [];

    switch (currentUserFilter) {
        case 'overall':
            // 顶级表头：周次 + 新客 + 老客
            topHeaders = [
                { title: '周', rowspan: 2 },
                { title: '新客', colspan: 8 },
                { title: '老客', colspan: 8 }
            ];

            // 二级表头：具体指标
            bottomHeaders = [
                // 新客指标
                { title: '数量' },
                { title: '数量占比' },
                { title: '数量周环比' },
                { title: '销售额' },
                { title: '销售额占比' },
                { title: '销售额周环比' },
                { title: '客单价' },
                { title: '客单价周环比' },
                // 老客指标
                { title: '数量' },
                { title: '数量占比' },
                { title: '数量周环比' },
                { title: '销售额' },
                { title: '销售额占比' },
                { title: '销售额周环比' },
                { title: '客单价' },
                { title: '客单价周环比' }
            ];

            rows = userDetailData.map(row => [
                row.week,
                // 新客数据
                new Intl.NumberFormat('zh-CN').format(row.newUserCount),
                row.newUserCountRatio,
                row.newUserCountWow,
                new Intl.NumberFormat('zh-CN').format(row.newUserSales),
                row.newUserSalesRatio,
                row.newUserSalesWow,
                new Intl.NumberFormat('zh-CN').format(row.newUserAvgOrder),
                row.newUserAvgOrderWow,
                // 老客数据
                new Intl.NumberFormat('zh-CN').format(row.oldUserCount),
                row.oldUserCountRatio,
                row.oldUserCountWow,
                new Intl.NumberFormat('zh-CN').format(row.oldUserSales),
                row.oldUserSalesRatio,
                row.oldUserSalesWow,
                new Intl.NumberFormat('zh-CN').format(row.oldUserAvgOrder),
                row.oldUserAvgOrderWow
            ]);
            break;

        case 'new':
            // 新客单独显示时的表头
            topHeaders = [
                { title: '周', rowspan: 2 },
                { title: '新客', colspan: 8 }
            ];

            bottomHeaders = [
                { title: '数量' },
                { title: '数量占比' },
                { title: '数量周环比' },
                { title: '销售额' },
                { title: '销售额占比' },
                { title: '销售额周环比' },
                { title: '客单价' },
                { title: '客单价周环比' }
            ];

            rows = userDetailData.map(row => [
                row.week,
                new Intl.NumberFormat('zh-CN').format(row.newUserCount),
                row.newUserCountRatio,
                row.newUserCountWow,
                new Intl.NumberFormat('zh-CN').format(row.newUserSales),
                row.newUserSalesRatio,
                row.newUserSalesWow,
                new Intl.NumberFormat('zh-CN').format(row.newUserAvgOrder),
                row.newUserAvgOrderWow
            ]);
            break;

        case 'old':
            // 老客单独显示时的表头
            topHeaders = [
                { title: '周', rowspan: 2 },
                { title: '老客', colspan: 8 }
            ];

            bottomHeaders = [
                { title: '数量' },
                { title: '数量占比' },
                { title: '数量周环比' },
                { title: '销售额' },
                { title: '销售额占比' },
                { title: '销售额周环比' },
                { title: '客单价' },
                { title: '客单价周环比' }
            ];

            rows = userDetailData.map(row => [
                row.week,
                new Intl.NumberFormat('zh-CN').format(row.oldUserCount),
                row.oldUserCountRatio,
                row.oldUserCountWow,
                new Intl.NumberFormat('zh-CN').format(row.oldUserSales),
                row.oldUserSalesRatio,
                row.oldUserSalesWow,
                new Intl.NumberFormat('zh-CN').format(row.oldUserAvgOrder),
                row.oldUserAvgOrderWow
            ]);
            break;
    }

    return { topHeaders, bottomHeaders, rows };
}

// 用户筛选切换函数
function switchUserFilter(filterType, element) {
    // 更新按钮状态
    document.querySelectorAll('.filter-group .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');

    // 更新当前筛选条件
    currentUserFilter = filterType;

    // 重新渲染表格
    renderUserDetailTable();
}

/**
 * 初始化活动筛选框
 */
function initActivityFilterSelect() {
    const filterSelect = document.getElementById('activityFilterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filterType = e.target.value;
            const selectedDate = weekPicker && weekPicker.selectedDates.length > 0 ? weekPicker.selectedDates[0] : new Date();
            updateActivityDetailTable(filterType, selectedDate);
        });
    }
}

// 初始化指标卡点击事件
function initMetricCardClicks() {
    // 活动指标卡点击事件
    document.querySelectorAll('#activity-content .clickable-metric').forEach(card => {
        card.addEventListener('click', function() {
            const metric = this.dataset.metric;

            // 排除核销进度，不在趋势分析中展示
            if (metric === 'verificationProgress') {
                console.log('核销进度不在趋势分析中展示');
                return;
            }

            // 更新当前选中的指标
            currentActivityMetric = metric;

            // 更新指标卡选中状态
            document.querySelectorAll('#activity-content .clickable-metric').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 更新趋势图
            createOrUpdateActivityTrendChart(metric, currentActivityDisplayMode);
        });
    });

    // 供给指标卡点击事件
    document.querySelectorAll('#supply-content .clickable-metric').forEach(card => {
        card.addEventListener('click', function() {
            const metric = this.dataset.metric;
            const metricName = this.dataset.metricName;

            // 更新当前选中的指标
            currentSupplyMetric = metric;

            // 更新指标卡选中状态
            document.querySelectorAll('#supply-content .clickable-metric').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 更新趋势图
            updateSupplyTrendChart(metric, metricName);
        });
    });

    // RTB指标卡点击事件
    document.querySelectorAll('#rtb-content .clickable-metric').forEach(card => {
        card.addEventListener('click', function() {
            const metric = this.dataset.metric;
            const metricName = this.dataset.metricName;

            // 更新当前选中的指标
            currentRtbMetric = metric;

            // 更新指标卡选中状态
            document.querySelectorAll('#rtb-content .clickable-metric').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // 更新趋势图
            updateRtbTrendChart(metric, metricName);
        });
    });

    // 默认选中第一个指标卡
    setTimeout(() => {
        const firstSupplyCard = document.querySelector('#supply-content .clickable-metric');
        const firstRtbCard = document.querySelector('#rtb-content .clickable-metric');

        if (firstSupplyCard) {
            firstSupplyCard.classList.add('active');
            currentSupplyMetric = firstSupplyCard.dataset.metric;
        }

        if (firstRtbCard) {
            firstRtbCard.classList.add('active');
            currentRtbMetric = firstRtbCard.dataset.metric;
        }
    }, 100);
}

// 创建或更新供给趋势图
function createOrUpdateSupplyTrendChart(data) {
    const ctx = document.getElementById('supplyTrendChart');
    if (!ctx) return;

    if (supplyTrendChart) {
        supplyTrendChart.destroy();
    }

    supplyTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    type: 'bar',
                    label: data.metricName + ' (左轴)',
                    data: data.values,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: data.isPercentageMetric ? '周环比pp (右轴)' : '周环比% (右轴)',
                    data: data.wowValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1',
                    tension: 0.3,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: data.metricName + ' 趋势分析',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;

                            if (datasetLabel.includes('周环比')) {
                                if (data.isPercentageMetric) {
                                    return `${datasetLabel}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}pp`;
                                } else {
                                    return `${datasetLabel}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                                }
                            } else {
                                if (data.isPercentageMetric) {
                                    return `${datasetLabel}: ${value.toFixed(1)}%`;
                                } else {
                                    return `${datasetLabel}: ${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '周次'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: data.metricName
                    },
                    ticks: {
                        callback: function(value) {
                            if (data.isPercentageMetric) {
                                return value.toFixed(1) + '%';
                            } else {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: data.isPercentageMetric ? '周环比pp' : '周环比%'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            const unit = data.isPercentageMetric ? 'pp' : '%';
                            return value >= 0 ? '+' + value.toFixed(1) + unit : value.toFixed(1) + unit;
                        }
                    }
                }
            }
        }
    });
}

// 创建或更新RTB趋势图
function createOrUpdateRtbTrendChart(data) {
    const ctx = document.getElementById('rtbTrendChart');
    if (!ctx) return;

    if (rtbTrendChart) {
        rtbTrendChart.destroy();
    }

    rtbTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    type: 'bar',
                    label: data.metricName + ' (左轴)',
                    data: data.values,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: '周环比% (右轴)',
                    data: data.wowValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1',
                    tension: 0.3,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: data.metricName + ' 趋势分析',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;

                            if (datasetLabel.includes('周环比')) {
                                return `${datasetLabel}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                            } else {
                                return `${datasetLabel}: ${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '周次'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: data.metricName
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '周环比%'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return value >= 0 ? '+' + value.toFixed(1) + '%' : value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// 更新供给趋势图
function updateSupplyTrendChart(metric, metricName) {
    try {
        // 生成8周的趋势数据
        const weeks = [];
        const values = [];
        const wowValues = [];

        // 判断是否为百分比指标
        const isPercentageMetric = ['storeSalesRate', 'skuStorePenetration', 'skuSelloutRate'].includes(metric);

        for (let i = 5; i >= 0; i--) {
            const weekDate = dayjs().subtract(i, 'week');
            weeks.push(`${weekDate.year()}-W${weekDate.isoWeek()}`);

            // 根据指标类型生成不同的数据
            let baseValue;
            let wowValue;

            switch(metric) {
                case 'storeCount':
                    baseValue = Math.floor(Math.random() * 1000) + 8000;
                    wowValue = (Math.random() - 0.5) * 20; // -10% 到 +10%
                    break;
                case 'storeSalesRate':
                    baseValue = Math.random() * 20 + 75; // 75-95%
                    wowValue = (Math.random() - 0.5) * 6; // -3pp 到 +3pp
                    break;
                case 'avgSkuPerStore':
                    baseValue = Math.floor(Math.random() * 50) + 150;
                    wowValue = (Math.random() - 0.5) * 20; // -10% 到 +10%
                    break;
                case 'skuStorePenetration':
                    baseValue = Math.random() * 15 + 60; // 60-75%
                    wowValue = (Math.random() - 0.5) * 4; // -2pp 到 +2pp
                    break;
                case 'skuSelloutRate':
                    baseValue = Math.random() * 10 + 85; // 85-95%
                    wowValue = (Math.random() - 0.5) * 5; // -2.5pp 到 +2.5pp
                    break;
                default:
                    baseValue = Math.floor(Math.random() * 1000) + 5000;
                    wowValue = (Math.random() - 0.5) * 20; // -10% 到 +10%
            }

            values.push(baseValue);
            wowValues.push(wowValue);
        }

        const chartData = {
            labels: weeks,
            values: values,
            wowValues: wowValues,
            metricName: metricName,
            isPercentageMetric: isPercentageMetric
        };

        createOrUpdateSupplyTrendChart(chartData);

        // 更新图表说明
        const periodElement = document.getElementById('supply-chart-period');
        if (periodElement) {
            periodElement.textContent = `近6周${metricName}数据`;
        }

    } catch (error) {
        console.error('Error updating supply trend chart:', error);
    }
}

// 更新RTB趋势图
function updateRtbTrendChart(metric, metricName) {
    try {
        // 生成8周的趋势数据
        const weeks = [];
        const values = [];
        const wowValues = [];

        for (let i = 5; i >= 0; i--) {
            const weekDate = dayjs().subtract(i, 'week');
            weeks.push(`${weekDate.year()}-W${weekDate.isoWeek()}`);

            // 根据指标类型生成不同的数据
            let baseValue;
            switch(metric) {
                case 'rtbConsumption':
                    baseValue = Math.floor(Math.random() * 50000) + 200000;
                    break;
                case 'rtbGuidedSales':
                    baseValue = Math.floor(Math.random() * 200000) + 800000;
                    break;
                case 'rtbRoi':
                    baseValue = Math.random() * 2 + 3; // 3-5
                    break;
                default:
                    baseValue = Math.floor(Math.random() * 100000) + 100000;
            }

            values.push(baseValue);
            wowValues.push((Math.random() - 0.5) * 30); // -15% 到 +15%
        }

        const chartData = {
            labels: weeks,
            values: values,
            wowValues: wowValues,
            metricName: metricName
        };

        createOrUpdateRtbTrendChart(chartData);

        // 更新图表说明
        const periodElement = document.getElementById('rtb-chart-period');
        if (periodElement) {
            periodElement.textContent = `近8周${metricName}数据`;
        }

    } catch (error) {
        console.error('Error updating RTB trend chart:', error);
    }
}