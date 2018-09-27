/* path为表情库图片存放位置 */
$.emojiarea.path = 'http://dev.img1.write.qq.com/mp/p1/src/face/';

/* 表情库编码对应图片配置 */
$.emojiarea.icons = {
	':alien:'     : 'alien.png',
	':angry:'     : 'angry.png',
	':blush:'     : 'blush.png',
	':clap:'      : 'clap.png',
	':flushed:'   : 'flushed.png',
	':heart:'     : 'heart.png',
	':kissing_closed_eyes:'     : 'kissing_closed_eyes.png',
	':laughing:'  : 'laughing.png',
	':neckbeard:' : 'neckbeard.png',
	':smile:'     : 'smile.png',
	':smirk:'     : 'smirk.png',
	':sob:'     : 'sob.png',
	':stuck_out_tongue_winking_eye:'     : 'stuck_out_tongue_winking_eye.png',
	':sunglasses:'     : 'sunglasses.png',
	':sweat_smile:'    : 'sweat_smile.png',
};

/* 初始化表情库 */
var $wysiwyg = $('.emojis-wysiwyg').emojiarea({
	wysiwyg: true
});

$(".emoji-button").html("添加表情");