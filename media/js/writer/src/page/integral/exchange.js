// 2015/9/17 15:00
// by wangping for studying
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        isRequesting = 0, //是否正在发起请求
        _maskByPopup = null; //浮层的遮罩层组建的实例对象
    
    //浮层标题列表
    var _popupTitleList = {
        'fulltime' : '兑换全勤请假条',
        'safeguard': '兑换创作保障请假条',
        'hardwork': '兑换勤奋写作豁免权'
    };

    //作品列表的模板
    var _bookListTpl = [
        '<%each list as item index%>',
            '<option value="<%=item.CBID%>"><%=item.title%>（<%=item.status%>）</option>',
        '<%/each%>'
    ].join('');

    //勤奋写作豁免权的兑换列表的模板
    var _hardworkExchangeListTpl = [
        '<%each list as item index%>',
            '<option value="<%=item.CBID%>"><%=item.title%>（<%=item.status%>）</option>',
            '<dd>',
                '<b><%=item.date%>月</b>',
                '<em>欠缺字数<%=item.less_words%>字，消耗积分<%=item.need_score%></em>',
                '<span data-node="checkboxContainer" class="checkBox">',
                    '<input class="checkClass" type="checkbox" value="<%=item.date%>">',
                '</span>',
            '</dd>',
        '<%/each%>'
    ].join('');
    var _ajaxUrls = {
    'getNovelList'           : "/Home/IntegralExchange/getNovelList.html",
    'getExchangeInfo'   : "/Home/IntegralExchange/getExchangeInfo.html",
    'doExchange'    : "/Home/IntegralExchange/doExchange.html"
};
    /**
     * 初始化
    
     */
    function init() {
        _nodes.$selectBookPopup = $('#selectBookPopup'); //选择作品浮层
        _nodes.$confirmExchangePopup = $('#confirmExchangePopup'); //确认兑换浮层

        _bindEvent();
    }
    
    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        //兑换列表
        $('#exchangeList')
            .on('mouseenter', 'li', function(){
                $(this).addClass('hover').siblings('li').removeClass('hover');
            })
            .on('mouseleave', 'li', function(){
                $(this).removeClass('hover');
            });

        //豁免权筛选复选框选中
        $('.remit_exchange dd').click(function(){
            var $checkbox = $(this).find('.checkBox'),
                $input = $(this).find('input');

            if($checkbox.hasClass('on_check')){
                $checkbox.removeClass('on_check');
                $input.removeAttr('checked');
            }else{
                $checkbox.addClass('on_check');
                $input.attr('checked','checked');
            }
        });

        //兑换按钮
        $('#exchangeList').on('click', '[data-node="exchangeBtn"]', function() {
            var exchangeType = $(this).attr('data-exchangeType');

            _getBookList(exchangeType);
            return false;
        });

    }
    /**
     * 获取作品列表
     * @param  {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     */
    function _getBookList(exchangeType){
        if(isRequesting){
            return;
        }

        isRequesting = 1;
        var requestData = {};
        requestData.exchangeType=exchangeType;

        _util.request({ 
            url: _ajaxUrls.getNovelList,
            type: 'get',
            dataType: 'json',
            data: requestData,
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status && json.data && json.data.list){
                    if(json.data.list.length === 0){
                        _dialog.alert('目前没有可供兑换的作品');
                        return;
                    }

                    _renderSelectBookPopup(exchangeType, json.data.list);
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {

                _dialog.alert('操作失败，请稍后再试');
            },
            complete: function(){
                isRequesting = 0;
            }
        });

    }
    /**
     * 获取兑换信息
     * @param {object} $btn 提交按钮的jquery对象
     * @param {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     * @param {string} bid 作品id
     */
    function _getExchangeInfo($btn, exchangeType, bid){
        if(isRequesting){
            return;
        }
        isRequesting = 1;

        var requestData = {};
        requestData.exchangeType = exchangeType;
        requestData.CBID = bid;


        _util.updateBtnText($btn, 'loading');

        _util.request({
            url: _ajaxUrls.getExchangeInfo,
            type: 'get',
            dataType: 'json',
            data: requestData,
            success: function(json) {

                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status && json.data){

                    _renderExchangeInfoPopup(exchangeType, bid, json.data);
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete: function(){
                isRequesting = 0;
                _util.updateBtnText($btn, 'default');
            }
        });
    }
    
   /**
     * 提交兑换
     * @param {object} $btn 提交按钮的jquery对象
     * @param {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     * @param {string} bid 作品id
     * @param  {string} monthList 用户选择的月份列表
     */
    function _submitExchange($btn, exchangeType, bid, monthList){
        if(isRequesting){
            return;
        }
        isRequesting = 1;

        var requestData = {
            'CBID': bid
        };

        if(monthList){
            requestData.yue = monthList;
        }
        requestData.exchangeType = exchangeType;
        _util.updateBtnText($btn, 'loading');

        _util.request({
            url: _ajaxUrls.doExchange,
            type: 'get',
            dataType: 'json',
            data: requestData,
            success: function(json) {

                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }
                if(json.status){
                    _closePopup();
                    _dialog.alert(json.info || '兑换成功',function(){ window.location.href="/Home/IntegralExchange/exchange.html";});

                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete: function(){
                isRequesting = 0;
                _util.updateBtnText($btn, 'default');
            }
        });
    }
    /**
     * 渲染选择作品浮层
     * @param {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     * @param  {string} bookList 作品列表的数据
     */
    function _renderSelectBookPopup(exchangeType, bookList){
        
        if(!bookList){
            return;
        }

        //作品列表的模板
        var tpl = _uiBinder.bindData(_bookListTpl, {'list': bookList});

        //更新浮层标题
        _nodes.$selectBookPopup.find('[data-node="title"]').text(_popupTitleList[exchangeType]);
        //更新作品列表
        _nodes.$selectBookPopup.find('[data-node="bookSelect"]').html(tpl);

        //美化select
        $('select').comboSelect();

        //下一步按钮

        _nodes.$selectBookPopup.find('[data-node="nextStepBtn"]').off('click').on('click', function() {
            //正在提交状态中
            if(_util.checkBtnIsLoading($(this))){
                return false;
            }

            var bid = _nodes.$selectBookPopup.find('[data-node="bookSelect"]').val();

            _getExchangeInfo($(this), exchangeType, bid);
            return false;
        });
 
        //打开选择作品的浮层
        _openPopup(_nodes.$selectBookPopup);
    }

    /**
     * 渲染兑换信息浮层
     * @param {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     * @param {string} bid 作品id
     * @param  {object} data 兑换信息数据
     */
    function _renderExchangeInfoPopup(exchangeType, bid, data){
        if(!data){
            return;
        }

        var $popup = $('#'+ exchangeType +'ExchangeInfoPopup');

        //当前积分
        $popup.find('[data-node="currentIntegral"]').text(data.integral);
        //已兑次数
        $popup.find('[data-node="exchangedTimes"]').text(data.numUsed);
        //剩余次数
        $popup.find('[data-node="remainedTimes"]').text(data.numRemain);

            //兑换需要消耗的积分
            $popup.find('[data-node="exchangeIntegral"]').text(data.needExchange);
        
        //下一步按钮
        $popup.find('[data-node="nextStepBtn"]').off('click').on('click', function() {
            var monthList = ''; //用户选择的月份列表

            if(exchangeType === 'hardwork'){
                var arrMonth = [];

                $('#'+ exchangeType +'ExchangeInfoPopup').find(':checkbox:checked').each(function(index, el){
                    arrMonth.push($(el).val());
                });

                monthList = arrMonth.join(',');
            }

            _openConfirmExchangePopup(exchangeType, bid, monthList);
            return false;
        });

        _openPopup($popup);
    }

    /**
     * 打开确认兑换浮层
     * @param {string} exchangeType 兑换类型(fullTime/safeguard/hardwork)
     * @param {string} bid 作品id
     * @param  {string} monthList 用户选择的月份列表
     */
    function _openConfirmExchangePopup(exchangeType, bid, monthList){
        var $popup = _nodes.$confirmExchangePopup;

        //标题
        $popup.find('[data-node="title"]').text(_popupTitleList[exchangeType]);

        //确认兑换按钮
        $popup.find('[data-node="submitBtn"]').off('click').on('click', function() {
            //正在提交状态中
            if(_util.checkBtnIsLoading($(this))){
                return false;
            }
          
            _submitExchange($(this), exchangeType, bid, monthList);

            return false;
        });

        _openPopup($popup);
    }

    /**
     * 打开浮层
     * @param  {object} $popup 浮层元素的jquery对象
     */
    function _openPopup($popup){
        if(!$popup || $popup.length === 0){
            return;
        }

        if(!_maskByPopup){
            _maskByPopup = new _mask($popup);
            _maskByPopup.open();
        }
        
        if(_maskByPopup){
            //替换浮层
            _maskByPopup.replacePopup($popup);

            $popup.find('[data-node="closeBtn"]').off('click').on('click', function() {
                _closePopup();
                return false;
            });
        }
    }

    /**
     * 关闭浮层
     */
    function _closePopup(){
        if(_maskByPopup){
            _maskByPopup.close();
            _maskByPopup = null;
        }
    }

    _util.initNameSpace("CS.page.integral");
    CS.page.integral.exchange={
        'init': init
    };
})(jQuery);


