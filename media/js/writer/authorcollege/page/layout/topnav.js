/**
 * Created by liuwenzhong on 2016/9/5.
 */
function formatTemplate(str, conf) {
    return ("" + str).replace(/\$(\w+)\$/g, function(a, b) {
        return typeof conf[b] != "undefined" ? conf[b] : " ";
    });
}

$(document).ready(function() {
    $.ajax({
        type: "POST",
        url: authorurl,
        data: "",
        dataType: 'json',
        success: function(data){
            if(data['code']==1){
                var info = data['info'];
                var portrait = info.portrait;
                if(!portrait){
                    portrait = url+'/contentv2/dafult_photo.png';
                }
                $('.portrait').attr('src',portrait);
                $('.authorname').text(info.authorname);
                $('.authorscore').text('积分:' + info.score/100);
                $(".yeslogin").css('display','block');
                $("#authorid").attr("value",data.loginid);

                $('.authorlevel').text("Lv"+info.grade);
                $('.authorhonor').text(info.rank);
                $(".yeslogin-box").css("display","block");
                $(".nologin-box").css("display","none");
            }else{
                $(".nologin-box").css('display', 'block');
                if($(".nologin-box").length ==0) {
                    $(".nologin").css('display', 'block');
                }
                $(".yeslogin-box").css("display","none");
            }
        },
        error: function(){
            $(".nologin-box").css('display', 'block');
            if($(".nologin-box").length ==0) {
                $(".nologin").css('display', 'block');
            }
            $(".yeslogin-box").css("display","none");
        }
    });

    //$('.input-search').bind('keypress', function (event) {
    //    window.location.href="{:U('College/Search/index')}?key=" + $('.input-search').val();
    //});
});