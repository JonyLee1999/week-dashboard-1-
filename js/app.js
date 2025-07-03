/* eslint-disable no-undef */

// 全局变量
let currentDomain = 'transaction';
let currentPlatform = 'all';
let currentDimension = 'subBrand';
let weekPicker;
let gmvTrendChart;
let dimensionPieChart, dimensionComboChart, dimensionDataTable;
let trendChart;
let dataTable;

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

    // YTD
    safeUpdate(domElements.gmvYTD, kpis.ytd.value);
    safeUpdate(domElements.gmvYOY, kpis.ytd.yoy);
    safeUpdate(domElements.gmvTarget, `${kpis.ytd.target_progress}%`);
    if (domElements.gmvTargetBar) {
        domElements.gmvTargetBar.style.width = `${kpis.ytd.target_progress}%`;
        domElements.gmvTargetBar.setAttribute('aria-valuenow', kpis.ytd.target_progress);
        domElements.gmvTargetBar.className = 'progress-bar'; // Reset
        if (kpis.ytd.target_progress < 40) {
            domElements.gmvTargetBar.classList.add('bg-danger');
        } else if (kpis.ytd.target_progress < 80) {
            domElements.gmvTargetBar.classList.add('bg-warning');
        } else {
            domElements.gmvTargetBar.classList.add('bg-success');
        }
    }

    // MTD
    safeUpdate(domElements.gmvMTD, kpis.mtd.value);
    safeUpdate(domElements.gmvMTDYOY, kpis.mtd.yoy);
    safeUpdate(domElements.gmvMTDTarget, `${kpis.mtd.target_progress}%`);
    if (domElements.gmvMTDTargetBar) {
        domElements.gmvMTDTargetBar.style.width = `${kpis.mtd.target_progress}%`;
        domElements.gmvMTDTargetBar.setAttribute('aria-valuenow', kpis.mtd.target_progress);
        domElements.gmvMTDTargetBar.className = 'progress-bar'; // Reset
         if (kpis.mtd.target_progress < 40) {
            domElements.gmvMTDTargetBar.classList.add('bg-danger');
        } else if (kpis.mtd.target_progress < 80) {
            domElements.gmvMTDTargetBar.classList.add('bg-warning');
        } else {
            domElements.gmvMTDTargetBar.classList.add('bg-success');
        }
    }

    // Weekly
    safeUpdate(domElements.gmvWeekTitle, weekText);
    safeUpdate(domElements.gmvWeek, kpis.w20.value);
    safeUpdate(domElements.gmvWeekYOY, kpis.w20.yoy);
    safeUpdate(domElements.gmvWOW, kpis.w20.wow);
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
                            text: 'GMV (元)'
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
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'GMV'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '占比 (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
            }
        });
    }
}

/**
 * 更新多维表现表格
 * @param {object} tableData - 表格数据
 */
function updateDimensionTable(tableData) {
    if (!domElements.dimensionDataTable) return;

    if (dimensionDataTable) {
        dimensionDataTable.destroy();
        $(domElements.dimensionDataTable).empty();
    }
    
    const { headers, rows, columns } = tableData;

    // 1. Build the HTML for the header
    let thead = '<thead>';
    // Top row
    thead += '<tr>';
    headers.top.forEach(h => {
        thead += `<th rowspan="${h.rowspan || 1}" colspan="${h.colspan || 1}" class="text-center align-middle">${h.title}</th>`;
    });
    thead += '</tr>';
    // Bottom row
    thead += '<tr>';
    headers.bottom.forEach(h => {
        thead += `<th class="text-center">${h.title}</th>`;
    });
    thead += '</tr>';
    thead += '</thead>';
    $(domElements.dimensionDataTable).html(thead);

    // 2. Initialize DataTables
    dimensionDataTable = $(domElements.dimensionDataTable).DataTable({
        data: rows,
        columns: columns,
        paging: false,
        searching: false,
        info: false,
        ordering: true,
        scrollX: true,
        fixedColumns: {
            left: 1
        },
        destroy: true,
        autoWidth: false,
        // Add cell rendering for negative values
        "columnDefs": [ {
            "targets": "_all",
            "createdCell": function (td, cellData) {
                if (typeof cellData === 'string' && cellData.startsWith('-')) {
                    $(td).addClass('text-danger');
                }
            }
        } ]
    });
}


/**
 * 加载并更新多维表现数据
 */
function loadDimensionData() {
    const data = mockData.getMultiDimensionData(currentPlatform, currentDimension);

    if (data.pie) {
        createOrUpdateDimensionPieChart(data.pie);
    }
    if (data.combo) {
        createOrUpdateDimensionComboChart(data.combo);
    }
    if (data.table) {
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
                const data = mockData.getTransactionData(currentPlatform, weekNum);
                if(data.kpis) updateTransactionKPIs(data.kpis, weekText);
                if(data.chart) createOrUpdateGmvTrendChart(data.chart);
                loadDimensionData();
            } else {
                const data = mockData.getData(currentDomain, currentPlatform, weekNum);
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
 * 初始化日期选择器
 */
function initWeekPicker() {
    dayjs.locale('zh-cn');
    dayjs.extend(dayjs_plugin_isoWeek);

    weekPicker = flatpickr(domElements.weekPickerInput, {
        plugins: [new weekSelect()],
        locale: 'zh',
        defaultDate: new Date(),
        onChange: (selectedDates) => {
            if (selectedDates.length > 0) {
                loadDataForWeek(selectedDates[0]);
            }
        },
    });
}

/**
 * 初始化领域切换Tabs
 */
function initDomainTabs() {
    if(!domElements.domainTabs) return;
    domElements.domainTabs.addEventListener('click', (event) => {
        const target = event.target.closest('[data-domain]');
        if (target) {
            const domain = target.dataset.domain;
            if (domain === currentDomain) return;
            
            const currentActive = domElements.domainTabs.querySelector('.active');
            if(currentActive) currentActive.classList.remove('active');
            
            target.classList.add('active');
            switchView(domain);
        }
    });
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
        loadDimensionData();
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

     // 初始加载
     if (weekPicker.selectedDates.length > 0) {
        loadDataForWeek(weekPicker.selectedDates[0]);
     } else {
        loadDataForWeek(new Date());
     }
     
     // 确保默认视图正确
     switchView(currentDomain);
     const initialActiveDomain = document.querySelector(`.nav-link[data-domain="${currentDomain}"]`);
     if (initialActiveDomain) initialActiveDomain.classList.add('active');
}); 