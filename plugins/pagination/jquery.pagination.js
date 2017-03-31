(function(global, $, undefined) {

    function Pagination() {
        this.init.apply(this, Array.prototype.slice.call(arguments, 0));

        this.render();
        this.bindClick();
    }

    Pagination.prototype = {

        /**
         * 初始化
         */
        init: function(options) {
            this.options = options;

            options.pageSize    = parseInt(options.pageSize);
            options.currentPage = parseInt(options.currentPage);
            options.totalNum    = parseInt(options.totalNum);
            options.pageCount   = Math.ceil(options.totalNum / options.pageSize);
            options.currentPage = Math.max(1, Math.min(options.pageCount, options.currentPage));
            options.prevPage    = Math.max(1, options.currentPage-1);
            options.nextPage    = Math.min(options.pageCount, options.currentPage+1);
            options.limit1      = (options.currentPage-1) * options.pageSize + 1;
            options.limit2      = Math.min(options.totalNum, (options.limit1 + options.pageSize - 1));
            options.statusContainer = $(options.statusContainer);
            options.status      = options.textStatus.replace(/\$\{\s*limit1\s*\}/g, Math.max(1, options.limit1))
                                                .replace(/\$\{\s*limit2\s*\}/g, options.limit2)
                                                .replace(/\$\{\s*total\s*\}/g, options.totalNum);
        },

        /**
         * 重置选项
         * @param  {Object} options 参数
         */
        reset: function(options) {
            var oldCurrPage = this.options.currentPage;
            var conf = $.extend({}, this.options, options);

            this.init(conf);

            // 触发pageChange事件
            if (oldCurrPage !== this.options.currentPage && $.isFunction(this.options.onPageChange)) {
                this.options.onPageChange(this.options.currentPage, oldCurrPage);
            }

            this.render();
        },

        /**
         * 页面跳转
         * @param  {Number} page 页面
         */
        goto: function(page) {
            this.reset({
                currentPage: page
            });
        },

        /**
         * 重置每页显示的数量
         * @param  {Number} pageSize
         */
        pageSize: function(pageSize) {
            this.reset({
                pageSize: pageSize
            });
        },

        /**
         * 重置总记录数
         * @param  {Number} totalNum
         */
        totalNum: function(totalNum) { this.total(totalNum); },
        total: function(totalNum) {
            this.reset({
                totalNum: totalNum
            });
        },

        /**
         * 重置当前页码
         * @alias goto
         * @param  {Number} page 页面
         * @return {Number} page 返回当前页码（如果没有传参数的话）
         */
        currentPage: function(page) {
            if (page) {
                this.goto(page);
            } else {
                return this.options.currentPage;
            }
        },

        getOptions: function(optKey) {
            var options = this.options;
            if (optKey) {
                return options[optKey];
            } else {
                return {
                    currentPage: options.currentPage,
                    pageSize: options.pageSize,
                    totalNum: options.totalNum,
                    pageCount: options.pageCount
                }
            }
        },

        /**
         * 委托点击事件
         */
        bindClick: function() {
            var that = this;
            this.options.container.on('click', 'li.pgBtn>a', function(event) {
                event.preventDefault();

                var pageNum = parseInt($(this).attr('page'));
                that.goto(pageNum);
            });
        },

        /**
         * 渲染分页条
         */
        render: function() {

            var options = this.options;

            this.buildList();

            if (options.statusContainer && options.statusContainer.size() > 0) {
                options.statusContainer.html(options.status);
            }

            var template = '<ul class="pagination">'+ this.options.list +'</ul>';

            this.options.container.html(template);
        },

        /**
         * 创建页码
         * @return {String} 页码的HTML片段
         */
        buildList: function() {
            var options = this.options;
            var pageOffset = 3;
            var start = Math.max(2, options.currentPage - pageOffset);
            var end = Math.min(options.pageCount-1, options.currentPage + pageOffset);
            var list = [];
            var active;

            // 前一页
            if (options.prevPage < options.currentPage) {
                list.push('<li class="pgBtn previous"><a href="#" page="'+ options.prevPage +'">'+ options.textPrev +'</a></li>');
            } else {
                list.push('<li class="pgBtn previous disabled"><span>'+ options.textPrev +'</span></li>');
            }

            // 第一页
            active = (options.currentPage === 1) ? ' active ' : '';
            list.push('<li class="pgBtn'+ active +'"><a href="#" page="1">1</a></li>');

            // 省略号
            if ( start > 2){// (options.currentPage - options.prevPage) > 1) {
                list.push('<li class="disabled"><span>...</span></li>');
            }

            for (var i = start; i<=end; i++) {
                active = (i === options.currentPage) ? ' active ' : '';
                list.push('<li class="pgBtn'+ active +'"><a href="#" page="'+ i +'">'+ i +'</a></li>');
            }

            // 省略号
            // if ( (options.nextPage - options.currentPage) > 1) {
            if ( end < options.pageCount-1) {
                list.push('<li class="disabled"><span>...</span></li>');
            }

            // 最后一页
            if (options.pageCount > 1) {
                active = (options.currentPage === options.pageCount) ? ' active ' : '';
                list.push('<li class="pgBtn'+ active +'"><a href="#" page="'+ options.pageCount +'">'+ options.pageCount +'</a></li>');
            }

            // 后一页
            if (options.nextPage > options.currentPage) {
                list.push('<li class="pgBtn next"><a href="#" page="'+ options.nextPage +'">'+ options.textNext +'</a></li>');
            } else {
                list.push('<li class="pgBtn next disabled"><span>'+ options.textNext +'</span></li>');
            }

            options.list = list.join('\n');
        }
    }

    // 组件
    $.fn.pagination = function(config) {
        var ARGS = arguments;

        if (typeof config === 'string') {
            var pg = $(this).data('pagination');
            var args = Array.prototype.slice.call(ARGS, 1);

            if (pg && typeof pg[config] === 'function') {
                return pg[config].apply(pg, args);
            }
        } else {
            return this.each(function() {

                var options = $.extend({}, $.fn.pagination.defaults, config, {container: $(this)});
                var instance = new Pagination(options);

                $(this).data('pagination', instance);
            });
        }
    };

    // 默认配置对象
    $.fn.pagination.defaults = {
          "pageSize": 10,
          "currentPage": 1,
          "totalNum": 32,
          "onPageChange": function(page) {},
          "textPrev": "上一页",
          "textNext": "下一页",
          "textStatus": "当前显示第 ${limit1} 至 ${limit2} 条，共 ${total} 条数据。",
          "statusContainer": ''
    };

}(this, jQuery));