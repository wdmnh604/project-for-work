/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {
    $('.btn-attitude').on('click',".btn-blue.btn-true", function (event) {
        $(".btn-attitude").html('<a class="btn-blue btn-false" href="javascript:;">提交评价</a>');
        var param = {
            compositescore: $('#compositescore .checked').length*20,
            contentscore: $('#contentscore .checked').length*20,
            difficultyscore: $('#difficultyscore .checked').length*20,
            teachingscore: $('#teachingscore .checked').length*20,
            cauthorid:$("#authorid").attr("value"),
            recommendid:$("#CAID").attr("value")
        };
        //alert($("#authorid").attr("value"));
        if($("#authorid").attr("value")) {
            $.ajax({
                type: "POST",
                url: feedback,
                data: param,
                dataType: 'json',
                success: function (data) {
                },
                error: function () {
                    $(".btn-attitude").html('<a class="btn-blue btn-false" href="javascript:;">提交评价</a>');
                }
            });
        }else{
            //跳转至登录
            window.location.href=login;
        }
    });

    $('.bookmark').on('click','#colltag', function (event) {
        //收藏/取消
        var param = {
            cauthorid:$("#authorid").attr("value"),
            recommendid:$("#CAID").attr("value")
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

    $(".attachment").on("click","a",function(){
        if(!$("#authorid").attr("value")){
            window.location.href=login;
            return false;
        }
    });

    $(".attitude").on("click","a",function(){
        if($("#CAID").attr("isscore")==0){
            $(".btn-attitude").html('<a class="btn-blue btn-true" href="javascript:;">提交评价</a>');
        }
    });

    function rebuildStart(star){
        var i = 0;
        var htm="";
        star = star/20;
        while(i<5){
            if(star>i) {
                htm += '<a class="star checked" href="javascript:;"></a>';
            }else{
                htm += '<a class="star" href="javascript:;"></a>';
            }
            i++;
        }
        return htm;
    }

    function load(){
        var param = {
            recommendid:$("#CAID").attr("value"),
            type:2
        };
        $.ajax({
            type: "POST",
            url: iscollscore,
            data: param,
            dataType: 'json',
            success: function (data) {
                if (data.iscoll) {
                    $(".bookmark").html('<a  id="colltag" class="mark checked" href="javascript:;">已收藏</a>');
                }
                if (data.isscore) {
                    $("#CAID").attr("isscore",1);
                    $(".btn-attitude").html('<a class="btn-blue btn-false" href="javascript:;">提交评价</a>');
                    //星星的标示
                    $("#compositescore a").remove();
                    $("#compositescore").append(rebuildStart(data.score.compositescore));
                    $("#contentscore a").remove();
                    $("#contentscore").append(rebuildStart(data.score.contentscore));
                    $("#difficultyscore a").remove();
                    $("#difficultyscore").append(rebuildStart(data.score.difficultyscore));
                    $("#teachingscore a").remove();
                    $("#teachingscore").append(rebuildStart(data.score.teachingscore));
                }
            },
            error: function () {
            }
        });
    }
    load();
});