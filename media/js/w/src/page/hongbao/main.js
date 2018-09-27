;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isLoading = 0, 
        _totalPageCount = 2; //书评列表的总页数


	var zoom = function(zoomID) {
		  var doc=$(zoomID);
          var docEl = doc;
              recalc = function () {
              var clientWidth = docEl.width();
			  docEl.css({'font-size':100 * (clientWidth / 1080) + 'px'});
            };
		 recalc();
         $(window).resize(recalc);
      }
	   
   /**
    * 初始化
    */
    function init(gettuhaoRankUrl, cbid, dateId, defaultdaArr) {

        _params.gettuhaoRankUrl = gettuhaoRankUrl || '';
        _params.cbid = cbid || 0;
        _params.dateId = dateId || '';
        _params.defaultdaArr = defaultdaArr || '';

    	zoom('#zoomroot'); 
    	jqtab("#Tabs","#tabcontent","click");
        _bindEvent();
    }

	function jqtab(tabtit,tab_conbox,shijian) {
		$(tab_conbox).find(".tab-cont").hide();
		$(tabtit).find(".tab-cont").eq(0).addClass("active").show(); 
		$(tab_conbox).find(".tab-cont").eq(0).show();
	
		$(tabtit).find("li").bind(shijian,function(){
		  $(this).addClass("active").siblings("li").removeClass("active"); 
			var activeindex = $(tabtit).find("li").index(this);
			$(tab_conbox).children().eq(activeindex).show().siblings().hide();
			// return false;
		});
	
	};    

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {

        $("#Tabs li").click(function(){
            var ruletype = $(this).attr("node");
            var qName = "普通红包";
            if (ruletype == 1){
                qName = "月票红包";
            }else if(ruletype == 2){
                qName = "推荐票红包";
            }
            $("#trandTitle").text("近7日"+qName+"发放趋势");
            $("#rankTitle").text("昨日"+qName+"土豪榜");   
            //加载排行榜 
            _getRankList(ruletype);
        });
        //例子
        var dayIdArr = _params.defaultdaArr;//例如['0302','0303','0304','0305','0306','0307','0308'];
        var countArr = [0,0,0,0,0,0,0];
        _getChart(countArr, dayIdArr);//初次渲染图表
        _getRankList(0);


        $(".btn-box .btn-red").click(function(){
            location.href= $(this).attr('url');
        })
    }

    function _getRankList(ruletype) {
        _util.request({
            url: _params.gettuhaoRankUrl,
            data: {
                'CBID': _params.cbid,
                'ruleType': ruletype,
                'dateId' : _params.dateId,
                'ajax' : 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                //成功
                if (json.code === '2000') {
                    if (json.result.trendData){
                        //渲染趋势图
                        var countArr = json.result.trendData.CountArr;
                        var dayArr = json.result.trendData.DayIdArr;
                        _getChart(countArr,dayArr);
                    }                    
                    if(json.result.rowlistHtml){
                        $("#ranklistNode .default-rank").hide();
                        $('#ranklistNode').html(json.result.rowlistHtml);
                    }

                }
            },
            error: function() {
                // alert('网络异常，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                // $('#loadingTipsBox').hide();
            }
        });
    }    

    function _getChart(countArr, dayArr){
        var option = {
            tooltip : {
                trigger: 'axis'
            },
            grid: {
                x: 40,
                y: 20,
                x2: 30,
                y2: 20
            },
            calculable : true,
            xAxis : [
                {
                    type : 'category',
                    boundaryGap : false,
                    // ['周一','周二','周三','周四','周五','周六','周日']
                    data : dayArr
                }
            ],
            yAxis : [
                {
                    type : 'value'
                }
            ],
            series : [
                {
                    name:'个数',
                    type:'line',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:countArr
                },
            ]
        };    

        var charts1 = echarts.init(document.getElementById('charts-1'));
            charts1.setOption(option);               
    }

    _util.initNameSpace("CS.page.hongbao");
    CS.page.hongbao.main = {
        'init': init
    };
})(jQuery);