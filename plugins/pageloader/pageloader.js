(function($, global, undefined) {

    var HISTORY = [];

    function Pageloader(options) {
        var that = this;

        if (options.container) {
            this.$container = $(options.container);
        }

        $(window).on('hashchange', function() {

            var hash = (location.hash||'').replace(/^#/, '');

            if (hash !== that.current.toString()) {
                that.go(parseInt(hash||'0'));
            }
        });

        this.current = 0;
    }

    Pageloader.prototype = {

        /**
         * 加载页面并保持历史记录
         * @param  {[type]} url    [description]
         * @param  {[type]} params [description]
         * @return {[type]}        [description]
         */
        load: function(url, params) {
            var curr = HISTORY[this.current];

            if (typeof url === 'object' && url.constructor === Object) {
                params = url;
                url = false;
            }

            HISTORY.push({
                url: url || curr.url,
                params: params
            });

            this.current = HISTORY.length-1;

            this.redirect(url || curr.url);
        },

        /**
         * 重新加载页面
         */
        reload: function() {
            this.redirect(HISTORY[this.current]);
        },

        /**
         * 重新加载页面
         * @alias reload
         */
        refresh: function() {
            this.reload();
        },

        /**
         * 替换当前页面URL和Params
         * @param  {[type]} url    [description]
         * @param  {[type]} params [description]
         * @return {[type]}        [description]
         */
        replace: function(url, params) {
            var curr = HISTORY[this.current];

            HISTORY[this.current] = {
                url: url || curr.url,
                params: params || curr.params
            };

            this.redirect(url || curr.url);
        },

        /**
         * [pushStage description]
         * @param  {[type]} url    [description]
         * @param  {[type]} params [description]
         * @return {[type]}        [description]
         */
        pushStage: function(url, params) {
            HISTORY.push({
                url: url,
                params: params
            });

            this.current = this.current + 1;
        },

        /**
         * 后退一页
         */
        back: function() {
            this.current = Math.max(0, this.current-1);
            this.reload();
        },

        /**
         * 向前一页
         */
        forward: function() {
            this.current = Math.min(HISTORY.length-1, this.current+1);
            this.reload();
        },

        /**
         * 跳到某一页
         * @param {Number} 历史记录索引值
         */
        go: function(index) {
            if (typeof index === 'number') {
                var i = Math.max(0, Math.min(HISTORY.length-1, index));
                this.current = i;
                this.redirect(HISTORY[index]);
            }
        },

        /**
         * 获取当前页面URL
         * @return {String} URL
         */
        getUrl: function() {
            return HISTORY[this.current].url;
        },

        /**
         * 获取当前页面携带的参数
         * @return {String} URL
         */
        getParams: function() {
            var record = HISTORY[this.current] || {};
            var params = record.params || {};
            var queries = (record.url||'').split('?').map(function(o, i) {
                    if (i===1) {
                        var obj = {};
                        o.split('&').forEach(function(p) {
                            var arr = p.split('=');
                            obj[arr[0]] = arr[1];
                        });
                        return obj;
                    }
                })[1] || {};


            var hrefQueryStr = (document.location.search||'').replace(/^\?/, '');
            var hrefQueries = (function() {
                var obj = {};
                hrefQueryStr.split('&').forEach(function(p) {
                    var arr = p.split('=');
                    obj[arr[0]] = arr[1];
                });
                return obj;
            }());
            return $.extend(hrefQueries, queries, params);
        },

        /**
         * 获取历史记录值
         * @return {Array} 历史记录列表
         */
        getHistory: function() {
            return HISTORY.concat([]);
        },

        /**
         * 加载页面内容
         * @param  {Object} record 历史记录中的一条数据
         */
        redirect: function(record) {
            if (record && record.url) {
                this.$container.load(record.url);
            } else if(typeof record === 'string' && record) {
                this.$container.load(record);
            }

            location.hash = this.current;
        }
    }

    global.pageLoader = $.pageLoader = new Pageloader({
        container: '.content-wrapper'
    });

}(jQuery, this));