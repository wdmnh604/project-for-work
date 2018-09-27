/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {
    function getArticleList(param){
        $.ajax({
            type: "POST",
            url: collarticle,
            data: param,
            dataType: 'json',
            success: function(data){
                var html = $('script[type="text/templateA"]').html();
                var arr = [];
                if(data.info) {
                    $.each(data.info, function (i, o) {
                        arr.push(formatTemplate(html, o));
                    });
                    $('#article').append(arr.join(''));
                    $("#data").attr("atime", data.time);
                }

                if(!data.info || data.info.length < 3 || $("#acount").text()== 4){
                    $("#amore").replaceWith('<div class="nomore-bottom">没有更多了</div>');
                }
            },
            error: function(){
            }
        });
    }
    $('#amore a').click(function(){
        var time = $("#data").attr("atime");
        var param = {time:time};
//            alert(time);
        getArticleList(param);
    });

    function getArticleList1(param){
        $.ajax({
            type: "POST",
            url: collchannel,
            data: param,
            dataType: 'json',
            success: function(data){
                var html = $('script[type="text/templateC"]').html();
                var arr = [];
                if(data.info) {
                    $.each(data.info, function (i, o) {
                        arr.push(formatTemplate(html, o));
                    });
                    $('#channel').append(arr.join(''));
                    $("#data").attr("ctime", data.time);
                }
                if(!data.info || data.info.length < 4 || $("#acount").text()== 4){
                    $("#cmore").replaceWith('<div class="nomore-bottom">没有更多了</div>');
                }
            },
            error: function(){
            }
        });
    }
    $('#cmore a').click(function(){
        var time = $("#data").attr("ctime");
        var param = {time:time};
//            alert(time);
        getArticleList1(param);
    });

    $('#article').on('click','.cancel a', function (event) {
        //取消
        var param = {
            cauthorid:$("#authorid").attr("value"),
            recommendid:$(this).attr("value"),
        };
        $(this).parent().parent().parent().remove();
        if(!$('#article:has(div)').length){
            $('.my-collection').remove();
        }
        show();
        var count = $("#acount").text();
        $("#acount").text(count-1);
        if($("#authorid").attr("value")) {
            $.ajax({
                type: "POST",
                url: setacoll,
                data: param,
                dataType: 'json',
                success: function (data) {
                }
            });
        }
        //getArticleList({});
    });

    $('#channel').on('click','.cancel a', function (event) {
        //取消
        var param = {
            cauthorid:$("#authorid").attr("value"),
            recommendid:$(this).attr("value"),
        };
        $(this).parent().parent().remove();
        if(!$('#channel:has(div)').length){
            $('.my-interest').remove();
        }
        show();
        var count = $("#ccount").text();
        $("#ccount").text(count-1);
        if($("#authorid").attr("value")) {
            $.ajax({
                type: "POST",
                url: setccoll,
                data: param,
                dataType: 'json',
                success: function (data) {
                }
            });
        }
        //getArticleList({});
    });

    function show(){
        var coll = $("#article div").length;
        var inter = $("#channel div").length;
        if(coll<=1) {
            $("#anoc").css("display", "block")
        }
        if(inter<=1) {
            $("#cnoc").css("display", "block")
        }
    }
    show();
});