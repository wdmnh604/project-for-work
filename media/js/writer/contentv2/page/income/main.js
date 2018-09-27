/**
 * 收入管理
 * @namespace CS.page.income.main
 * @date 2015-12-9
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _uiBinder = CS.uiBinder;

    var _params = {}, //参数列表
        _incomeAjaxUrl = '',
        _pager = null; //翻页组件的实例
        _chartData      = {}, //图表数据
        _isRequesting   = 0; //是否正在请求

    var _ajaxUrls = {
        'month'     : '/Contentv2/Income/monthContent.html', //总收入 incometype
        'welfar'    : '/Contentv2/Income/welfarContent.html', //奖励保障
        'channel'   : '/Contentv2/Income/channelContent.html', //渠道收入
        'copyright' : '/Contentv2/Income/copyrightContent.html', //版权收入
        'rewards'   : '/Contentv2/Income/rewardsContent.html' //打赏明细
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
        _incomeAjaxUrl = _getIncomeAjaxUrl();
        _searchIncome(1);
        _bindEvent();
    }

    /**
     * 获取收入列表的ajax地址
     */
    function _getIncomeAjaxUrl(){
        var incomeType = _getIncomeType(),
            getIncomeAjaxUrl = _ajaxUrls[incomeType];

        return getIncomeAjaxUrl || '';
    }

    /**
     * 获取收入类型
     * @return {string} 收入类型（month/welfar/channel/copyright/reward）
     */
    function _getIncomeType(){
        return $("#incomeList").attr('incomeType');
    }
    /**
     * 获取作家的收入记录
     * @param  {int} pageIndex 页码
     */
    function _searchIncome(pageIndex) {
        var data        =   {},
            year        =   $("select[name='year']").val(),
            month       =   $("select[name='month']").val(),
            CBID        =   $("select[name='novel']").val(),
            showtype    =   $("select[name='showtype']").val(),
            $list       =   $("#incomeList"),
            $pager      =   $("#pager");
        if(showtype=="works"){
            data.CBID       =   CBID;
            data.showtype   =   showtype;
            data.page =  pageIndex; 
        }
        if(showtype=='date'){
            data.month       =   month;
            data.year        =   year;
            data.showtype    =   showtype; 
            data.page        =  pageIndex;   
        }
        var incometype = $("#incomeList").attr('incomeType');
        var all = new Array('channel','copyright','rewards');
        if(incometype == 'channel' || incometype == 'copyright' || incometype == 'rewards'){
            data.CBID =  CBID;
            data.year =  year;
            data.month=  month;
            data.page =  pageIndex;           
        }

        _util.request({
            url: _incomeAjaxUrl,
            data: data,
            type: 'get',
            dataType: "json",
            success: function(json) {

                var currentDate     =   new Date;
                var currentMonth    =   currentDate.getMonth()+1; 
                var emptyListTpl    =   $('#incomeEmptyListTpl').val();
                if (json.status && json.data) {
                    //绘制饼图
                    if(incometype == 'month')
                        _renderChart(json.data);
                    if(incometype == 'welfar')
                        _renderChartWelfar(json.data);
                    
                    //绘制表格

                    var incomeListTpl = $('#incomeListTpl').val();
                    $list.empty();
                    if(json.data.list && json.data.list.length > 0){
                        //渲染收入列表
                        _uiBinder.appendHTML($list, incomeListTpl, {
                            'list': json.data.list
                        });
                        if ( !_pager && json.data.pageCount) {
                        // 创建分页

                            _pager= $('#pager').pagination(json.data.pageCount, {
                                'callback': function(pageNo){
                                _searchIncome(pageNo);
                            }
                        });
                            $('#pager').show();
                        }else if('hasNextPage' in json.data){ //前后翻页
                            _renderPager(pageIndex, json.data.hasNextPage, _searchIncome);
                        }
                    }else{ //空数据
                        if(emptyListTpl && emptyListTpl.length > 0){
                            //收入月报
                           
                               if(_getIncomeType() === 'month'){
                                   if(currentMonth>parseInt(month)){
                                
                                        if(json.data.novelCount){           
                                            for(var i=0;i<json.data.novelCount;i++){
                                                var emptyListTpltemp = _util.replaceTpl(emptyListTpl, {
                                                                        'month'     : month,
                                                                        'bookTitle' : json.data.novelList[i]['title']
                                                    });    
                                                $list.append(emptyListTpltemp);
                                            }
                                        }else{
                                                var emptyListTpltemp = _util.replaceTpl(emptyListTpl, {
                                                    'month' : month,
                                                    'bookTitle' : $("select[name='novel'] option:selected").text(),
                                                });    
                                                $list.append(emptyListTpltemp);
                                        }
                                    }else{
                                        $list.empty();
                                        $pager.empty();
                                        var V2 = $('#incomeEmptyListTplV2').val();
                                        $list.html(V2);
                                    }
                                }else{
                                    $list.append(emptyListTpl);
                                }
                        }
                        }
                }
            },
            error: function(){
                _dialog.alert('获取数据失败，请稍候再试');
            }
        });
    }
    /**
     * 渲染图形
     * @param {object} data 数据
     */
    function _renderChartWelfar(data){
        if(!data){
            return;
        }

        var $chartBox = $('#chartBox'),
            $noDataBox = $('#noDataBox'),
            $incomeSumBox = $('#incomeSumBox');

        $chartBox.hide();
        $noDataBox.hide();
        $incomeSumBox.hide();
        if(!data){
            _chartData.sum = 0;
            return;
        }

        var sum = data.Attendanceaward + data.rewards + data.Basicliving +
                data.Halfyearaward + data.Monthlyward + data.other;

         //总收入
        _chartData.sum = sum > 0 ? parseFloat(sum).toFixed(2) : 0;

        if(_chartData.sum === 0){
            $noDataBox.show();
        }else{
            //总收入
            $incomeSumBox.find('[data-node="sum"]').text(_chartData.sum);
            _updateIncomeDetailWelfar('全勤奖', data.Attendanceaward);
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
                                _updateIncomeDetailWelfar(event.point.name, event.point.y);
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
    function _setChartDataWelfar(data){
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
     * 渲染图形
     * @param {object} data 数据
     */
    function _renderChart(data){
        if(!data){
            return;
        }

        var $chartBox       = $('#chartBox'),
            $noDataBox      = $('#noDataBox'),
            $incomeSumBox   = $('#incomeSumBox');
            $total          = $('#total');
        $chartBox.hide();
        $noDataBox.hide();
        $incomeSumBox.hide();
        $total.text("合计金额(含稿酬及部分福利)：" + data.total);
        _setChartData(data);

        if(_chartData.sum === 0){
            $noDataBox.show();
        }else{
            //总收入
            $incomeSumBox.find('[data-node="sum"]').text(_chartData.sum);
            _updateIncomeDetail('ownPlatform');
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
                                _updateIncomeDetail(event.point.type);
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
                //百分比会自动计算
                series: [{
                    type: 'pie',
                    name: '占比',
                    data: [
                        {
                            type: 'ownPlatform',
                            name: '自有平台',
                            y: _chartData.ownPlatform.total,
                            sliced: true,
                            selected: true
                        },
                        {
                            type: 'copyright',
                            name: '版权收入',
                            y: _chartData.copyright.total
                        },
                        {
                            type: 'groupPlatform',
                            name: '集团平台',
                            y: _chartData.groupPlatform.total
                        },
                        {
                            type: 'thirdChannel',
                            name: '第三方渠道',
                            y: _chartData.thirdChannel.total
                        }
                    ]
                }]
            });
        }
    }

    /**
     * 渲染翻页组件
     * @param  {int}  currentPage 当前页码（从1开始）
     * @param  {Boolean} hasNextPage 是否有下一页
     */
    function _renderPager(currentPage, hasNextPage, clickCallback){
        if(typeof clickCallback !== 'function'){
            clickCallback = function(){};
        }

        var $box    = $('<p></p>'),
            $pager  = $("#pager");
            $jump   = $('<input type="text" id="pageNumber" /><a class="jump" href="javascript:;">跳转</a>');
            
        $pager.empty();

        if(currentPage > 1){
            // 上一页
            var $prePage = $('<a class="prevBtn" href="javascript:;" title="上一页"><cite class="icon"></cite></a>');
            
            $prePage.click(function() {
                clickCallback(currentPage - 1);
            });

            $box.append($prePage);
        }

        if(hasNextPage){
            //下一页
            var $nextPage = $('<a class="nextBtn" href="javascript:;" title="下一页"><cite class="icon"></cite></a>');
            
            $nextPage.click(function() {
                clickCallback(currentPage + 1);
            });

            $box.append($nextPage);

        }
    
        if(currentPage > 1 || hasNextPage){
            $box.append($jump);
            $jump.filter('a').click(function(){
                var pageNumber = $('#pageNumber').val();
                clickCallback(pageNumber);
            });

            $pager.append($box).show();
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
            //自有平台
            'ownPlatform' : {
                'name': '自有平台',
                'total': data.showIncome + data.Othercount + data.Welfarecount,
                'detail': [
                    {
                        'name': '单订/单本/买断',
                        'count' : data.showIncome
                    },
                    {
                        'name': '包月（上月）',
                        'count': data.Othercount
                    },
                    {
                        'name': '奖励保障',
                        'count': data.Welfarecount
                    }
                ]
            },
            //集团平台
            'groupPlatform' : {
                'name': '集团平台',
                'total': data.channelJiTuan
            },
            //版权收入
            'copyright' : {
                'name': '版权收入',
                'total': data.CopyrightPay
            },
            //第三方渠道
            'thirdChannel' : {
                'name': '第三方渠道',
                'total': data.channelYiDo + data.channelOther,
                'detail': [
                    {
                        'name': '中移动阅读',
                        'count': data.channelYiDo
                    },
                    {
                        'name': '其他',
                        'count': data.channelOther
                    }
                ]
            }
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
     * @param  {string} name 收入类型名称
     * @param {int} value 收入金额
     */
    function _updateIncomeDetailWelfar(name, value){
        var $incomeSumBox = $('#incomeSumBox');
        //收入类型名称
        $incomeSumBox.find('[data-node="incomeTypeName"]').text(name);
        $incomeSumBox.find('[data-node="detailTotal"]').text(value > 0 ? parseFloat(value).toFixed(2) : 0);
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

        if(data.detail && data.detail.length > 0){
            $.each(data.detail, function(index, item){
                item.count = item.count > 0 ? parseFloat(item.count).toFixed(2) : 0;
            });

            var tpl = _uiBinder.bindData(_incomeDetailItemTpl, {
                'list': data.detail
            });

            $detailIcon.show();
            $detailList.html(tpl);
        }
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


    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        //美化选择器
        $('select').comboSelect();
        
        //查询按钮
        $("#searchBtn").click(function() {
            $('#pager').hide();
            _pager=null;
            _searchIncome(1);
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
        if(showtype=='works'){
            data.CBID = CBID;
            data.showtype = showtype;
        }
        if(showtype=="date"){
            data.year = year;
            data.month = month;
            data.showtype = showtype;
        }
        if(_isRequesting){
            return;
        }
        _isRequesting = 1;
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

    _util.initNameSpace("CS.page.income");
    CS.page.income.main = {
        'init': init
    };
})(jQuery);