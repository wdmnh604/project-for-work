/**
 * Created by liuwentao on 16/5/24.
 */

var shareBtn = document.getElementById('share-btn');
var sharePop = document.getElementById('share-pop');
//点击分享按钮 显示 share 遮罩
shareBtn.addEventListener('click',function(e){
    sharePop.style.display = 'block';
},false);
//点击share遮罩 隐藏 share遮罩
sharePop.addEventListener('click',function(e){
    sharePop.style.display = 'none';
},false);

var isWeixin = navigator.userAgent.toLowerCase().match(/micromessenger/i) == "micromessenger";
var jiathisBtn = document.getElementById('jiathidBtn');
if (isWeixin){
    jiathisBtn.style.display = 'none';
}else{
    jiathisBtn.style.display = 'block';
    sharePop.style.display = 'none';
}   
