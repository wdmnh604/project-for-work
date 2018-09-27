/**
 * 作家合并页面
 * @namespace CS.page.authorMerge.main
 * @update 2016-1-5
 */
(function($){
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _loginPopup = CS.loginPopup;

    var _params = {}, //参数集合
        _nodes = {}, //元素的对象集合
        _maskByJumpRelatePopup = null, //跳过关联浮层的遮罩层组件的实例对象
        _maskByRelateRulePopup = null, //关联规则浮层的遮罩层组件的实例对象
        _isChecking = 0; //是否正在检测笔名

    var _ajaxUrls = {
        'checkAuthorName' : '/Contentv2/Public/ajaxCheckAuthorNameExist.html' //检测笔名
    };

    /**
     * 初始化
     * @param {int} step 步骤编号（从1开始）
     * @param {string} isRelated 帐号是否关联('1':关联, '0'：不关联)
     * @param {string} step3Error 第三步是否出错('1':出错, '':未出错)
     */
    function init(step, isRelated, step3Error){
        _params.step = step || 1;
        _params.isRelated = isRelated || '0';
        _params.step3Error = step3Error || '';

        _nodes.$stepTabBox = $('#stepTabBox');
        _nodes.$step1 = $('#step1');
        _nodes.$step2 = $('#step2');
        _nodes.$step3Form = $('#step3Form');
        _nodes.$step4 = $('#step4');

        _bindEvent();
        _bindEventByStep1();
        _bindEventByStep2();
        _bindEventByStep3();

        _switchStep(_params.step);
    }

    /**
     * 绑定元素事件
     */
    function _bindEvent(){
        var $warningWrap = $('#warningWrap'); //警告横幅

        //关闭警告横幅的按钮
        $('#closeWarningWrapBtn').on('click', function(event) {
            event.preventDefault();
            $warningWrap.hide();
        });

        //查看关联规则的按钮
        $('#wrap').on('click', '[data-node="viewRelateRule"]', function(event) {
            event.preventDefault();
            if(!_maskByRelateRulePopup){
                _maskByRelateRulePopup = new _mask($('#relateRulePopup'));
                _bindEventByRelateRulePopup();
            }
            if(_maskByRelateRulePopup){
                _maskByRelateRulePopup.open();
            }
        });

        //关联规则，美化滚动条
        $('#ruleText').slimScroll({
            height: '350px',
            railVisible: true
        });
    }

    /**
     * 绑定关联规则浮层的元素事件
     */
    function _bindEventByRelateRulePopup(){
        $('#relateRulePopup').find('[data-node="close"]').on('click', function(event) {
            event.preventDefault();
            if(_maskByRelateRulePopup){
                _maskByRelateRulePopup.close();
            }
        });
    }

    /**
     * 绑定第一步的元素事件
     */
    function _bindEventByStep1(){
        //关联帐号按钮
        _nodes.$step1.find('[data-node="relateAccount"]').on('click', function(event) {
            event.preventDefault();
            //到第二步
            _switchStep(2);
        });

        //跳过关联按钮
        _nodes.$step1.find('[data-node="jumpRelateAccount"]').on('click', function(event) {
            event.preventDefault();
            //打开跳过关联的浮层
            _openJumpRelatePopup();
        });
    }

    /**
     * 绑定第二步的元素事件
     */
    function _bindEventByStep2(){
        //返回上一步
        _nodes.$step2.find('[data-node="returnPreStep"]').on('click', function(event) {
            event.preventDefault();
            //到第一步
            _switchStep(1);
        });
    }

    /**
     * 绑定第三步的元素事件
     */
    function _bindEventByStep3(){
        var $siteTypeHidden = $('#siteTypeHidden'); //选中的站点类型的隐藏域

        //跳过关联按钮
        _nodes.$step3Form.find('[data-node="jumpRelateAccount"]').on('click', function(event) {
            event.preventDefault();
            //打开跳过关联的浮层
            _openJumpRelatePopup();
        });

        //不关联：返回上一步按钮
        _nodes.$step3Form.find('[data-node="step3To1"]').on('click', function(event) {
            event.preventDefault();
            //到第一步
            _switchStep(1);
        });

        //关联：返回上一步按钮
        _nodes.$step3Form.find('[data-node="step3To2"]').on('click', function(event) {
            event.preventDefault();
            //到第二步
            _switchStep(2);
        });
        
        //提交表单的按钮
        _nodes.$step3Form.find('[data-node="submitForm"]').on('click', function(event) {
            event.preventDefault();

            var $btn = $(this),
                $siteRadio = _nodes.$step3Form.find('[data-node="siteRadio"]'), //站点单选框
                $authorNameInput = _nodes.$step3Form.find('[data-node="authorNameInput"]'); //笔名输入框

            //需要验证是否选中了站点
            if($siteRadio.length && !$siteTypeHidden.val()){
                _dialog.alert('请勾选笔名');
                return;
            }

            //需要验证笔名
            if($authorNameInput.length){
                _checkAuthorName($authorNameInput.val(),
                    //成功的回调
                    function(){
                        var $inputBox = $authorNameInput.parent();

                        //错误提示
                        $inputBox.siblings('[data-node="errorTip"]').text('');
                        $inputBox.removeClass('no').addClass('ok'); //绿框
                        $authorNameInput.next('span').attr('className', 'ok'); //绿勾

                        _submitStep3Form($btn);
                    },
                    //出错的回调
                    function(){
                        var $inputBox = $authorNameInput.parent();

                        //错误提示
                        $inputBox.siblings('[data-node="errorTip"]').text('笔名格式错误或被占用，请重新输入。');
                        $inputBox.removeClass('ok').addClass('no'); //红框
                        $authorNameInput.next('span').attr('className', 'error'); //红叉
                    }
                );
                return;
            }

            _submitStep3Form($btn);
        });

        //站点单选框
        _nodes.$step3Form.find('[data-node="siteRadio"]').on('click', function () {
            var $el = $(this),
                $input = $el.find('input'),
                $siblings = $el.siblings('[data-node="siteRadio"]');

            $el.addClass('on');
            $siblings.removeClass('on');
            $input.prop('checked', 'checked');
            $siblings.find('input').removeAttr('checked');

            $siteTypeHidden.val($input.attr('id'));
        });
    }

    /**
     * 切换步骤
     * @param  {int} step 步骤编号(从1开始)
     */
    function _switchStep(step){
        if(!step){
            step = 1;
        }
        step = parseInt(step, 10);

        var $tabs = _nodes.$stepTabBox.find('b'),
            stepIndex = step - 1;

        $tabs.each(function(index, el) {
            var className = '';

            if(index < stepIndex){ //已完成步骤
                //第二步，未关联帐号
                if(index === 1 && _params.isRelated !== '1'){
                    className = 'failed';
                }else{
                    className = 'ok';
                }
            }
  
            if(index === 2 && _params.step3Error === '1'){ //第三步，出错
                className = 'failed';
            }

            if(index > stepIndex){ //未完成步骤
                className = 'will';
            }

            $(el).attr('class', className);
        });

        _nodes.$step1.hide();
        _hideStep2();
        _nodes.$step3Form.hide();

        switch(step) {
            case 1:
                _nodes.$step1.show();
                break;
            case 2:
                _showStep2();
                break;
            case 3:
                _nodes.$step3Form.show();
                break;
            default:
                break;
        }
    }

    /**
     * 显示第二步
     */
    function _showStep2(){
        //打开创世登录浮层
        _loginPopup.open('cs');
        _nodes.$step2.show();
    }

    /**
     * 隐藏第二步
     */
    function _hideStep2(){
        //关闭登录浮层
        _loginPopup.close();
        _nodes.$step2.hide();
    }

    /**
     * 提交第三步的表单
     * @param  {object} $btn 提交按钮的jquery对象
     */
    function _submitStep3Form($btn){
        //避免重复提交
        $btn.off('click');

        var formUrl = $btn.attr('data-form-url');
        if(formUrl){
            //更新form的提交地址
            _nodes.$step3Form.attr('action', formUrl);
        }

        //提交表单
        _nodes.$step3Form.submit();
    }

    /**
     * 检测笔名
     * @param  {string} authorName      笔名
     * @param  {function} successCallback 成功时的回调函数
     * @param  {function} errorCallback   失败时的回调函数
     */
    function _checkAuthorName(authorName, successCallback, errorCallback){
        authorName = $.trim(authorName);
        if(authorName.length === 0){
            _dialog.alert('请输入笔名');
            return;
        }

        if(_isChecking){
            return;
        }
        _isChecking = 1;

        //添加已经完成引导的记录
        _util.request({
            url: _ajaxUrls.checkAuthorName,
            data: {
                'authorName': authorName
            },
            type: 'post',
            isShowLoading : false, //不显示加载提示效果
            dataType: "json",
            success : function(data){
                //通过验证 data: true/false
                if(data){
                    if(typeof successCallback === 'function'){
                        successCallback();
                    }
                }else{ //未通过验证
                    if(typeof errorCallback === 'function'){
                        errorCallback();
                    }
                }
            },
            error : function(){
                _dialog.alert(json.info || '检测笔名失败，请稍候再试');
            },
            complete : function(){
                _isChecking = 0;
            }
        });
    }

    /**
     * 打开跳过关联的浮层
     */
    function _openJumpRelatePopup(){
        if(!_maskByJumpRelatePopup){
            //跳过关联的浮层
            _maskByJumpRelatePopup = new _mask($('#jumpRelatePopup'));
            _bindEventByJumpRelatePopup();
        }

        if(_maskByJumpRelatePopup){
            _maskByJumpRelatePopup.open();
        }
    }

    /**
     * 绑定询问是否跳过关联帐号的浮层的事件
     */
    function _bindEventByJumpRelatePopup(){
        var $popup = $('#jumpRelatePopup');

        //关闭、取消按钮
        $popup.find('[data-node="close"]').on('click', function(event) {
            event.preventDefault();
            _closeJumpRelatePopup();
        });
    }

    /**
     * 关闭询问是否跳过关联帐号的浮层
     */
    function _closeJumpRelatePopup(){
        if(_maskByJumpRelatePopup){
            _maskByJumpRelatePopup.close();
        }
    }

    _util.initNameSpace("CS.page.authorMerge");
    CS.page.authorMerge.main = {
        'init' : init
    };
})(jQuery);