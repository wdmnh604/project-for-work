/**
 * 遮罩层
 * @namespace CS.mask
 * @author langtao
 * @date  2015-9-1
 * 
 * 使用事例：
 * var mask = new CS.mask( $("***") );
 * mask.open();
 * mask.close();
 */
;
(function($){
	var _util = CS.util;

	var _defaultConfig = {
		'opacity' : 0.5, //透明度
		'zIndex' : 1000000 //遮罩层级
	};
		
	var _maskCss = "maskUI", //遮罩层的css名称
		_win = $(window),
		_doc = $(document),
		_iframeSrc = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'; //iframe的地址

	/**
	 * 设置遮罩大小
	 */
	function _setSize($el){
		if($el){
			var docWidth = _doc.width(),
				docHeight = _doc.height();

			$el.width(docWidth).height(docHeight);
		}
	}

	/**
	 * 居中
	 * @param  jqueryObject $el jquery元素
	 */
	function _center($el) {
		var scrollLeft = 0,
			scrollTop = 0;

		if(_util.isIE6()){
			scrollLeft = _win.scrollLeft();
			scrollTop = _win.scrollTop();
		}

		$el.css({
			'left' : ( _win.width() - $el.width() ) / 2 + scrollLeft +'px',
			'top' : ( _win.height() - $el.height() ) / 2 + scrollTop +'px'
		});
	}

	CS.util.initNameSpace("CS");

	/**
	 * 遮罩层
	 * @param  @param  htmlString/domObject/jQueryObj   popup   要居中显示的浮层
	 * @param  @param  object config 配置  ( 可选，默认： {'opacity' : 0.5, 'zIndex' : 1000000} )
	 * @return {object}        组件的实例对象
	 */
	CS.mask = function(popup, config){
		this.popup = popup || '<h1>遮罩层</h1>';
		config = config || {};
		this.config = $.extend({}, _defaultConfig, config);

		this.popupInfo = null; //浮层信息
		//遮罩层的集合
		this.layers = {
			"iframe": null, //ie6用来垫底的iframe
			"shadow": null, //阴影层
			"container": null //浮层容器
		};
		
		if (config.zIndex) {
			_defaultConfig.zIndex = config.zIndex;
		}

		return this;
	};

	CS.mask.prototype = {
		/**
		 * 打开遮罩层
		 */
		open : function(){
			var position = _util.isIE6() ? 'absolute' : 'fixed',
				zIndex = _defaultConfig.zIndex++;

			if(_util.isIE6()){
				//遮挡select等元素的iframe
				this.layers.iframe = $('<iframe class="'+ _maskCss +'" style="background-color:#000; z-index:'+ (zIndex - 1) +'; position:absolute; top:0; left:0; background:transparent; border:none; margin:0; padding:0; display:none;" src="'+ _iframeSrc +'"></iframe>');
			}

			//阴影层
			this.layers.shadow = $("<div>");
			this.layers.shadow
				.addClass(_maskCss)
				.css({
					"zIndex" : (zIndex - 1),
					"position" : position,
					"left" : 0,
					"top" : 0,
					"backgroundColor" : "#000",
					"margin" : 0,
					"padding" : 0,
					"display" : "none"
				});

			//放置浮层的容器
			this.layers.container = $("<div>");
			this.layers.container
				.addClass(_maskCss)
				.css({
					"zIndex" : zIndex,
					"position" : position,
					"left" : 0,
					"top" : 0,
					"display" : "none"
				});

			if( typeof this.popup != 'string' && (this.popup.parentNode || this.popup.jquery) ){
				var node = this.popup.jquery ? this.popup[0] : this.popup;

				//记录浮层相关信息，为还原浮层做铺垫
				this.popupInfo = {
					'el' : node,
					'parent' : node.parentNode,
					'display' : node.style.display,
					'position' : node.style.position
				};
			}
			
			//动态添加
			$.each(this.layers, function(index, $item){
				if($item){
					$(document.body).append($item);
				}
			});

			this.layers.container.append(this.popup);

			//设置大小
			if(this.layers.iframe){
				_setSize(this.layers.iframe);
				this.layers.iframe.show();
			}

			_setSize(this.layers.shadow);
			this.layers.shadow.css({'opacity': this.config.opacity}).show();

			this.layers.container.show();
			
			if (this.popup.jquery || this.popup.nodeType){
				$(this.popup).show();
			}

			//移除焦点，防止回车自动触发按钮点击事件
			$(':focus').blur();

			//容器居中
			_center(this.layers.container);

			var me = this;

			//window resize
			_win.on('resize.mask', function(){
				//容器居中
				_center(me.layers.container);

				//设置遮罩大小
				if(me.layers.iframe){
					_setSize(me.layers.iframe);
				}
				_setSize(me.layers.shadow);
			});

			if(_util.isIE6()){
				//window scroll
				_win.on('scroll.mask', function(){
					//容器居中
					_center(me.layers.container);
				});
			}
		},

		/**
		 * 关闭遮罩层
		 */
		close : function(){
			//隐藏
			$.each(this.layers, function(index, $item){
				if($item){
					$item.hide();
				}
			});

			//还原浮层，并放置回原处
			if(this.popupInfo && this.popupInfo.el){
				this.popupInfo.el.style.display = this.popupInfo.display;
				this.popupInfo.el.style.position = this.popupInfo.position;
				if (this.popupInfo.parent){
					this.popupInfo.parent.appendChild(this.popupInfo.el);
				}
					
				this.popupInfo = null;
			}

			//移除
			$.each(this.layers, function(index, $item){
				if($item){
					$item.remove();
				}
			});

			_win.off('.mask');
		},

		/**
		 * 替换浮层
		 * @param  @param  htmlString/domObject/jQueryObj   popup   要居中显示的浮层
		 */
		replacePopup : function(popup){
			if(popup === this.popup){
				return;
			}
			if(!this.layers.container){
				return;
			}

			this.layers.container.hide();

			//还原浮层，并放置回原处
			if(this.popupInfo && this.popupInfo.el){
				this.popupInfo.el.style.display = this.popupInfo.display;
				this.popupInfo.el.style.position = this.popupInfo.position;
				if (this.popupInfo.parent){
					this.popupInfo.parent.appendChild(this.popupInfo.el);
				}
					
				this.popupInfo = null;
			}

			//设置新的浮层
			this.popup = popup;

			if( typeof this.popup != 'string' && (this.popup.parentNode || this.popup.jquery) ){
				var node = this.popup.jquery ? this.popup[0] : this.popup;

				//记录浮层相关信息，为还原浮层做铺垫
				this.popupInfo = {
					'el' : node,
					'parent' : node.parentNode,
					'display' : node.style.display,
					'position' : node.style.position
				};
			}

			this.layers.container.append(this.popup).show();
			if (this.popup.jquery || this.popup.nodeType){
				$(this.popup).show();
			}
			//容器居中
			_center(this.layers.container);
		},

		/**
		 * 重新居中
		 * @param  {int} w 宽度
		 * @param  {int} h 高度
		 */
		center : function(){
			//容器居中
			_center(this.layers.container);
		}
	};

})(jQuery);