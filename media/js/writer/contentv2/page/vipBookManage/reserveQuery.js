$(function () {
    $('#container').highcharts({
        chart: {
            type: 'areaspline'
        },
        title: {
            text: '这里是标题'
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 50,
            floating: true,
            borderWidth: 1,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFF'
        },
        xAxis: {
            categories: [
                '01',
                '10',
                '15',
                '20',
                '25',
                '30'
            ],
            /*plotBands: [{ // visualize the weekend
                from: 4.5,
                to: 6.5,
                color: 'rgba(99, 170, 213, .2)'
            }]*/
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        tooltip: {
            shared: true,
            valueSuffix: ' units'
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.5
            }
        },
        series: [{
            name: '2015年4月',
            data: [100, 0, 200, 300, 50, 150]
        }]
    });
});