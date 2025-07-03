// 全局变量
let currentDomain = 'transaction';
let currentPlatform = 'all';
let currentData = null;
let trendChart = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 设置默认日期
    setDefaultDates();
    
    // 加载初始数据
    loadData();
    
    // 初始化图表
    initChart();
    
    console.log('初始化完成');
});

// 设置默认日期（最近一周）
function setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    document.getElementById('startDate').value = formatDate(startDate);
    document.getElementById('endDate').value = formatDate(endDate);
}

// 日期格式化
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 切换数据领域
function switchDomain(domain) {
    console.log('切换数据领域:', domain);
    currentDomain = domain;
    
    // 更新侧边栏状态
    document.querySelectorAll('#domainTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(`${domain}-tab`).classList.add('active');
    
    // 重新加载数据
    loadData();
}

// 切换平台
function switchPlatform(platform) {
    console.log('切换平台:', platform);
    currentPlatform = platform;
    
    // 更新平台Tab状态
    document.querySelectorAll('#platformTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(`${platform}-platform-tab`).classList.add('active');
    
    // 重新加载数据
    loadData();
}

// 更新数据
function updateData() {
    console.log('更新数据...');
    loadData();
}

// 加载数据
async function loadData() {
    try {
        console.log('开始加载数据...');
        
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('请选择开始和结束日期');
            return;
        }
        
        // 显示加载状态
        showLoading();
        
        // 构建API URL
        const url = `/api/data?domain=${currentDomain}&platform=${currentPlatform}&start_date=${startDate}&end_date=${endDate}`;
        console.log('API URL:', url);
        
        // 发送请求
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('数据加载成功:', data);
        
        // 保存当前数据
        currentData = data;
        
        // 渲染指标卡片
        renderMetricCards(data.cards);
        
        // 更新图表
        updateChart(data.trend);
        
        // 更新表格
        updateTable(data.table);
        
        // 隐藏加载状态
        hideLoading();
        
    } catch (error) {
        console.error('数据加载失败:', error);
        alert('数据加载失败: ' + error.message);
        hideLoading();
    }
}

// 显示加载状态
function showLoading() {
    const cardsContainer = document.getElementById('metricCards');
    cardsContainer.innerHTML = '<div class="col-12 text-center"><div class="loading"></div> 加载中...</div>';
}

// 隐藏加载状态
function hideLoading() {
    // 加载状态会在renderMetricCards中被清除
}

// 渲染指标卡片
function renderMetricCards(cards) {
    console.log('渲染指标卡片:', cards);
    
    const container = document.getElementById('metricCards');
    container.innerHTML = '';
    
    if (!cards || cards.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">暂无数据</div>';
        return;
    }
    
    cards.forEach((card, index) => {
        const cardElement = createMetricCard(card, index);
        container.appendChild(cardElement);
    });
}

// 创建指标卡片
function createMetricCard(card, index) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-3';
    
    const cardHtml = `
        <div class="metric-card" onclick="selectCard(${index})">
            <h3>${card.platform}</h3>
            <div class="main-metric">
                <div class="metric-label">GMV</div>
                <div class="metric-value number-format">${formatNumber(card.gmv)}</div>
            </div>
            <div class="sub-metrics">
                <div class="sub-metric">
                    <span class="label">环比</span>
                    <span class="value ${card.gmv_wow >= 0 ? 'positive' : 'negative'}">
                        ${formatPercent(card.gmv_wow)}
                    </span>
                </div>
                <div class="sub-metric">
                    <span class="label">同比</span>
                    <span class="value ${card.gmv_yoy >= 0 ? 'positive' : 'negative'}">
                        ${formatPercent(card.gmv_yoy)}
                    </span>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-label">年度目标完成率</div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${card.gmv_ytd_rate * 100}%"></div>
                </div>
                <div class="text-center mt-1">
                    <small class="text-muted">${formatPercent(card.gmv_ytd_rate)}</small>
                </div>
            </div>
        </div>
    `;
    
    col.innerHTML = cardHtml;
    return col;
}

// 选择卡片
function selectCard(index) {
    // 移除所有卡片的active状态
    document.querySelectorAll('.metric-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // 为选中的卡片添加active状态
    const cards = document.querySelectorAll('.metric-card');
    if (cards[index]) {
        cards[index].classList.add('active');
    }
    
    // 这里可以添加选中卡片后的逻辑
    console.log('选中卡片:', index);
}

// 初始化图表
function initChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'GMV趋势',
                data: [],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// 更新图表
function updateChart(trendData) {
    if (!trendChart || !trendData) return;
    
    console.log('更新图表:', trendData);
    
    trendChart.data.labels = trendData.dates || [];
    trendChart.data.datasets[0].data = trendData.values || [];
    trendChart.update();
}

// 更新表格
function updateTable(tableData) {
    console.log('更新表格:', tableData);
    
    const headerRow = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    if (!tableData || !tableData.headers || !tableData.rows) {
        headerRow.innerHTML = '<th>暂无数据</th>';
        tableBody.innerHTML = '';
        return;
    }
    
    // 更新表头
    headerRow.innerHTML = tableData.headers.map(header => 
        `<th>${header}</th>`
    ).join('');
    
    // 更新表格数据
    tableBody.innerHTML = tableData.rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
}

// 数字格式化
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    } else {
        return num.toLocaleString();
    }
}

// 百分比格式化
function formatPercent(value) {
    if (value === null || value === undefined) return '-';
    
    const percent = (value * 100).toFixed(1);
    return percent + '%';
}

// 导出功能
function exportData() {
    if (!currentData) {
        alert('暂无数据可导出');
        return;
    }
    
    // 这里可以实现导出功能
    console.log('导出数据:', currentData);
    alert('导出功能开发中...');
}

// 打印功能
function printReport() {
    window.print();
}

// 键盘快捷键
document.addEventListener('keydown', function(event) {
    // Ctrl + R 刷新数据
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        updateData();
    }
    
    // Ctrl + E 导出数据
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        exportData();
    }
    
    // Ctrl + P 打印
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        printReport();
    }
});

// 窗口大小改变时重新调整布局
window.addEventListener('resize', function() {
    if (trendChart) {
        trendChart.resize();
    }
});

console.log('JavaScript文件加载完成');