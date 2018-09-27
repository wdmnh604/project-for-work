/**
 * @fileOverview
 * @author zhangxinxu
 * @version 1
 * Created: 16-07-20 下午6:12
 * @description 继承和约束书写，与UI组件本身并无多大关系，而且是仿照LBF之前的命名和结构，
 */

define(function(require, exports, module) {
    //require('plugin/jquery');

    if (!Object.create) {
        Object.create = function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    var Node = function(obj) {
        if (obj && typeof obj == 'object') {
            for (var key in obj) {
                this[key] = obj[key];
            }
        }
        this.render();
    };

    Node.inherit = function(obj) {
        if (obj && typeof obj == 'object') {
            Node.prototype = Object.create(Node.prototype);

            for (var key in obj) {
                Node.prototype[key] = obj[key];
            }
        }
        return Node;
    },

    Node.prototype = {
        /**
         * Default UI proxy Element
         * @example
            container: 'body'
         */
        container: 'body',

        /**
         * Default UI events
         * @property events
         * @type Object
         * @protected
         * @example
            events: {
                'click #load-more': 'moreRankList',
                'click #btn-filter-search': 'btnFilterSearch',
                '#survey-btn"click': 'openSurvey',
                '#close-survey:click': function() {}
            }
         */
        events: {},

        /**
         * Nodes default UI element，this.$element
         * @property elements
         * @type Object
         * @protected
         * @example 
            elements: {
                'btnRankMore': '#btn-more',
                'rankListRow': '#rank-list-row'
            }
            elements: {
                btn: {
                    btn1: '#ccc',
                    btns: '.xxx'
                }
            }
         */
        elements: {},

        /**
         * Render node
         * Most node needs overwritten this method for own logic
         * @method render
         * @chainable
         */
        render: function () {
            // 事件处理以及元素暴露
            this.setElement();

            // 页面逻辑入口
            this.init();

            // 返回组件
            return this;
        },

        /**
         * 事件处理以及元素暴露
         * @method setElement
         * @chainable
         */
        setElement: function() {
            // 使用self压缩体积小
            var self = this;

            // 1. 全局委托元素
            var el = self.container;
            if (typeof self.container == 'string') {
                el = $(self.container)
            }

            // 1. 获取元素
            var elements = self.elements;
            // 深度递归
            var _set = function(host, obj) {
                $.each(obj, function(key, value) {
                    if (typeof value == 'string') {
                        // 字符串认为是选择器
                        host[key] = $(value);
                    } else if ($.isPlainObject(value)) {
                        // 如果是对象，则使用更深一层层级
                        if (!host[key] || typeof host[key] != 'object') {
                            host[key] = {};
                        }
                        _set(host[key], value);
                    }
                });
            };
            _set(self, elements);


            // 2. 事件委托处理
            var events = self.events;

            if (el.length) {
                $.each(events, function(eventType_selector, funName) {
                    var arr = [], eventType = '', selector = '';
                    // 支持
                    // "a.btn:click": fun1 这种书写
                    // 推荐第一种
                    var reg = /:[a-zA-Z]+$/;
                    if (reg.test(eventType_selector)) {
                        arr = eventType_selector.split(reg);
                        selector = $.trim(arr[0]);
                        eventType = eventType_selector.split(':').slice(-1).join('');
                    } else {
                        // 也支持
                        // 'click a.btn': fun1 这种书写
                        // 此方法为了兼容LBF中的习惯
                        arr = eventType_selector.split(/\s+?/);
                        eventType = arr[0],
                        selector = $.trim(eventType_selector.replace(eventType, '')) || '';
                    }

                    // 事件委托走起
                    el.delegate(selector, eventType, {
                        el: el,
                        selector: selector
                    }, function(events) {
                        if ($.isFunction(funName)) {
                            // 作为普通的jQuery事件处理
                            funName.call(this, events);
                        } else if ($.isFunction(self[funName])) {
                            events.el = $(this);
                            // 修改上下文
                            // 点击元素放在events对象中
                            self[funName].call(self, events);
                        }
                    });
                });
            }

            return this;
        },
        init: function() {}
    };

    module.exports = Node;
});
