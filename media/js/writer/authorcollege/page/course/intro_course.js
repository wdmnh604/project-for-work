/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {

    $('.bookmark').on('click','#colltag', function (event) {
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
            recommendid:$("#CAID").attr("value"),
            type:2
        };
        $.ajax({
            type: "POST",
            url: iscoll,
            data: param,
            dataType: 'json',
            success: function (data) {
                if (data.iscoll) {
                    $(".bookmark").html('<a  id="colltag" class="mark checked" href="javascript:;">已收藏</a>');
                }
            }
        });
    }
    load();
});