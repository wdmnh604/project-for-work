/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {
    function getArticleList(param){
        $.ajax({
            type: "POST",
            url: alist,
            data: param,
            dataType: 'json',
            success: function(data){
                var html = $('script[type="text/template"]').html();
                var arr = [];
                if(data.info) {
                    $.each(data.info, function (i, o) {
                        arr.push(formatTemplate(html, o));
                    });
                    $('#alist').append(arr.join(''));
                    $("#data").attr("time", data.time);
                }
                if(!data.info || data.info.length < 6){
                    $(".more-bottom").replaceWith('<div class="nomore-bottom">没有更多了</div>');
                }
            },
            error: function(){
            }
        });
    }
    $('.more-bottom a').click(function(){
        var time = $("#data").attr("time");
        var LCID = $("#data").attr("value");
        //alert(time);
        if(LCID) {
            var param = {time: time, LCID:LCID};
            getArticleList(param);
        }
    });

    $('.btn-follow a').click(function(){
        if ($(this).hasClass("checked")) {
            $(".btn-follow a").text("关注专栏");
            $(".btn-follow a").removeClass("checked");
        }else{
            $(".btn-follow a").text("已关注");
            $(".btn-follow a").addClass("checked");
        }
    });

    $('.btn-follow a').click(function (event) {
        var param = {
            cauthorid:$("#authorid").attr("value"),
            recommendid:$("#data").attr("value")
        };
        if($("#authorid").attr("value")) {
            $.ajax({
                type: "POST",
                url: setcoll,
                data: param,
                dataType: 'json',
                success: function (data) {
                },
                error: function () {
                }
            });
        }else{
            //跳转至登录
            window.location.href=login;
        }
        var iscoll = parseInt($("#coll").text());
        if($(this).hasClass("checked")){
            //inc
            $("#coll").text(iscoll + 1);
        }else{
            //desc
            $("#coll").text(iscoll - 1);
        }
    });

    function load(){
        var param = {
            recommendid:$("#data").attr("value"),
            type:1
        };
        $.ajax({
            type: "POST",
            url: iscoll,
            data: param,
            dataType: 'json',
            success: function (data) {
                if (data.iscoll) {
                    $(".btn-follow a").text("已关注");
                    $(".btn-follow a").addClass("checked");
                }
            }
        });
    }
    load();
});