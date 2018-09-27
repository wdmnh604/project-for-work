/**
 * 环境变量的配置
 * @namespace CS.config.env
 * @lastUpdate 2015-9-16
 */
(function($) {
    //外部依赖
    var _util = CS.util;

    //环境变量列表
    var env = {};

    /**
     * 初始化
     */
    function _init() {
        _setEnv();
    }

    /**
     * 设置环境变量
     */
    function _setEnv() {
        var currentUrl = window.location.href,
            urlConfig = {
                //开发环境
                'dev': {
                    'siteUrl': 'http://dev.write.qq.com/',
                    'imgUrl': 'http://dev.img1.chuangshi.qq.com/writer/p1/new/'
                },
                //测试环境
                'uat': {
                    'siteUrl': 'http://uat.write.qq.com/',
                    'imgUrl': 'http://uat.img1.chuangshi.qq.com/writer/p1/new/'
                },
                //预发布和正式环境
                'release': {
                    'siteUrl': 'http://write.qq.com/',
                    'imgUrl': 'http://img1.chuangshi.qq.com/writer/p1/new/'
                }
            };

        //匹配服务器环境: dev or uat or release
        var envTypeMatchs = currentUrl.match(/^http:\/\/(\w+)\./),
            envType = (envTypeMatchs && envTypeMatchs.length > 1 && envTypeMatchs[1] in urlConfig) ? envTypeMatchs[1] : 'release';

        //将服务器环境对应的url赋值给env对象
        env = urlConfig[envType];
        env.envType = envType;
    }

    _init();

    _util.initNameSpace("CS.config");
    CS.config.env = env;
})(jQuery);