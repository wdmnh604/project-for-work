/**
 * 单个作品的收入月报列表页
 * @namespace CS.page.authorIncome.bookMonthReportList
 * @author langtao
 * @update 2014-11-6
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var chart;

   /**
    * 初始化
    * @param {int} bid 作品id
    */
    function init() {
        
        _initChartTheme();
        _initChart();//初始化饼图         
        _bindEvent();
    }

    function _initChart(){

        var selfTotal = parseFloat($('#selftotal').val()),
            jituantotal = parseFloat($('#jituantotal').val()),
            othertotal = parseFloat($('#othertotal').val()),
            copytotal = parseFloat($('#copytotal').val());

        $('#container').highcharts({
            chart: {
                height: 350,
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            credits: { enabled: false },
            title: { text: '' },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    innerSize: '85%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false,
                    },
                    showInLegend: true,
                }
            },
            legend: {
                width: 226,
                verticalAlign: 'top',
                x: 15,
                y: 0,
                itemDistance: 35,
                symbolRadius: 50,
                symbolWidth: 13,
                itemMarginBottom:15
            },
            series: [{
                type: 'pie',
                name: '占比',
                data: [
                    ['自有平台', selfTotal],
                    ['版权收入', copytotal],
                    ['集团平台', jituantotal],
                    ['第三方渠道', othertotal]
                ]
            }]
        });        
    }

    function _initChartTheme(){
        
        if (!Highcharts) return;
        Highcharts.createElement('link', {
            href: 'http://fonts.googleapis.com/css?family=Dosis:400,600',
            rel: 'stylesheet',
            type: 'text/css'
        }, null, document.getElementsByTagName('head')[0]);

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

    function _setExtLogic(_obj){

        var url = _obj.attr('url');
        var year = _obj.attr('year'),
            month = _obj.attr('month');
        if (url){
            $.cookie("bcur_year", year);  
            $.cookie("bcur_month", month);   
            location.href = url;              
        }
        return;
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {

        $('.incomeListWrap li').click(function () {
            if($(this).next('.detailBox').is(':hidden')){
                $(this).find('em').addClass('up');
                $(this).next('.detailBox').slideDown(200);
            }else{
                $(this).find('em').removeClass('up');
                $(this).next('.detailBox').slideUp(200);
            }
        });

        $("#datechooseBtn a").click(function(){
            _setExtLogic($(this));  
        });

        $(".incomeTit .topTab a").click(function(){
            if ($(this).attr('node') == 'income'){
                // _initChartTheme();
                _initChart();//初始化饼图                
            }
        });        

        $(".payState a").click(function(){
            var url = $(this).attr('url');
            location.href=url;
        })

    }

    _util.initNameSpace("CS.page.authorIncome");
    CS.page.authorIncome.income = {
        'init': init
    };
})(jQuery);