/**
 * 滚动加载的组件
 * @namespace $(node).scrollLoad();
 * @author langtao
 * @date 2014-11-6
 */
;
(function() {
	var _instanceList = {}; //实例对象的列表

	/**
	 * 滚动加载
	 * @param  {object} selector select元素对象
	 * @param  {object} options 配置
	 */
	function _scrollLoad(targetNode, options) {
		this.targetNode = targetNode; //父元素对象
		
		this.options = $.extend({
			'toEndHeight' : 20, //距离底部触发的高度
			'scrollBottomCallback': function(){} //滚动到底部时的回调函数
		}, options || {});

		return this;
	}

	_scrollLoad.prototype = {
		/**
		 * 初始化
		 */
		init: function() {
			this.bindEvent();
		},

		/**
		 * 绑定元素事件
		 */
		bindEvent: function() {
			var me = this;

			$(me.targetNode).on('scroll.load', function() {
				var scrollTop = $(this).scrollTop(), //滚动条距离顶部的高度
					scrollHeight = this === window ? $(document).height() : this.scrollHeight, //总高度
					viewHeight = $(this).height(); //可视高度

				//距离顶部+当前高度 >=文档总高度 即代表滑动到底部
				if (scrollTop + viewHeight + me.options.toEndHeight >= scrollHeight) {
					if(typeof me.options.scrollBottomCallback === 'function'){
						me.options.scrollBottomCallback(me);
					}
				}
			});
		},

		/**
		 * 注销滚动事件
		 */
		cancelScrollEvent : function(){
			$(this.targetNode).off('.load');
		}
	};

	/**
	 * 获取随机数
	 * @return {int} 随机数
	 */
	function _getRandomKey() {
		return Math.round(Math.random() * 99999999);
	}

	$.fn.scrollLoad = function(options) {
		return this.each(function() {
			if (!_instanceList[$(this).attr('scrollLoad')]) {
				var instanceKey = _getRandomKey(),
					instance = new _scrollLoad(this, options);

				instance.init();
				_instanceList[instanceKey] = instance;
				$(this).attr('scrollLoad', instanceKey);
			}
		});
	};
})(jQuery);