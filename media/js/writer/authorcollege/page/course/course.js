/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {
    function getArticleList(id,param){
        if(!param){
            $("#data").attr("value","");
        }
        var labels = [];
        $("#tagselected a").each(function(i,vo){
            labels[i] = $(this).text();
        });
//            alert(labels);
        param.labels = labels;

        var url = "";
        switch(id){
            case 'time':url=timelist ;break;
            case 'score':url= scorelist;break;
            case 'scan':url=scanlist;break;
            case 'collect':url=colllist;break;
        }
        if(url) {
            $.ajax({
                type: "POST",
                url: url,
                data: param,
                dataType: 'json',
                success: function(data){
                    var html = $('script[type="text/template"]').html();
                    var arr = [];
                    if(data.info) {
                        $.each(data.info, function (i, o) {
                            arr.push(formatTemplate(html, o));
                        });
                        if (data.page) {
                            $("#data").attr("page", data.page);
                        } else {
                            $("#data").attr("value", data.time);
                        }
//                        alert(page);
//                        alert(time);
                        if ($("#data").attr("append")) {
                            $('.article-box').append(arr.join(''));
                        } else {
                            $('.article-box').html(arr.join(''));
                        }
                    }
                    if(!data.info || data.info.length < 6){
                        $("[type='bottom']").replaceWith('<div type="bottom" class="nomore-bottom">没有更多了</div>');
                    }else{
                        $("[type='bottom']").replaceWith('<div id="more" type="bottom" class="more-bottom"><a style="cursor:pointer">加载更多</a></div>');
                    }
                },
                error: function(){
                }
            });
        }
    }

    $('.sec-ttl a').click(function() {
        $("#data").attr("append","");
        $(this).addClass("selected").siblings().removeClass("selected");
        var tab = $(this).attr("id");
        if(tab!='time'){
            $("#data").attr("value","");
        }
        getArticleList(tab,{});
    });

    $(".course-list").on("click", '#more a', function(){
        $("#data").attr("append","true");
        var tab = $(".sec-ttl .selected").attr("id");
//            alert(time);
        var param = {};
        var time = $("#data").attr("value");
        if(time){
            param.time = time;
        }else{
            var page = $("#data").attr("page");
            param.page = page;
        }
        getArticleList(tab,param);
    });

    $(".filter li a").click(function() {
        if($(this).parent().hasClass("checked")){
            return ;
        }
        var typeid = $(this).parent().attr("typeid");
        var type= $(this).parent().attr("type");
        if(typeid=="all"){
            $("#tagselected [type='"+type+"']").remove();
            $(this).parent().siblings().removeClass("checked");
        }else {
            $(".filter [typeid='all'][type='"+type+"']").removeClass("checked");
            $("#tagselected").append('<a type="' + $(this).parent().attr("type") + '"' +
                ' typeid="' + $(this).parent().attr("typeid") + '"' +
                ' href="#">' + $(this).text() + '<i class="ico-close"></i></a>')
        }
        $(this).parent().addClass("checked");
        $("#data").attr("append","");
        getArticleList($('.sec-ttl .selected').attr("id"),{});
    });

    $("#tagselected").on('click', '.ico-close', function(){
        $(this).parent().remove();
        var typeid = $(this).parent().attr("typeid");
        $(".filter [typeid='"+typeid+"']").removeClass("checked");

        $("#data").attr("append","");
        getArticleList($('.sec-ttl .selected').attr("id"),{});
    });
});