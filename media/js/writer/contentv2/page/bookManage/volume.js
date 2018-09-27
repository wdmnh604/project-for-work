/**
 * 作品管理：分卷
 * @namespace CS.page.bookManage.volume
 * @author  langtao
 * @update 2015-12-22
 */
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog,
        _topTip = CS.topTip; //顶部提示

    var _params = {}, //参数集合
        _isSubmitting = 0, //是否正在提交章节
        _maskByCreateVolumePopup = null; //创建分卷浮层的遮罩层组件的实例对象
   
    var _ajaxUrls = {
        'submitVolume': '/Contentv2/Booksubmit/volumeManageSubmit.html' //创建/更新分卷信息
    };

    //新建分卷浮层的模板
    var _createVolumePopupTpl = [
        '<div id="createVolumePopup" class="popupWrap w380 hidden">',
            '<a data-node="close" class="icon closePopup" href="javascript:" title="关闭"></a>',
            '<h3 data-node="volumeSort"></h3>',
            '<div class="popupBody p30">',
                '<div class="popupContent select">',
                    '<p>分卷名称</p>',
                    '<p class="mb20">',
                        '<input data-node="volumeTitleInput" class="longInput" type="text" value="">',
                    '</p>',
                    '<p>分卷介绍</p>',
                    '<textarea data-node="volumeDescInput"></textarea>',
                '</div>',
                '<div class="confirmBtn">',
                    '<a data-node="confirm" class="button full" href="javascript:">确定</a>',
                    '<div></div>',
                '</div>',
            '</div>',
        '</div>'
    ].join('');

     /**
      * 初始化
      * @param  {string} bookId         作品id
      * @param {string} isVipNovel  是否vip作品(1:vip -1：普通)
      * @param  {string} newVolumeName 分卷名称
      */
    function init(bookId, isVipNovel, newVolumeName) {
        _params.bookId = bookId || 0;
        _params.isVipNovel = isVipNovel || -1;
        _params.newVolumeName = newVolumeName || '新建分卷';
    }

    /**
     * 绑定创建分卷浮层的事件
     */
    function _bindEventByCreateVolumePopup(){
        var $popup = $('#createVolumePopup');

        //关闭按钮
        $popup.find('[data-node="close"]').on('click', function(event) {
            event.preventDefault();
            closeCreateVolumePopup();
        });

        //确定按钮
        $popup.find('[data-node="confirm"]').on('click', function(event) {
            event.preventDefault();

            submitVolume({
                'bookId': _params.bookId, //作品id
                'type': 'add', //操作类型（add: 添加，update: 修改, delete: 删除）
                'isVip': _params.isVipNovel, //是否vip卷(1:vip, -1: 普通)
                'volumeName': $popup.find('[data-node="volumeTitleInput"]').val(), //卷标题
                'volumeDesc': $popup.find('[data-node="volumeDescInput"]').val(), //卷描述
                'alertType': 'alert', //提示方式(alert：居中浮层提示/topTip：顶部提示)
                'successCallback': _refreshCurrentPage //成功后的回调函数
            });
        });
    }

   /**
    * 打开创建分卷浮层
    */
    function openCreateVolumePopup(){
        var $popup = $('#createVolumePopup');

        if($popup.length === 0){
            $(document.body).append(_createVolumePopupTpl);

            $popup = $('#createVolumePopup');
            _bindEventByCreateVolumePopup();

            _maskByCreateVolumePopup = new _mask($popup);
        }

        if(_maskByCreateVolumePopup){
            $popup.find('[data-node="volumeSort"]').text(_params.newVolumeName);
            $popup.find('[data-node="volumeTitleInput"]').val('');
            $popup.find('[data-node="volumeDescInput"]').val('');

            _maskByCreateVolumePopup.open();
        }
    }

    /**
     * 关闭创建分卷的浮层
     */
    function closeCreateVolumePopup(){
        if(_maskByCreateVolumePopup){
            _maskByCreateVolumePopup.close();
        }
    }

    /**
     * 刷新当前页
     */
    function _refreshCurrentPage(){
        location.href = location.href;
    }

    /**
     * 检测分卷信息是否有效
     * @param  {string} volumename   卷标题
     * @param  {string} volumedesc   卷描述
     * @return {boolean}      卷信息是否符合条件
     */
    function _checkVolumeInfo(volumename, volumedesc) {
        volumename = $.trim(volumename);
        volumedesc = $.trim(volumedesc);
       
        if (volumename.length > 20) {
            _dialog.alert('请输入最多20字作为卷名称!');
            return false;
        }

        if (volumedesc.length > 140) {
            _dialog.alert('请输入最多140字介绍该分卷!');
            return false;
        }

        return true;
    }

    /**
     * 提交分卷
     * @param  {object} options 传参配置
     */
    function submitVolume(options){
        if(!options){
            return;
        }

        options = $.extend({
            'bookId' : _params.bookId || 0, //作品id
            'type': 'update', //操作类型（add: 添加，update: 修改, delete: 删除）
            'isVip': _params.isVipNovel || -1, //是否vip卷(1:vip, -1: 普通)
            'volumeName': '', //卷标题
            'volumeDesc': '', //卷描述
            'volumeId': 0, //卷id (可选: 添加分卷不用传)
            'alertType': 'topTip', //提示方式(alert：居中浮层提示/topTip：顶部提示)
            'successCallback': function(){} //成功后的回调函数
        }, options);
        
        //非删除操作
        if(options.type !== 'delete'){
            //检测用户输入的分卷信息
            var isPass = _checkVolumeInfo(options.volumeName, options.volumeDesc);
            if(!isPass){
                return;
            }
        }

        //避免同时多次请求
        if(_isSubmitting){
            return;
        }
        _isSubmitting = 1;

        var alertTip = _topTip.show;

        if(options.alertType === 'alert'){
            alertTip = _dialog.alert;
        }

        _util.request({
            url: _ajaxUrls.submitVolume,
            data: {
                'CBID': options.bookId,
                'type': options.type,
                'CVID': options.volumeId,
                'isvip': options.isVip,
                'volumename': options.volumeName,
                'volumedesc': options.volumeDesc,
                '__hash__':$('input[name="__hash__"]').val()//token
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if (!json) {
                    return;
                }

                if (json.status) {
                    //关闭浮层
                    closeCreateVolumePopup();

                    alertTip(json.info || '操作成功', function(){
                        if(typeof options.successCallback === 'function'){
                            options.successCallback();
                        }
                    });
                } else {
                    alertTip(json.info || '操作失败，请稍候再试');
                }
            },
            error: function() {
                alertTip('操作失败，请稍候再试');
            },
            complete : function(){
                _isSubmitting = 0;
            }
        });
    }

    _util.initNameSpace("CS.page.bookManage");
    CS.page.bookManage.volume = {
        'init': init,
        'submitVolume': submitVolume, //提交分卷
        'openCreateVolumePopup' : openCreateVolumePopup //打开创建分卷的浮层
    };
})(jQuery);