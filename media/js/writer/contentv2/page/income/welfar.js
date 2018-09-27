/**
 * 收入管理: 奖励保障
 * @namespace CS.page.income.welfar
 * @date 2015-8-28
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _uiBinder = CS.uiBinder;

    var _params = {}, //参数列表
        _chartData = {}, //图表数据
        _isRequesting = 0; //是否正在请求

    var _ajaxUrls = {
        'getChartData': '/Contentv2/Income/welfarChartContent.html', //获取奖励保障图表数据
    };

    //收入明细项目的模板
    var _incomeDetailItemTpl = [
        '<%each list as item index %>',
            '<li><i><%=item.count%></i><%=item.name%>:</li>',
        '<%/each%>'
    ].join('');
    
    /**
     * 初始化
     */
    function init() {

        _setChartTheme(); 
        _getChartData();
        _bindEvent();

    }

    /**
     * 绑定元素事件
     */
    function _bindEvent() {
                //查询按钮
        $("#searchBtn").on('click', function() {
            _getChartData();
        });
        
        $("select[name='showtype']").on('change',function(){
            if($(this).val() == "date"){
                $("select[name='year']").parent().show();
                $("select[name='month']").parent().show();
                $("select[name='novel']").parent().hide();
            }else{
                $("select[name='year']").parent().hide();
                $("select[name='month']").parent().hide();
                $("select[name='novel']").parent().show();
            }
        });

    }

    /**
     * 获取图表数据
     */
    function _getChartData(){

        var data        =   {},
            year        =   $("select[name='year']").val(),
            month       =   $("select[name='month']").val(),
            CBID        =   $("select[name='novel']").val(),
            showtype    =   $("select[name='showtype']").val();
        if(_isRequesting){
            return;
        }
        _isRequesting = 1;
        if(showtype=='works'){
            data.CBID = CBID;
            data.showtype = showtype;
        }
        if(showtype=="date"){
            data.year = year;
            data.month = month;
            data.showtype = showtype;
        }

        _util.request({
            url: _ajaxUrls.getChartData,
            data: data,
            type: 'get',
            dataType: "json",
            success: function(json) {

                if(json && json.data){
                    _renderChart(json.data);
                }
            },
            complete: function(){
                _isRequesting = 0;
            }
        });
    }

    /**
     * 渲染图形
     * @param {object} data 数据
     */
    function _renderChart(data){
        if(!data){
            return;
        }

        var $chartBox = $('#chartBox'),
            $noDataBox = $('#noDataBox'),
            $incomeSumBox = $('#incomeSumBox');

        // test
        // data.Attendanceaward = 12263.33333; //全勤奖
        // data.rewards = 2535.33333; //道具收入
        // data.Basicliving = 34544.33333; //创作保障奖励
        // data.Halfyearaward = 42324.33333; //勤奋写作奖
        // data.Monthlyward = 53543.33333; //月票奖励
        // data.other = 6878.33333; //其他

        $chartBox.hide();
        $noDataBox.hide();
        $incomeSumBox.hide();

        _setChartData(data);

        if(_chartData.sum === 0){
            $noDataBox.show();
        }else{
            //总收入
            $incomeSumBox.find('[data-node="sum"]').text(_chartData.sum);
            _updateIncomeDetail('全勤奖', data.Attendanceaward);
            $incomeSumBox.show();
            $chartBox.show();
            
            //饼图
            $chartBox.highcharts({
                chart: {
                    height: 350,
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        innerSize: '90%', //环形图关键属性
                        allowPointSelect: true,
                        cursor: 'pointer',
                        events: {
                            click: function (event) {
                                _updateIncomeDetail(event.point.name, event.point.y);
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            connectorColor: '#333',
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        },
                        showInLegend: true
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    floating:true,
                    verticalAlign: 'top',
                    x: -70,
                    y: 120,
                    itemMarginBottom:10
                },
                //百分百会自动计算
                series: [{
                    type: 'pie',  //饼图
                    name: '占比',
                    data: [
                        {
                            name: '全勤奖',
                            y: data.Attendanceaward,
                            sliced: true,
                            selected: true
                        },
                        ['道具收入', data.rewards],
                        ['创作保障奖励', data.Basicliving],
                        ['勤奋写作奖', data.Halfyearaward],
                        ['月票奖励', data.Monthlyward],
                        ['其他', data.other]
                    ]
                }]
            });
        }
    }

    /**
     * 设置图表数据
     * @param {object} data 图表数据
     */
    function _setChartData(data){
        if(!data){
            _chartData.sum = 0;
            return;
        }

        var sum = data.Attendanceaward + data.rewards + data.Basicliving +
                data.Halfyearaward + data.Monthlyward + data.other;

         //总收入
        _chartData.sum = sum > 0 ? parseFloat(sum).toFixed(2) : 0;
    }

    /**
     * 更新饼图中的收入明细
     * @param  {string} name 收入类型名称
     * @param {int} value 收入金额
     */
    function _updateIncomeDetail(name, value){
        var $incomeSumBox = $('#incomeSumBox');
            
        //收入类型名称
        $incomeSumBox.find('[data-node="incomeTypeName"]').text(name);
        $incomeSumBox.find('[data-node="detailTotal"]').text(value > 0 ? parseFloat(value).toFixed(2) : 0);
    }

    /**
     * 设置图形的主题
     */
    function _setChartTheme(){
        if(!Highcharts){
            return;
        }

        //饼图主题
        Highcharts.theme = {
            colors: ["#76DDFF", "#BBEBFF", "#32ABFD", "#6085A3"],
            chart: {
                backgroundColor: null,
                style: {
                    fontFamily: "Dosis, sans-serif"
                }
            },
            title: {
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }
            },
            tooltip: {
                borderWidth: 0,
                backgroundColor: 'rgba(219,219,216,0.8)',
                shadow: false
            },
            legend: {
                itemStyle: {
                    fontWeight: 'bold',
                    fontSize: '13px'
                }
            },
            xAxis: {
                gridLineWidth: 1,
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yAxis: {
                minorTickInterval: 'auto',
                title: {
                    style: {
                        textTransform: 'uppercase'
                    }
                },
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        color: '#333'
                    }
                }
            },
            // General
            background2: '#F0F0EA'
        };

        // Apply the theme
        Highcharts.setOptions(Highcharts.theme);
    }

    _util.initNameSpace("CS.page.income");
    CS.page.income.welfar = {
        'init': init
    };
})(jQuery);