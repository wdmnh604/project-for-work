var ARTICLE = (function(doc) {
    // 显示错误提示信息的方法
    var fnTips = function(content) {
        if (typeof content != 'string') {
            return;
        }
        var div = doc.createElement('div');
        div.className = 'article-tips';
        div.innerHTML = content;
        div.addEventListener('touchend', function() {
            doc.body.removeChild(div);
        });
        doc.body.appendChild(div);

        setTimeout(function() {
            if (div && doc.body.contains(div)) {
                doc.body.removeChild(div);
            }
        }, 2000);
    };

    var localMclient = function() {
        // 走客户端请求
        if (!window.mclient) {
            // 此处用来本地模拟测试
            mclient = {
                req: function(url, callbackName) {
                    var xhr = new XMLHttpRequest();         
                    xhr.open('get', url);
                    xhr.onload = function() {
                        window[callbackName] && window[callbackName](JSON.parse(xhr.response));
                    }
                    xhr.send();
                },
                post: function(url, callbackName, forceReload, content) {
                    // ajax request
                    var xhr = new XMLHttpRequest();     
                    xhr.open('post', url);            
                    xhr.onload = function() {
                        window[callbackName] && window[callbackName](JSON.parse(xhr.response));                  
                    }            
                    xhr.send(content);
                }
            };
        }
        if (!window.getTransparentParam) {
            getTransparentParam = function() {
                return '';
            }
        }
    };

    var u = navigator.userAgent;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端


    // 极简模板
    String.prototype.miniTemp = function(obj) {
        return this.replace(/{{(\w+)}}/gi, function(matchs, $1) {    
            return typeof obj[$1] != 'undefined'? obj[$1]: '';
        });
    };

    var DISABLED = 'disabled';

    return {
        el: {},
        tips: function(content) {
            fnTips(content);
        },
        queryForm: function(form) {
            if (!form) {
                return '';
            }
            // 发送数据使用字符串
            var arrFormData = [], objFormData = {};

            [].slice.call(form.elements).forEach(function(ele) {
                // 元素类型和状态
                var type = ele.type, disabled = ele.disabled;

                // 元素的键值
                var name = ele.name, value = encodeURIComponent(ele.value || 'on');

                // name参数必须，元素非disabled态，一些类型忽略
                if (!name || disabled || !type || (/^reset|submit|image$/i.test(type)) || (/^checkbox|radio$/i.test(type) && !ele.checked)) {
                    return;
                }

                type = type.toLowerCase();

                if (type != 'select-multiple') {
                    if (objFormData[name]) {
                        objFormData[name].push(value);
                    } else {
                        objFormData[name] = [value];
                    }
                } else {
                    [].slice.call(ele.querySelectorAll('option')).forEach(function(option) {
                        var optionValue = encodeURIComponent(option.value || 'on');
                        if (option.selected) {
                            if (objFormData[name]) {
                                objFormData[name].push(optionValue);
                            } else {
                                objFormData[name] = [optionValue];
                            }
                        }
                    });
                }                
            });

            for (var key in objFormData) {
                arrFormData.push(key + '=' + objFormData[key].join());
            }

            return arrFormData.join('&');
        },
        format: function() {
            var container = document.getElementById('artCont'), 
                eleTempName = document.getElementById('artNameTemp'),
                eleTempCover = document.getElementById('artCoverTemp');
            if ([].forEach && container && eleTempName && eleTempCover) {
                var htmlTempName = eleTempName.innerHTML, htmlTempCover = eleTempCover.innerHTML;

                // 书名处理
                [].slice.call(container.querySelectorAll('.base64Name')).forEach(function(ele) {
                    var title = ele.getAttribute('data-title'), id = ele.getAttribute('data-id');
                    if (title && id) {
                        // 插入转换的HTML代码
                        ele.insertAdjacentHTML('beforebegin', htmlTempName.miniTemp({
                            id: id,
                            title: title
                        }));
                        ele.parentNode.removeChild(ele);
                    }
                });
                // 封面处理
                [].slice.call(container.querySelectorAll('.base64Cover')).forEach(function(ele) {
                    var title = ele.getAttribute('data-title'), author = ele.getAttribute('data-author'), id = ele.getAttribute('data-id'), url = ele.style.backgroundImage;
                    if (title && author && id) {
                        // 获取图片地址
                        url = url.replace(/url\(['"]?|['"]?\)/g, '');

                        // 插入转换的HTML代码
                        ele.insertAdjacentHTML('beforebegin', htmlTempCover.miniTemp({
                            id: id,
                            url: url,
                            title: title,
                            author: author
                        }));
                        ele.parentNode.removeChild(ele);
                    }
                });
            }
            container.style.visibility = 'visible';
        },
        likeOrNot: function() {
            var eleCheck = doc.getElementById('checkZan'), eleLikeForm = doc.getElementById('likeForm');
            if (eleCheck && eleLikeForm) {
                eleCheck.addEventListener('click', function() {
                    submit();
                });

                var self = this;

                var submit = function() {
                    if (!window.callbackLike) {
                        callbackLike = function() {};
                    }

                    var url = eleLikeForm.action, query = self.queryForm(eleLikeForm);
                    if (/\?/.test(url)) {
                        url = url + '&' + query;
                    } else {
                        url = url + '?' + query;
                    }

                    // if (!window.mclient) {
                    //     localMclient();
                    // }

                    // 调用客户端请求方法
                    if (isAndroid) {
                        mclient[eleLikeForm.method || 'get'](url, 'callbackLike', 1, query);
                    } else if (isiOS && Local)  {
                        Local.reqaObj(url, callbackLike);
                    }                       
                };

                eleLikeForm.addEventListener('submit', function(event) {
                    event.preventDefault();

                    submit();
                });
            }
        },
        submit: function(success) {
            var self = this;
            var eleForm = self.el.form, eleLabel = self.el.label, eleSubmit = self.el.submit;

            // 表单原生验证去除
            eleForm.setAttribute('novalidate', 'novalidate');
            // 表单提交
            eleForm.addEventListener('submit', function(event) {
                event.preventDefault();

                var eleInput = self.el.input;

                if (eleInput) {
                    var value = eleInput.value, trimValue = value.trim();
                    if (value != trimValue) {
                        eleArea.value = trimValue;
                    }
                }                

                // 请求开始
                eleSubmit.setAttribute(DISABLED, DISABLED);
                if (eleLabel) {
                    eleLabel.innerHTML = '提交中...';
                }

                if (!window.callbackSubmit) {
                    callbackSubmit = function(json) {
                        eleSubmit.removeAttribute(DISABLED);
                        if (eleLabel) {
                            eleLabel.innerHTML = '提交';
                        }
                        if (json.status == true) {
                            fnTips('提交成功');

                            // 一些重置
                            eleForm.reset();
                            eleSubmit.setAttribute(DISABLED, DISABLED);

                            if (typeof success == 'function') {
                                success(json);
                            }
                        } else {
                            fnTips('提交失败，请重试');
                        }
                    };
                }

                // 调用客户端请求方法
                var url = eleForm.action, query = self.queryForm(eleForm);
                if (/\?/.test(url)) {
                    url = url + '&' + query;
                } else {
                    url = url + '?' + query;
                }

                // if (!window.mclient) {
                //     localMclient();
                // }

                if (isAndroid) {
                    mclient[eleForm.method || 'get'](url, 'callbackSubmit', 1, query);
                } else if (isiOS && Local)  {
                    Local.reqaObj(url, window.callbackSubmit);
                } 
            });
        },

        disabled: function(inputid) {
            var self = this;

            var input = doc.getElementById(inputid);
            // 文本域和按钮禁用态交互
            if (input) {
                var isRequired = typeof input.getAttribute('required') == 'string', maxlength = input.getAttribute('maxlength');
                input.addEventListener('input', function() {
                    var value = this.value.trim(), eleSubmit = self.el.submit;

                    if ((isRequired && value == '') || (maxlength && value.length > maxlength)) {
                        eleSubmit.setAttribute(DISABLED, DISABLED);
                    } else {
                        eleSubmit.removeAttribute(DISABLED);
                    }
                });
                self.el.input = input;
            }
        },

        mclient: localMclient,
        init: function(formid, callback) {
            // 元素们
            var self = this;

            var form = doc.getElementById(formid);
            if (!form) {
                return;
            }
            var submit = form.querySelector('input[type="submit"]'), label = form.querySelector('label[for="'+ submit.id +'"]');
            if (submit && label) {
                self.el.form = form;
                self.el.submit = submit;
                self.el.label = label;
                self.submit(callback);
            }
        }
    };
})(document);
