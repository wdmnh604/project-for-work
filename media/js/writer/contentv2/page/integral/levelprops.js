/**
 * 积分商城（积分兑换,保级道具）
 * @create xiechao
 * @namespace CS.page.integral.levelprops
 * @createtime 2016-8-23
 */
(function ($) {
    //外部依赖
    var _util = CS.util,
            _uiBinder = CS.uiBinder,
            _mask = CS.mask,
            _dialog = CS.dialog;

    var _params = {}, //参数集合
            _nodes = {}, //页面元素的对象集合
            isRequesting = 0, //是否正在发起请求
            _maskByPopup = null; //浮层的遮罩层组建的实例对象

    var _ajaxUrls = {
        //保级道具
        'checkExchange': "/Contentv2/IntegralExchange/checkExchange.html", //验证兑换资格
        'exchangeScorePro' : "/Contentv2/IntegralExchange/exchangeScorePro.html" //兑换保级道具
    };
    //等级列表的模板
    var _levelListTpl = [
        '<%each list as item index%>',
        '<option value="<%=item.id%>"><%=item.levelName%></option>',
        '<%/each%>'
    ].join('');

    var scoreEnum = {
        'LV2score': 2000,
        'LV3score': 4000,
    }

    var nextstep = "<a data-node=\"nextStepBtn\" class=\"button full\" href=\"javascript:\">下一步</a>",
            scoredef = "<a data-node=\"lackIntegral\" class=\"button gray full\" href=\"javascript:\">积分不足</a>";

    /**
     * 初始化
     */
    function init() {
        //选择兑换道具
        _nodes.$conlevelpro = $('#conlevelpro');
        //兑换保级道具第二步
        _nodes.$conlevelprostep2 = $('#conlevelprostep2');
        //兑换保级道具第三步
        _nodes.$conlevelprostep3 = $('#conlevelprostep3');
        bindEvent();
    }

    function bindEvent() {
        $('#levelprop').click(function () {
            checkQualification();
            return false;
        });
    }

    function checkQualification() {
        if (isRequesting) {
            return;
        }
        isRequesting = 1;

        _util.request({
            url: _ajaxUrls.checkExchange,
            type: 'get',
            dataType: 'json',
            data: {},
            success: function (json) {
                if (!json) {
                    _dialog.alert('返回数据格式异常，请稍后再试');
                    return;
                }
                //不满足兑换条件
                if (json.status == false) {
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                    return;
                }
                //满足兑换条件
                if (json.status && json.data) {
                    showConTpl(json.info, json.data);
                }
            },
            error: function () {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete: function () {
                isRequesting = 0;
            }
        });
    }

    /*
     * levelList 可兑换道具列表
     * userscore 用户现有可使用积分
     */
    function showConTpl(levelList, userscore) {
        if (!levelList)
            return false;
        var tpl = _uiBinder.bindData(_levelListTpl, {'list': levelList});
        _nodes.$conlevelpro.find('[data-node="levelSelect"]').html(tpl);
        $('select').comboSelect();
        //下一步按钮
        _nodes.$conlevelpro.find('[data-node="nextStepBtn"]').off('click').on('click', function () {
            //正在提交状态中
            if (_util.checkBtnIsLoading($(this))) {
                return false;
            }
            var levid = _nodes.$conlevelpro.find('[data-node="levelSelect"]').val();
            _openPopup(_nodes.$conlevelprostep2);
            _nodes.$conlevelprostep2.find('[data-node="cur_score"]').text(userscore.score);
            //levid=2 2级保级道具(2000积分) levid=3 3级保级道具（4000积分）
            var score;
            var flag;
            if (levid == 2) {
                score = scoreEnum.LV2score;
                //判断积分是否充足
                flag = judgeScore(_nodes.$conlevelprostep2, userscore.score, score);
                _nodes.$conlevelprostep2.find('[data-node="use_score"]').text(score);
            } else {
                score = scoreEnum.LV3score;
                flag = judgeScore(_nodes.$conlevelprostep2, userscore.score, score);
                _nodes.$conlevelprostep2.find('[data-node="use_score"]').text(score);
            }
            if(!flag) _nodes.$conlevelprostep2.find('[data-node="use_score"]').text(score);
            _nodes.$conlevelprostep2.find('[data-node="nextStepBtn"]').off('click').on('click', function () {
                _nodes.$conlevelprostep3.find('[data-node="submitBtn"]').off('click').on('click', function () {
                    //确定兑换
                    sureExchange($(this),levid, score);
                });
                _openPopup(_nodes.$conlevelprostep3);
            });
            return false;
        });
        _openPopup(_nodes.$conlevelpro);
    }

    /*
     * $btn  jq按钮对象
     * @param {type} type  兑换类型
     * @param {type} score 兑换积分
     */
    function sureExchange($btn,type, score) {
        if (isRequesting) {
            return;
        }
        isRequesting = 1;

        var requestData = {
            'type': type,
            'score':score
        };
        _util.updateBtnText($btn, 'loading');
        _util.request({
            url: _ajaxUrls.exchangeScorePro,
            type: 'post',
            dataType: 'json',
            data: requestData,
            success: function (json) {

                if (!json) {
                    _dialog.alert('返回数据格式异常，请稍后再试');
                    return;
                }

                if (json.status) {
                    _closePopup();
                    //_dialog.alert(json.info || '兑换成功');
                    _dialog.alert('保级道具兑换成功，您的作家等级已被重置。',function(){
                        location.href = location.href;
                    });
                    
                } else {
                    _dialog.alert(json.info || '操作失败，请稍后再试');
                }
            },
            error: function () {
                _dialog.alert('操作失败，请稍后再试');
            },
            complete: function () {
                isRequesting = 0;
                _util.updateBtnText($btn, 'default');
            }
        });
    }

    /**
     * 打开浮层
     * @param  {object} $popup 浮层元素的jquery对象
     */
    function _openPopup($popup) {
        if (!$popup || $popup.length === 0) {
            return;
        }

        if (!_maskByPopup) {
            _maskByPopup = new _mask($popup);
            _maskByPopup.open();
        }

        if (_maskByPopup) {
            //替换浮层
            _maskByPopup.replacePopup($popup);

            $popup.find('[data-node="closeBtn"]').off('click').on('click', function () {
                _closePopup();
                return false;
            });
        }
    }

    /*
     * @param {type} $htmlId 
     * @param {type} curscore 当前积分
     * @param {type} consumption 需要消耗的积分
     */
    function judgeScore($htmlId, curscore, consumption) {
        $htmlId.find('[data-node="nextStepBtn"]').remove();
        $htmlId.find('[data-node="lackIntegral"]').remove();
        $htmlId.find('[data-node="use_score"]').removeClass('red');
        if (curscore < consumption) {
            $htmlId.find('[data-node="use_score"]').addClass('red');
            $htmlId.find('[class="confirmBtn"]').append(scoredef);
            return false;
        }
        $htmlId.find('[class="confirmBtn"]').append(nextstep);
        return true;

    }

    /**
     * 关闭浮层
     */
    function _closePopup() {
        if (_maskByPopup) {
            _maskByPopup.close();
            _maskByPopup = null;
        }
    }

    _util.initNameSpace("CS.page.integral");
    CS.page.integral.levelprops = {
        'init': init
    };
})(jQuery);