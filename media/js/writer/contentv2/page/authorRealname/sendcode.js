/**
 * 创建作品站点
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _nodes = {};//页面元素集合

    /**
     * 初始化
     */
    function init(urlSendcode,urlAuthcode,urlIndex) {
         _params.urlSendcode=urlSendcode || '';
         _params.urlAuthcode=urlAuthcode || '';
         _params.urlIndex=urlIndex || '';
         _nodes.$phone=$('#sendcode_phone');
         _nodes.$code=$('#sendcode_code');
         _nodes.$phone_err=$('#sendcode_phone_err');
         _nodes.$code_err=$('#sendcode_code_err');
         _nodes.$sendcode=$('#sendCode');
         _nodes.$nextbtn=$('#sendcode_nextbtn');
         _nodes.$prebtn=$('#sendcode_prebtn');
         _nodes.$form=$('#autoauthForm');
        _bindEvent();
       
    }

    /**
     * 绑定事件
     */
    function _bindEvent() {
        
        //发送验证码
        _nodes.$sendcode.on('click',function(){
            _sendcodev2(this);
       });
       //下一步
       _nodes.$nextbtn.on('click',function(){
            _nextstep();    
       });
       _nodes.$prebtn.on('click',function(){
           window.location.href=_params.urlIndex;
       });
       
    }
    function _nextstep()
    {
        _nodes.$code_err.text('');
        _nodes.$phone_err.text('');
        if(!_util.isPhone(_nodes.$phone.val()))
        {
            _nodes.$phone_err.text('您的手机号格式有误，请重新输入');
            return ;
        }
        if(!_util.isPositiveInteger(_nodes.$code.val()))
        {
            _nodes.$code_err.text('您的验证码有误，请重新输入');
            return ;
        }
        _util.request({
            url: _params.urlAuthcode,
            type: 'post',
            dataType: 'json',
            data: {
                'phone':_nodes.$phone.val(),
                'code' :_nodes.$code.val(),
                '_token': $.cookie('pubtoken')
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }
                if(json.status){
                    _nodes.$form.submit();
                }else{
                    _nodes.$code_err.text(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
        });
    }
    function _autoauth()
    {
        _util.request({
            url: _params.urlAuthcode,
            type: 'post',
            dataType: 'json',
            data: {
                'phone':_nodes.$phone.val(),
                'code' :_nodes.$code.val(),
                '_token': $.cookie('pubtoken')
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }
                if(json.status){
                    
                }else{
                    _nodes.$code_err.text(json.info || '操作失败，请稍后再试');
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
        });
    }
    function _sendcodev2(obj)
    {
            if(!_util.isPhone(_nodes.$phone.val()) || _nodes.$phone.val().length != 11)
            {
                _nodes.$phone_err.text('您的手机号格式有误，请重新输入');
                return ;
            }
            _nodes.$phone_err.text('');
            _sendcode();
           $(obj).off('click');
           if($(obj).hasClass('disableSend')) return false;
           //定参数
           var numTime = 60,
               _this = $(obj),
               timer;
           //初始化
           _this.addClass('disableSend').text( numTime + 's 再次发送');
            //倒计时
           timer = setInterval(function(){
               numTime--;
                //重置倒计时时间
               _this.text( numTime + 's 再次发送');
                //当为0的时候清除定时器,还原
               if(numTime == 0 ){
                   clearInterval(timer);
                   _this.removeClass('disableSend').text('发送验证码');
                   $(obj).on('click',function(){
                        _sendcodev2(this);
                   });
               }
           },1000);
    }
    /**
     * [_sendcode 发送验证码]
     * @return {[type]} [description]
     */
    function _sendcode()
    {
        _util.request({
            url: _params.urlSendcode,
            type: 'post',
            dataType: 'json',
            data: {
                'phone':_nodes.$phone.val(),
                '_token': $.cookie('pubtoken')
            },
            success: function(json) {
                if (!json) {
                   _dialog.alert('返回数据格式异常，请稍后再试');
                   return;
                }
                if(!json.status){
                   _dialog.alert(json.info || '操作失败，请稍后再试');   
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍后再试');
            },
        });
    }
    _util.initNameSpace("CS.page.authorRealname");
    CS.page.authorRealname.sendcode = {
        "init": init
    };
})(jQuery);