/**
 * 单个作品的书评列表页
 * @namespace CS.page.news.commentList
 * @author langtao
 * @update 2014-12-15
 */
;
(function($) {
    //外部依赖
    var _util = CS.util,
        _mask = CS.mask,
        _dialog = CS.dialog;

    var _params = {}, //参数集合
        _pageIndex = 2, //页码
        _hasNextPage = true,
        _totalPageCount = 2,
        _isLoading = 0; //是否正在加载内容

    var defaultext = "";
    //单条回复
    var _replyliTpl = [
        '<dd id="replyItem$replyid$">',
        '<div class="commentHead">',
        '<div class="commentTitle"> <img src="$avatar$" width="25" height="25">',
            '<div class="commentInfo">',
                '<h3><b>$nickname$</b><em>$formatTime$</em></h3>',
            '</div>',
            '<div class="commentText">',
                '<p>$content$</p>',
            '</div>',
        '</div>',
        '<div class="rightReply">',
            '<a nodetype="atReply" href="javascript:" nkname="$nickname$" rid="$replyid$" ><span></span>回复</a> <a nodetype="atMore" uid="$uid$" status="$forbidden$" rid="$replyid$" href="javascript:"><span></span>更多</a>',
        '</div>',
        '</div>',
        '</dd>'
    ].join('');

    //单条@回复的模板
     var _replyTpl = [
        '<div class="replySubBox">',
            '<p>@$name$</p>',
            '<p>$content$</p>',
        '</div>'    
     ].join('');         

   /**
    * 初始化
    * @param {int} bid 作品id
    * @param {string} getCommentListAjaxUrl 获取书评列表的ajax地址
    * @param {string} topAjaxUrl 置顶/取消置顶的ajax地址
    * @param {string} setBetterAjaxUrl 加精/取消加精的ajax地址
    * @param  {string} sendFlowerAjaxUrl 书评送花的ajax地址
    * @param  {string} replyCommentAjaxUrl 回复书评的ajax地址
    * @param  {string} deleteReplyAjaxUrl 删除回复的ajax地址
    */
    function init(bid, cid, getCommentListAjaxUrl, getCommentRepListAjaxUrl, topAjaxUrl, setBetterAjaxUrl, sendFlowerAjaxUrl,deleteCmmtAjaxUrl, replyCommentAjaxUrl, deleteReplyAjaxUrl, forbiddenAjaxUrl) {
        _params.bid = bid || 0;
        _params.cid = cid || 0;
        _params.getCommentRepListAjaxUrl = getCommentRepListAjaxUrl || '';
        _params.topAjaxUrl = topAjaxUrl || '';
        _params.setBetterAjaxUrl = setBetterAjaxUrl || '' ;
        _params.sendFlowerAjaxUrl = sendFlowerAjaxUrl || '';
        _params.replyCommentAjaxUrl = replyCommentAjaxUrl || '';
        _params.deleteCmmtAjaxUrl = deleteCmmtAjaxUrl || '';
        _params.deleteReplyAjaxUrl = deleteReplyAjaxUrl || '';
        _params.forbiddenAjaxUrl = forbiddenAjaxUrl || '';
        // _params.endTime = endTime || '';
        _params.getCommentListAjaxUrl = getCommentListAjaxUrl || '';
        _bindEvent();
    }

    /**
     * 绑定页面元素事件
     */
    function _bindEvent() {
        var $commentRepList = $('#commentRepList'), //书评列表
            $loadingTipsBox = $('#loadingTipsBox'); //加载提示的容器

        //滚动加载组件
        $(window).scrollLoad({
            'scrollBottomCallback' : function(scrollLoadInstance){
                //没有下一页了
                if(_pageIndex > _totalPageCount && scrollLoadInstance){
                    //注销滚动事件
                    scrollLoadInstance.cancelScrollEvent();
                    return;
                }

                if(_isLoading){
                    return;
                }
                _isLoading = 1;
                $loadingTipsBox.show();
                window.setTimeout(function(){
                    _getCommentRepList(_pageIndex);
                }, 500);
            }
        });            
        //置顶
        $("#settop").click(function(){
            var type = $(this).attr('status');

                _topComment(type);
                return false;            
        });
        //加精
        $("#setbetter").click(function(){
            var type = $(this).attr('status'),
                userId = $(this).attr('uid');

                _setBetter(type, userId);
                return false;            
        });
        //送花
        $("#setflower").click(function(){
            var flowerCount = 1,
                userId = $(this).attr('uid');
                _sendFlower(userId, flowerCount);
                return false;            
        });
        //点开书评更多
        $("#setmore").click(function(){
            $("#moreCmmtPopup").show();
            $("#maskPopDiv").show();
            var status = $(this).attr('status');
            _changeStatus($("#moreCmmtPopup").find('[type="c"]'), status);
        });

        $("#maskPopDiv").click(function(){
            $("#moreCmmtPopup").hide();
            $("#maskPopDiv").hide();
            $("#moreRepPopup").hide();
        });
        //删除书评
        $("#setdelete").click(function(){
            _dialog.confirm('你确定要删除此书评吗？', function(){
                _deleteComment();
            });
        });
        //发送回复
        $("#sendReplyBtn").click(function(){
            var rid = $("#repInput").attr('rid'),
                content = $.trim($("#repInput").val());
            _replyComment(rid, content);

        });
        //删除回复
        $(".choiceList [nodetype='delReply']").click(function(){
            var replyId = $(this).attr('rid');
            _dialog.confirm('你确定要删除此回复吗？', function(){
                _deleteReply(replyId);
            });            
        });

        //禁言
        $(".choiceList .fbden").click(function(){
            var uid = $(this).attr('uid'),
                status =$(this).attr('status'),
                time = $(this).attr('time');
                rid = $(this).attr('rid');
                _forbbidenUser(uid, time, status, $(this), rid);
        });   

        //解除禁言
        $(".choiceList .cancfbden").click(function(){
            var uid = $(this).attr('uid'),
                status =$(this).attr('status');
                type = $(this).attr('type');// 
                rid = $(this).attr('rid');
                _forbbidenUser(uid,"", status, $(this), rid);
        });         
        $("#repInput").click(function(){
            var value = $.trim($(this).val());
            if (defaultext == value){
                $(this).val('');
            }
            $(this).css('color','#000');
        });

        $commentRepList
            .on('click', '.commentTitle', function(){ 
                var obj = $(this).closest("dd").siblings('dd').find('.commentTitle');
                if (obj.hasClass('slide')){
                    obj.removeClass('slide');
                    obj.animate({marginLeft: "0"}, "fast");
                    obj.siblings(".rightReply").animate({right: "-200px"}, "fast");  
                    return false;                  
                }
                _slideRepli($(this));
            })
            .on('click', '[nodetype="atMore"]', function(){ //回复查看更多
                var replyId = $(this).attr('rid'),
                    uid = $(this).attr('uid'),
                    status = $(this).attr('status');
                
                _showRepMoreOpt(replyId, uid, status);
            })
            .on('click', '[nodetype="delReply"]', function() { //删除回复
                var replyId = $(this).attr('rid');
                _dialog.confirm('你确定要删除此回复吗？', function(){
                    _deleteReply(replyId);
                });
                return false;
            })
            .on('click', '[nodetype="atReply"]', function() { //@回复
                var   rpInput = $("#repInput");
                defaultext = "@"+$(this).attr('nkname');
                rpInput.val(defaultext);
                rpInput.attr('rid', $(this).attr('rid'));
                rpInput.css('color','#888');
                // rpInput.removeClass('commentInput').focus();
                _slideRepli($(this).parent().siblings(".commentTitle"));
                return false;
            });
    }

    //左右滑
    function _slideRepli(ojb){
        if (ojb.hasClass('slide')){
            ojb.removeClass('slide');
            ojb.animate({marginLeft: "0"}, "fast");
            ojb.siblings(".rightReply").animate({right: "-200px"}, "fast");
        }else{
            ojb.addClass('slide');
            ojb.animate({marginLeft: "-190px"}, "fast");
            ojb.siblings(".rightReply").animate({right: "5px"}, "fast");                        
        }        
    }

    //显示更多
    function _showRepMoreOpt(replyId, uid, status){

        var fbdden = $("#moreRepPopup .fbden").parent("li"),
            canfbdden = $("#moreRepPopup .cancfbden").parent("li"),
            repPop_a = $("#moreRepPopup a");        

        $("#moreRepPopup").show();
        $("#maskPopDiv").show();
        repPop_a.attr('uid', uid);
        repPop_a.attr('rid', replyId);

        if (status==1){
            fbdden.show();
            canfbdden.hide();            
        }else{
            canfbdden.show();
            fbdden.hide();            
        }
    }

    function _changeStatus(optobj, status){

        var fbdden = optobj.closest('.choiceList').find(".fbden").parent("li"),//禁言
            canfbdden = optobj.closest('.choiceList').find(".cancfbden").parent("li");//取消禁言

        if (status==1){
            fbdden.show();
            canfbdden.hide();            
        }else{
            canfbdden.show();
            fbdden.hide();            
        }
    }

    function _toggleMask(){

        $("#moreCmmtPopup").hide();
        $("#maskPopDiv").hide();
        $("#moreRepPopup").hide();
    }

    /**
     * 获取书评回复列表
     * @param {int} page 页面（从1开始）
     */
    function _getCommentRepList(page) {
        page = page || 1;
        _util.request({
            url: _params.getCommentRepListAjaxUrl,
            data: {
                'BID': _params.bid,
                'cid': _params.cid,
                'page' : page,
                'ajax' : 1
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if (json.code === '2000') {
                    if(json.result.html){
                        $('#commentRepList').append(json.result.html);
                    }

                    if('pageCount' in json.result){
                        _totalPageCount = json.result.pageCount;
                    }
                    _pageIndex++;

                } else {
                    if (json.info) {
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _hasNextPage = false;
                _dialog.alert('获取书评回复失败，请稍候再试');
            },
            complete : function(){
                _isLoading = 0;
                $('#loadingTipsBox').hide();
            }
        });
    }    


    /**
     * 书评置顶/取消置顶
     * @param  {int} type   操作类型（）
     * @param  {int} commentId 书评id
     */
    function _topComment(type){
        type = type || 0;

        _util.request({
            url: _params.topAjaxUrl,
            data: {
                'top' : type,
                'BID': _params.bid,
                'commentid': _params.cid
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.result.status){
                    var status = 1,
                        thisclass = 'red';

                    //取消置顶成功后
                    if(type === '1'){
                        status = 0;
                        thisclass = '';
                    }

                    //置顶按钮
                    $("#settop").attr('status', status).attr('class',thisclass);
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
     * 书评加精/取消加精
     * @param  {int} type   操作类型（）
     * @param  {int} commentId 书评id
     * @param  {int} userId 书评用户id
     */
    function _setBetter(type, userId){
        
        if(!userId){
            _dialog.alert('书评用户id未获取到');
            return;
        }

        type = type || 0;
       
        _util.request({
            url: _params.setBetterAjaxUrl,
            data: {
                'better' : type,
                'BID' : _params.bid,
                'commentid' : _params.cid,
                'toUid' : userId
            },
            type: 'get',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.result.status){
                    var status = 1,
                        thisclass = 'red';

                    //取消置顶成功后
                    if(type === '1'){
                        status = 0;
                        thisclass = '';
                    }
                    //加精按钮
                    $("#setbetter").attr('status', status).attr('class',thisclass);
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
     * 书评送花
     * @param  {int} commentId 书评id
     * @param  {int} userId 书评用户id
     * @param  {int} flowerCount 送花/取消送花的数量
     */
    function _sendFlower(userId, flowerCount){
        
        if(!userId){
            _dialog.alert('书评用户id未获取到');
            return;
        }
        _util.request({
            url: _params.sendFlowerAjaxUrl,
            data: {
                'BID' : _params.bid,
                'commentid' : _params.cid,
                'toUid' : userId,
                'flower' : flowerCount
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.code == '2000'){
                    var thisclass = 'red';
                    $("#setflower").attr('class',thisclass);
                    _dialog.alert("送花成功！");
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
     * 回复书评
     * @param  {int} commentId 书评id
     * @param  {string} content   回复内容
     */
    function _replyComment(rid, content){
        if (!rid) rid = 0;
        content = content ? $.trim(content) : '';
        if(content.length === 0){
            _dialog.alert('请输入回复内容');
            return;
        }

        _util.request({
            url: _params.replyCommentAjaxUrl,
            data: {
                'BID' : _params.bid,
                'cid' : _params.cid,
                'repid' : rid,
                'content' : content
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if (json.code == '2000') {
                        
                    //清空回复输入框的内容
                    $("#repInput").val('');
                    $("#repInput").attr('rid','');
                    _dialog.alert(json.info);
                    //把回复内容放到对应的 @用户下面
                    if(json.result.data && json.result.reply && json.result.authorInfo){
                        var replyTpl = _util.replaceTpl(_replyliTpl, {
                                'uid' : json.result.authorInfo.uid,
                                'avatar' : json.result.authorInfo.avatar,
                                'nickname': json.result.authorInfo.authorname,
                                'formatTime': json.result.reply.creatime,
                                'forbidden' : json.result.authorInfo.forbidden,
                                'replyid': json.result.reply.replyid,
                                'content': json.result.reply.content,
                            });
                        //单条回复添加到回复列表
                        $('#commentRepList').append(replyTpl);
                        if (rid){
                            var replyTpl = _util.replaceTpl(_replyTpl, {
                                'name' : json.result.reply.p_reply.name,
                                'content' : json.result.reply.p_reply.content,
                            });                            
                            $("#replyItem"+json.result.reply.replyid).append(replyTpl);
                        }
                    }
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
     * 删除书评
     * @param  {int} replyId   回复id
     */
    function _deleteComment(){
       
        _util.request({
            url: _params.deleteCmmtAjaxUrl,
            data: {
                'BID' : _params.bid,
                'cid' : _params.cid,
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.code == '2000'){
                    //移除对应的 书评
                    _toggleMask();
                    // $("#cmmtdetailInfo").html("<p style=\"text-align:center;\">评论已经被删除！</p>");
                    _dialog.alert("删除成功");
                    window.location.href= _params.getCommentListAjaxUrl+"?BID="+_params.bid;
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }    

    /**
     * 删除回复
     * @param  {int} replyId   回复id
     */
    function _deleteReply(replyId){
        if(!replyId){
            _dialog.alert('回复id未获取到');
            return;
        }
        _util.request({
            url: _params.deleteReplyAjaxUrl,
            data: {
                'BID' : _params.bid,
                'rid' : replyId
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.code == '2000'){
                    _dialog.alert(json.info);
                    //移除对应的单条回复
                    var $replyItem = $('#replyItem'+ replyId); //单条回复的容器
                    $replyItem.remove();
                    _toggleMask();
                    return;
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }

    /**
     * 禁言
     * @param  {int} replyId   回复id
     */
    function _forbbidenUser(uid, time, status, optobj, rid){
        if(!uid || !optobj){
            _dialog.alert('出错，请重新操作');
            return;
        }
        _util.request({
            url: _params.forbiddenAjaxUrl,
            data: {
                'BID' : _params.bid,
                'cid' : _params.cid,
                'uid' : uid,
                'status' : status,
                'time': time
            },
            type: 'post',
            dataType: "json",
            success: function(json) {
                if(!json){
                    _dialog.alert('数据返回格式不正确，请稍候再试');
                    return;
                }
                //成功
                if(json.code == '2000'){
                    _dialog.alert(json.info);
                    _toggleMask();    
                    var newstatus = status == 1 ? 0 : 1;
                    if (rid){
                        $("#commentRepList").find('[uid=\"'+uid+'\"]').attr('status', newstatus);
                    }else{
                        $("#setmore").attr('status', newstatus);
                    }                    
                    return;
                }else{
                    if(json.info){
                        _dialog.alert(json.info);
                    }
                }
            },
            error: function() {
                _dialog.alert('操作失败，请稍候再试');
            }
        });
    }


    _util.initNameSpace("CS.page.news");
    CS.page.news.commentOpt = {
        'init': init
    };
})(jQuery);