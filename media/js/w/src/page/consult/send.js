/**
 * 发送咨询页面
 * @namespace CS.page.consult.send
 * @author langtao
 * @update 2015-1-12
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _isSending = 0, //是否正在发送咨询
        _defaultContent = '输入您要咨询的内容';
      

   /**
    * 初始化
    * @param {string} sendConsultAjaxUrl 发送咨询的ajax地址
    */
    function init(sendConsultAjaxUrl,sendlistUrl) {
        _params.sendConsultAjaxUrl = sendConsultAjaxUrl || '';
        _params.sendlistUrl = sendlistUrl || '';
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        //站点选择
        $('#siteSelect').on('click', function() {
            $("#questionFrom").show();
            $("#maskPopDiv").show();
        });

        //问题类型的选择
        $('#typeSelect').on('click', function() {
            $("#questionType").show();
            $("#maskPopDiv").show();            
        });

        $("#maskPopDiv").click(function(){
            $("#questionType").hide();
            $("#maskPopDiv").hide();
            $("#questionFrom").hide();
        });        

        $(".quesfrom").click(function(){
            $("#siteSelect").text($(this).text());
            $("#hiddenForm [name='quesfrom']").val($(this).attr('fvalue'));
            $("#maskPopDiv").click();
        });

        $(".questype").click(function(){
            $("#typeSelect").text($(this).text());
            $("#hiddenForm [name='questype']").val($(this).attr('cvalue'));
            $("#maskPopDiv").click();
        });        

        //咨询内容输入框
        $("#hiddenForm [name='quescontent']")
            .on('focus', function() {
                if($(this).val() === _defaultContent){
                    $(this).val('').removeClass('gray').addClass('black');
                }
            })
            .on('blur', function() {
                if($(this).val() === ''){
                    $(this).val(_defaultContent).removeClass('black').addClass('gray');
                }
            });
    }

    /**
     * 提交咨询
     */
    function submit(){
        var consultfrom = $("#hiddenForm [name='quesfrom']").val(),
            consulttype = $("#hiddenForm [name='questype']").val(),
            content = $("#hiddenForm [name='quescontent']").val();

        _sendConsult(consulttype, consultfrom, content);
    }

    /**
     * 发送咨询
     */
    function _sendConsult(consultType, consultfrom, content) {

        content = content ? $.trim(content) : '';
        if (!consultfrom){
            _dialog.alert("请选择问题出处");
            return;            
        }
        if (!consultType){
            _dialog.alert("请选择问题分类");
            return;            
        }        
        if(content.length === 0 || content === _defaultContent){
            _dialog.alert(_defaultContent);
            return;
        }
        if(_isSending){
            return;
        }
        _isSending = 1;

        _util.request({
            url: _params.sendConsultAjaxUrl,
            data: {
                'qtype': consultType,
                'qsite': consultfrom,
                'message' : content,
                'ajax' : 1
            },
            type: 'POST',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if (json.code == '2000') {
                    _dialog.alert("发送成功");
                    //清空输入框内容
                    window.location.href = _params.sendlistUrl+"?r="+ Math.random();
                }else{
                    if (json.info) {
                        _isSending = 0;
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _isSending = 0;
                _dialog.alert('操作失败，请稍候再试');
            },
            complete : function(){
                _isSending = 0;
            }
        });
    }

    _util.initNameSpace("CS.page.consult");
    CS.page.consult.send = {
        'init': init,
        'submit' : submit
    };
})(jQuery);