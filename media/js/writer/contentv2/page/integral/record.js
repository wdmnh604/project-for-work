/**
 * 积分记录
 * @namespace CS.page.integral.record
 * @update 2015-8-10
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _uiBinder = CS.uiBinder,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _nodes = {}, //页面元素的对象集合
        _isRequesting = 0; //是否正在发起请求

    //分页组件的实例对象列表
    var _pager = {
        'get': null,
        'use': null
    };

    var _ajaxUrls = {
        'getRecord' : "/Contentv2/IntegralExchange/getExchange.html",//获取积分的记录                                     
        'useRecord' : "/Contentv2/IntegralExchange/lostExchange.html"//消耗积分的记录
    };

    //记录列表的模板
    var _recordTpl = [
        '<%each list as item index%>',
            '<tr>',
                '<td><span><%=item.createtime.substr(0, 16)%></span></td>', //去掉最后的秒数
                '<td><span><%=item.integralfrom%></span></td>',
                '<td><span><%=item.integralnum%></span></td>',
            '</tr>',
        '<%/each%>'
    ].join('');

    //空记录的模板
    var _emptyRecordTpl = '<tr><td colspan="3">暂无任何数据</td></tr>';

    /**
     * 初始化
     */
    function init() {
        $('select').comboSelect();
        _nodes.$contentList = $('#exchangeRecordContentList'); //内容列表

        _getRecord('get', 1,'mon3');
        _bindEvent();
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent() {
        var $tabList = $('#exchangeRecordTabList span'), //页签选项
            $contents = _nodes.$contentList.find('[data-type]');
        var filtertype = 'mon3',
            recordType = 'get';
        

        $tabList.on('click', function() {
            var $content = $contents.eq($tabList.index(this));
            recordType = $content.attr('data-type'),
            filtertype = $('#recordtime').val();

            $(this).addClass('act').siblings().removeClass('act');
            $content.show().siblings().hide();
            _pager[recordType]=null;
            
            $('#pager').hide();
            _getRecord(recordType, 1 ,filtertype);
        });
        $("#searchBtn").on('click', function() {
            _pager[recordType]=null;
            filtertype = $('#recordtime').val(),
            _getRecord(recordType, 1 ,filtertype);
        });
    }

    /**
     * 获取记录
     * @param {string} type 记录类型(get/use)
     * @param  {int} page 页码（默认1）
     */
    function _getRecord(type, page, filtertype) {
        page = page || 1;

        if(_isRequesting){
            return;
        }
        _isRequesting = 1;

        var requestUrl = type === 'get' ? _ajaxUrls.getRecord : _ajaxUrls.useRecord;

        _util.request({
            url: requestUrl,
            type: 'get',
            dataType: 'json',
            data: {
                'page'  : page,
                'filter': filtertype
            },
            success: function(json) {

                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }

                if(json.status && json.data){

                    _renderRecord(type, json.data.list, json.data.pageCount,filtertype);
                }else{
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete : function(){
                _isRequesting = 0;
            }
        });
    }

    /**
     * 渲染记录
     * @param {string} type 记录类型(get/use)
     * @param  {object} list      记录的数据列表
     * @param  {int} pageCount 总页数
     */
    function _renderRecord(type, list, pageCount, filtertype){
        if(!type){
            return;
        }

        var $content = _nodes.$contentList.find('[data-type="'+ type +'"]'),
            tpl = '';

        //有记录
        if(list && list.length > 0){
            tpl = _uiBinder.bindData(_recordTpl, {
                'list': list
            });
        }else{ //无记录
            tpl = _emptyRecordTpl;
        }
        
        $content.find('table tbody').html(tpl);

        if (!_pager[type] && pageCount) {
            // 创建分页

            _pager[type] = $('#pager').pagination(pageCount, {
                'callback': function(pageNo){
                    _getRecord(type, pageNo,filtertype);
                }
            });
            
        }
        $('#pager').show();
    }

    _util.initNameSpace("CS.page.integral");
    CS.page.integral.record = {
        'init': init
    };
})(jQuery);