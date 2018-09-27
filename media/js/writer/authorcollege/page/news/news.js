/**
 * Created by liuwenzhong on 2016/8/30.
 */
$(document).ready(function() {
    function getArticleList(param){
        $.ajax({
            type: "POST",
            url: newslist,
            data: param,
            dataType: 'json',
            success: function(data){
                var html = $('script[type="text/template"]').html();
                var arr = [];
                if(data.info) {
                    $.each(data.info, function (i, o) {
                        arr.push(formatTemplate(html, o));
                    });
                    $('.article-box').append(arr.join(''));
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
        var param = {time:time};
        getArticleList(param);
    });
});