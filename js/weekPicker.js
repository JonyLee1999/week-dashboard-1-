// 设置 moment 语言为中文
moment.locale('zh-cn');

const WeekPicker = () => {
    // 日期改变处理函数
    const handleChange = (dates, dateStrings) => {
        if (dates) {
            console.log('Selected dates:', dateStrings);
            // 触发全局数据更新
            window.loadData(dateStrings[0], dateStrings[1]);
        }
    };

    // 自定义周格式
    const weekFormat = 'YYYY-wo周';

    return React.createElement(
        'div',
        { className: 'week-picker-wrapper' },
        React.createElement(
            antd.DatePicker.RangePicker,
            {
                picker: 'week',
                style: { width: '100%' },
                format: weekFormat,
                placeholder: ['开始周', '结束周'],
                defaultValue: [
                    moment().subtract(6, 'weeks'),
                    moment()
                ],
                onChange: handleChange,
                allowClear: false
            }
        )
    );
};

// 等待 DOM 加载完成后渲染组件
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('weekPickerRoot');
    if (container) {
        console.log('找到weekPickerRoot元素，开始渲染组件...');
        ReactDOM.render(
            React.createElement(WeekPicker),
            container
        );
    } else {
        console.error('找不到weekPickerRoot元素');
    }
}); 