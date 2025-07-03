// 颜色池
const CHART_COLORS = [
    'rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(99, 255, 132, 0.7)', 'rgba(192, 75, 192, 0.7)', 'rgba(206, 255, 86, 0.7)',
    'rgba(102, 153, 255, 0.7)'
];

const mockData = {
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    platformFactors: {
        'all': 1, 'meituan': 0.4, 'jd': 0.25, 'ele': 0.2, 'duodian': 0.1, 'taoxianda': 0.05
    },
    
    formatNumber: function(num) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatPercentage: function(num) {
        return `${num.toFixed(1)}%`;
    },

    getTransactionData: function(platform, weekNum) {
        const factor = this.platformFactors[platform] || 1;
        const kpis = {
            ytd: { value: this.formatNumber(386505368 * factor), yoy: '25.5%', target_progress: 88.7 },
            mtd: { value: this.formatNumber(44648243 * factor), yoy: '18.8%', target_progress: 54.1 },
            w20: { 
                value: this.formatNumber(this.random(12000000, 16000000) * factor), 
                wow: this.formatPercentage(this.random(-15, 15)), 
                yoy: this.formatPercentage(this.random(40, 60)) 
            }
        };
        
        const chartData = {
            labels: Array.from({ length: 7 }, (_, i) => `W${dayjs().subtract(6 - i, 'week').isoWeek()}`),
            datasets: [
                {
                    type: 'bar', label: 'GMV', yAxisID: 'y',
                    data: Array.from({ length: 7 }, () => this.random(12, 18) * 1000000 * factor),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                },
                {
                    type: 'line', label: '年同比', yAxisID: 'y1',
                    data: Array.from({ length: 7 }, () => this.random(20, 50)),
                    borderColor: 'rgba(75, 192, 192, 0.7)', tension: 0.3
                },
                {
                    type: 'line', label: '周环比', yAxisID: 'y1',
                    data: Array.from({ length: 7 }, () => this.random(-15, 15)),
                    borderColor: 'rgba(255, 159, 64, 0.7)', tension: 0.3
                }
            ]
        };
        
        return { kpis, chart: chartData };
    },

    getMultiDimensionData: function(platform, dimension) {
        const factor = this.platformFactors[platform] || 1;
        const dimensions = {
            subBrand: ['Salty', 'Quaker', 'B&C'],
            productLine: ['品线1', '品线2', '品线3', '品线4', '品线5', '品线6'],
            channelType: ['O2O渠道', 'B2C渠道', '社区团购'],
            region: ['华东大区', '华南大区', '华北大区', '西南大区']
        };
        const metricKeys = {
            gmv: 'GMV',
            gmv_share: 'GMV占比',
            wow: '环比%',
            yoy: '同比%'
        };

        const items = dimensions[dimension];
        const weeks = 8;
        
        // 1. Generate Headers for the new table structure
        const topHeader = [{ title: 'week', rowspan: 2 }];
        items.forEach(item => {
            topHeader.push({ title: item, colspan: Object.keys(metricKeys).length });
        });
        const bottomHeader = [];
        items.forEach(() => {
            Object.values(metricKeys).forEach(metricName => {
                bottomHeader.push({ title: metricName });
            });
        });
        const tableHeaders = { top: topHeader, bottom: bottomHeader };

        // 2. Generate Data in a "wide" format
        const tableDataRows = [];
        const dtColumns = [{ data: 'week' }]; // Columns for DataTables initialization

        for (let i = weeks - 1; i >= 0; i--) {
            const weekNum = dayjs().subtract(i, 'weeks').isoWeek();
            const rowData = { week: `W${weekNum}` };
            let weeklyTotalGmv = 0;
            const weeklyItemGmvs = {};

            // First pass to calculate GMV for each item and total GMV for the week
            items.forEach(item => {
                const gmv = this.random(100000, 15000000) * factor * (1 + (i - weeks / 2) * 0.05); // Add some trend
                weeklyItemGmvs[item] = gmv;
                weeklyTotalGmv += gmv;
            });
            
            // Second pass to build the row with all metrics
            items.forEach(item => {
                const gmv = weeklyItemGmvs[item];
                const share = (gmv / weeklyTotalGmv) * 100;
                rowData[`${item}_gmv`] = this.formatNumber(gmv);
                rowData[`${item}_gmv_share`] = this.formatPercentage(share);
                rowData[`${item}_wow`] = this.formatPercentage(this.random(-15, 30));
                rowData[`${item}_yoy`] = this.formatPercentage(this.random(-10, 50));
            });
            tableDataRows.push(rowData);
        }

        // Generate DataTables column definitions from item and metric keys
        items.forEach(item => {
            Object.keys(metricKeys).forEach(key => {
                dtColumns.push({ data: `${item}_${key}` });
            });
        });

        // Generate Pie and Combo chart data (can be aggregated from the detailed data)
        const pieData = items.map(item => {
            return tableDataRows.reduce((sum, row) => sum + parseFloat(row[`${item}_gmv`].replace(/,/g, '')), 0);
        });
        const pieChartData = {
            labels: items,
            datasets: [{ data: pieData, backgroundColor: CHART_COLORS }]
        };

        const comboChartLabels = tableDataRows.map(row => row.week);
        const comboChartDatasets = items.map((item, index) => ({
            type: 'bar', label: item, yAxisID: 'y', stack: 'GMV',
            data: tableDataRows.map(row => parseFloat(row[`${item}_gmv`].replace(/,/g, ''))),
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
        }));
        comboChartDatasets.push({
            type: 'line', label: '整体GMV占比', yAxisID: 'y1',
            data: Array.from({ length: weeks }, () => this.random(15, 35)),
            borderColor: '#52c41a'
        });
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

    getData: function(domain, platform, weekNum) {
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
    }
}; 