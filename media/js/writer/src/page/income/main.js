/**
 * 收入管理
 * @namespace CS.page.income.main
 * @date 2015-11-25
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog,
        _uiBinder = CS.uiBinder;

    var _params = {}, //参数列表
        _incomeAjaxUrl = '',
        _pager = null, //翻页组件的实例
        _nodes = {};

    var _ajaxUrls = {
        'month': '/Home/Income/monthContent.html', //总收入 incometype
        'xieyi': '/Home/Income/detailContent.html', //福利奖励
        'fuli' : '/Home/Income/detailContent.html', //协议稿酬
    };
    
    /**
     * 初始化
     */
    function init() {

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
        return $("#incomeList").attr('data-incometype');
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        //美化选择器
        $('select').comboSelect();

        //查询按钮
        $("#searchBtn").click(function() {
            _pager = null;
            _searchIncome(1);
        });
    }
	_nodes.$pager = $('#pager'); //翻页组件
    /**
     * 获取作家的收入记录
     * @param  {int} pageIndex 页码
     */
    function _searchIncome(pageIndex) {
        var year = $("select[name='year']").val(),
            month = $("select[name='month']").val(),
            novelId = $("select[name='novel']").val(),
            $list = $("#incomeList"),
            $pager = $("#pager");
        _util.request({
            url: _incomeAjaxUrl,
            data: {
                'novel': novelId,
                'year': year,
                'month': month,
                'page': pageIndex
            },
            type: 'get',
            dataType: "json",
            success: function(json) {

                if (json.status && json.data) {
                    var incomeListTpl = $('#incomeListTpl').val();
                    $list.empty();
                    if(json.data.list ){
                        //渲染收入列表
                        _uiBinder.appendHTML($list, incomeListTpl, {
                            'list': json.data.list,
                            'date': json.data.date,
                        });
                    }else{ //空数据
                        var emptyListTpl = $('#incomeEmptyListTpl').val();
                        if(emptyListTpl && emptyListTpl.length > 0){
                            //收入月报
                            if(_getIncomeType() === 'month'){
                                emptyListTpl = _util.replaceTpl(emptyListTpl, {
                                    'month' : month,
                                    'bookTitle' : $("select[name='novel'] option:selected").text()
                                });
                            }

                            $list.html(emptyListTpl);
                        }
                    }
                }
                   _nodes.$pager.show();
                    if( json.data.pageCount){ //页码翻页
                        if(!_pager){
                        _pager = _nodes.$pager.pagination(json.data.pageCount, {
                                'callback': _searchIncome
                        });
                        }
                }else{
                    $list.empty();
                    $pager.empty();
                }
            },
            error: function(){
                _dialog.alert('获取数据失败，请稍候再试');
            }
        });
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

        var $box = $('<p></p>'),
            $pager = $("#pager");

        $pager.empty();

        if(currentPage > 1){
            // 上一页
            var $prePage = $('<a class="prevBtn" href="javascript:;"><cite class="icon"></cite></a>');

            $prePage.click(function() {
                clickCallback(currentPage - 1);
            });
            
            $box.append($prePage);
        }

        if(hasNextPage){
            //下一页
            var $nextPage = $('<a class="nextBtn" href="javascript:;"><cite class="icon"></cite></a>');

            $nextPage.click(function() {
                clickCallback(currentPage + 1);
            });
            
            $box.append($nextPage);
        }

        $pager.append($box);
    }

    _util.initNameSpace("CS.page.income");
    CS.page.income.main = {
        'init': init
    };
})(jQuery);