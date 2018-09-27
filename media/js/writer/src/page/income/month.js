/**
 * 收入管理: 总收入
 * @namespace CS.page.income.month
 * @date 2015-11-25
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
        'getChartData': '/Home/Income/monthChartContent.html', //获取图表数据
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

        var $detailBubble = $('#incomeDetailBubble'), //收入明细的浮层容器
            $detailIcon = $('#incomeDetailBox').find('[data-node="detailIcon"]'); //明细图标

        //收入明细的容器
        $('#incomeDetailBox')
            .on('mouseenter', function() {
                //有多条明细
                if($detailBubble.find('[data-node="detailList"] li').length > 0){
                    $detailBubble.css('left', ($detailIcon.get(0).offsetLeft - $detailBubble.width() / 2 - 7) + 'px').show();
                }
            })
            .on('mouseleave', function() {
                $detailBubble.hide();
            });
    }

    /**
     * 获取图表数据
     */
    function _getChartData(){
        var year = $("select[name='year']").val(),
            month = $("select[name='month']").val(),
            novelId = $("select[name='novel']").val();

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        _util.request({
            url: _ajaxUrls.getChartData,
            data: {
                'novel': novelId,
                'year': year,
                'month': month
            },
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
        var $container = $('#container'),
            $noDataBox = $('#noDataBox'),
            $incomeSumBox = $('#incomeSumBox'),
            $total = $('#total');
        $container.hide();
        $noDataBox.hide();
        $incomeSumBox.hide();
        $total.text("税前实发金额(含稿酬及部分福利)：" + data.total);
        
        
          //    $total.text(data.total);
        _setChartData(data);

        if(_chartData.sum === 0){
            $noDataBox.show();
        }else{
            //总收入
            $incomeSumBox.find('[data-node="sum"]').text(_chartData.sum);
            _updateIncomeDetail('xieyi');
            $incomeSumBox.show();
            $container.show();
        $('#container').highcharts({
            chart: {
				height: 350,
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
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
		     innerSize: "90%", //环形图关键属性
                    allowPointSelect: true,
                    cursor: 'pointer',
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
            series: [{
                type: 'pie',
                name: '占比',
                data: [
					{
                        type: 'xieyi',
                        name: '协议稿酬',
                        y: _chartData.xieyi.total,
                        sliced: true,
                        selected: true
                    },
                    			{
                        type: 'fuli',
                        name: '福利奖励',
                        y: _chartData.fuli.total,

                    },
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
            return;
        }

        _chartData = {
            //协议稿酬
            'xieyi' : {
                'name': '协议稿酬',
                'total': data.xieyi
            },
            //福利奖励
            'fuli' : {
                'name': '福利奖励',
                'total': data.fuli
            },

        };
       
        var sum = 0;  //总收入

        $.each(_chartData, function(index, item){
            sum += item.total;
        });

         //总收入
        _chartData.sum = sum > 0 ? parseFloat(sum).toFixed(2) : 0;

    }

    /**
     * 更新饼图中的收入明细
     * @param  {string} type 收入类型
     */
    function _updateIncomeDetail(type){
        var data = _chartData[type];
        if(!data){
            return;
        }

        var $incomeSumBox = $('#incomeSumBox'),
            $detailList = $incomeSumBox.find('[data-node="detailList"]'),
            $detailIcon = $incomeSumBox.find('[data-node="detailIcon"]');

        //收入类型名称
        $incomeSumBox.find('[data-node="incomeTypeName"]').text(data.name);
        //收入金额，保留两位小数
        $incomeSumBox.find('[data-node="detailTotal"]').text(data.total > 0 ? parseFloat(data.total).toFixed(2) : 0);

        $detailList.empty();
        $detailIcon.hide();
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
    CS.page.income.month = {
        'init': init
    };
})(jQuery);