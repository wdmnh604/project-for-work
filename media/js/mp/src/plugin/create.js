	
	$(".area01").focus();
	
	/*输入标题，输入简介框高度自适应*/
	$(".article-title textarea,.short-des textarea").on("input propertychange", function (e) {
	   var target = e.target;
	   // 保存初始高度，之后需要重新设置一下初始高度，避免只能增高不能减低。           
		var dh = $(target).attr('defaultHeight') || 0;
		if (!dh) {
			dh = target.clientHeight;
			$(target).attr('defaultHeight', dh);
		}

		target.style.height = dh +'px';
		var clientHeight = target.clientHeight;
		var scrollHeight = target.scrollHeight;
		if (clientHeight !== scrollHeight) { target.style.height = scrollHeight + "px";}
	});
	
	//吸顶
	$(window).scroll(function(){
		
		if( $(document).scrollTop() >= $(".short-des").offset().top )
		{
			$(".mce-toolbar-grp").addClass("toolbar-fixed");
			$(".conts-hd").addClass("hd-fixed");
		} else {
			$(".mce-toolbar-grp").removeClass("toolbar-fixed");
			$(".conts-hd").removeClass("hd-fixed");
		}
	});

	//图文编辑
	tinymce.init({
		selector: ".content-area",
		theme: "modern",
		resize: false,
		//content_css: "css/development.css",
		add_unload_trigger: false,
		plugins: [
			"advlist autolink autosave link image lists charmap print preview hr anchor pagebreak spellchecker",
			"searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
			"table contextmenu directionality emoticons template textcolor paste fullpage textcolor colorpicker textpattern"
		],
		toolbar: "bold underline italic h | blockquote  hr numlist bullist | myimage myvideo mylink myvote mybook",
		
		setup: function (editor) {
			editor.addButton('h', {
			  text: '',
			  icon: false,
			  tooltip: '标题',
			  onclick: function () {
				//$(".editor-input-file").click();
			  }
			});
			
			//插入图片
			editor.addButton('myimage', {
			  text: '',
			  icon: false,
			  tooltip: '插入图片',
			  onclick: function () {
				$(".editor-input-file").click();
			  }
			});
			
			//插入视频
			editor.addButton('myvideo', {
			  text: '',
			  icon: false,
			  tooltip: '插入视频',
			  onclick: function () {
				showpopup('dialog-video');
			  }
			});
			editor.addButton('mylink', {
			  text: '',
			  icon: false,			  
			  tooltip: '插入链接',
			  onclick: function () {
				showpopup('dialog-link');
			  }
			});
			editor.addButton('myvote', {
			  text: '',
			  icon: false,
			  tooltip: '插入投票',
			  onclick: function () {
				showpopup('dialog-vote');
			  }
			});
			editor.addButton('mybook', {
			  text: '',
			  icon: false,
			  tooltip: '插入书籍',
			  onclick: function () {
				showpopup('dialog-book');
			  }
			});
			
			var iframeHeightSame = function() {
				if (!window.tinymce) {
					return;
				}
				var iframe = $("#elm1_ifr");
				// tinymce会变化，可能
				if ($(tinymce).is('body')) {
					iframe.css('height', $(tinymce).height() + 40);
				} else if (tinymce.editors && tinymce.editors.length) {
					iframe.css('height', tinymce.editors[0].$('body')[0].clientHeight + 40);
				}
			};
			
			editor.on('change', iframeHeightSame);
			editor.on('load', function() {
				setTimeout(iframeHeightSame, 100);
			});
		 }
		
	});
	
	//开关
	$(".dialog-tip .btn").click(function(){
		$(this).toggleClass("open");
		$(".dialog-tip .datepicker").toggleClass("open");
	})
	//定时发布
	$( "#datepicker" ).datepicker( $.datepicker.regional[ "zh-TW" ]);
	
	//时间选择器
	$( "#timepicker" ).timepicker( );
		
	//腾讯视频
	function palyVideo(){
		//腾讯视频有两种地址格式
		//http://v.qq.com/x/cover/pcqohvp9x59e33j.html?vid=s03247apejz
		//http://v.qq.com/x/cover/pcqohvp9x59e33j/t0021cbk2kz.html
		var str = $(".input-address").val(); //取得整个输入框地址栏 
		var arr = str.split("/"); //各个参数放到数组里
		var i = arr.length - 1;
		var arr2 = arr[i].split('=')[1]; //获取地址有?=vid后的地址
		var arr3 = arr[i].split(".")[0]; //去最后"/.html"
		if ( arr2 ){
			var src = arr2;
		} else {
			var src = arr3;
		}
		
		//定义视频对象
		var video = new tvp.VideoInfo();
		//向视频对象传入视频vid
		video.setVid(src);
		//定义播放器对象
		var player = new tvp.Player(398, 268);
		//设置播放器初始化时加载的视频
		player.setCurVideo(video);
		//设置精简皮肤，仅点播有效
		player.addParam("flashskin", "http://imgcache.qq.com/minivideo_v1/vd/res/skins/TencentPlayerMiniSkin.swf");
		//输出播放器,参数就是上面div的id，希望输出到哪个HTML元素里，就写哪个元素的id
		player.addParam("autoplay","1");
		player.addParam("wmode","transparent");
		player.addParam("pic","http://img1.gtimg.com/ent/pics/hv1/75/182/1238/80547435.jpg");
		player.write("myvideo");
		$(".dialog-video .preview-box .video-box .text").hide();
	};
	
	$(".input-address").blur(function(){
		
		//输入框失去焦点，初始化视频预览
		palyVideo();
	});
	
	
	//插入图书，autocomplete
	/*var availableTags = [
      "ActionScript",
      "AppleScript",
      "Asp",
      "BASIC",
      "C",
      "C++"
    ];
	 $( "#input-book" ).autocomplete({
      source: availableTags
    });*/
	
	//新建投票tab切换
	$(".dialog-vote .tab-ttl li:eq(0)").click(function(){
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
		$(".new-vote").show();
		$(".already-vote").hide();
	})
	$(".dialog-vote .tab-ttl li:eq(1)").click(function(){
		$(this).addClass("active");
		$(this).siblings().removeClass("active");
		$(".new-vote").hide();
		$(".already-vote").show();
	})
	
	//新建投票收起按钮
	$(".dialog-vote .fold").click(function(){
		$(this).parent(".ttl-box").siblings(".question-cont").toggle();
		$(this).toggleClass("on");
	})
	
	//新建投票弹层时间选择
	$( "#datepicker02" ).datepicker( $.datepicker.regional[ "zh-TW" ]);
	$( "#timepicker02" ).timepicker({
		className: "timepicker02"
	});
	
	$(".content .tip-text").click(function(){
		$(this).remove();
	});
	
	//今天还可以发消息提示
	$(".button-creat .btn-true").hover(function(){
		$(".tool-tip").show();
	},function(){
		$(".tool-tip").hide();
	})