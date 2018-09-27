/**
 * 遮罩层
 * @namespace CS.mask
 * @author langtao
 * @date  2014-4-22
 * 
 * 使用事例：
 * var mask = new CS.mask( $("***") );
 * mask.open();
 * mask.close();
 */
;
(function($){
	var _defaultConfig = {
		'opacity' : 0.5, //透明度
		'zIndex' : 1000000 //遮罩层级
	};
		
	var _maskCss = "maskUI", //遮罩层的css名称
		_win = $(window),
		_doc = $(document);

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
		if(!$el || $el.length === 0){
			return;
		}

		var scrollLeft = 0,
			scrollTop = 0;

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
		this.popup = popup || '<div>遮罩层</div>';
		config = config || {};
		this.config = $.extend({}, _defaultConfig, config);

		this.popupInfo = null; //浮层信息
		//遮罩层的集合
		this.layers = {
			"shadow": null, //阴影层
			"popup": null //浮层容器
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
			var position = 'fixed',
				zIndex = _defaultConfig.zIndex++;

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

			//放置浮层的容器
			this.layers.popup = $(this.popup);
			this.layers.popup
				.addClass(_maskCss)
				.css({
					"zIndex" : zIndex,
					"position" : position,
					"left" : 0,
					"top" : 0,
					"display" : "none"
				});
			
			//动态添加
			$.each(this.layers, function(index, $item){
				if($item){
					$(document.body).append($item);
				}
			});

			_setSize(this.layers.shadow);
			this.layers.shadow.css({'opacity': this.config.opacity}).show();

			this.layers.popup.show();
			
			//容器居中
			_center(this.layers.popup);

			var me = this;

			//window resize
			_win.on('resize.mask', function(){
				//容器居中
				_center(me.layers.popup);
				_setSize(me.layers.shadow);
			});
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
		 * 重新居中
		 * @param  {int} w 宽度
		 * @param  {int} h 高度
		 */
		center : function(){
			//容器居中
			_center(this.layers.popup);
		}
	};

})(jQuery);