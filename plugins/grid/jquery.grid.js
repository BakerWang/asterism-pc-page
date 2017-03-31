(function(global, $, undefined) {

    function Grid() {
        this.init.apply(this, Array.prototype.slice.call(arguments, 0));

    }

    Grid.prototype = {

        /**
         * 初始化
         */
        init: function(options) {
            this.options = options;
            this.insertLayout();
            this.loadData();
            this.initPagination();
            this.bindEvents();
        },

        /**
         * 初始化分页条
         * @return {[type]} [description]
         */
        initPagination: function() {
            var that = this;
            var opt = this.options.pagination;

            opt.statusContainer = this.options.container.find('.dataTables_info');
            opt.onPageChange = function(page) {
                opt.currentPage = page;
                that.loadData();
            };

            this.options.$pagination.pagination(opt);
        },

        /**
         * 在页面的指定位置插入Grid布局
         * @return {[type]} [description]
         */
        insertLayout: function() {
            var options = this.options;
            var container = options.container;
            var cssClass = [];

            if (options.hover || options.highlight) {
                cssClass.push('table-hover');
            }

            if (options.zebra) {
                cssClass.push('table-striped');
            }

            var template = '<div class="grid box">\
                                <div class="box-header">\
                                    <h3 class="box-title">'+ (options.title || '') +'</h3>\
                                </div>\
                                <div class="box-body">\
                                    <div class="dataTables_wrapper form-inline dt-bootstrap">\
                                        <div class="row">\
                                            <div class="col-sm-6 gridTools btn-toolbar">\
                                                <div class="btn-group tools"></div>\
                                                <div class="btn-group multi-tools"></div>\
                                            </div>\
                                            <div class="col-sm-6 filter-box" style="text-align: right;"></div>\
                                        </div>\
                                        <div class="row">\
                                            <div class="col-sm-12" style="overflow:auto;">\
                                                <table class="table table-bordered '+ cssClass.join(' ') +' dataTable">\
                                                    <thead>\
                                                        <tr role="row"></tr>\
                                                    </thead>\
                                                    <tbody></tbody>\
                                                    <tfoot>\
                                                      <tr colspan="4"></tr>\
                                                    </tfoot>\
                                                </table>\
                                            </div>\
                                        </div>\
                                        <div class="row">\
                                            <div class="col-sm-5">\
                                                <div class="dataTables_info">loading</div>\
                                            </div>\
                                            <div class="col-sm-7">\
                                                <div class="gridPagination dataTables_paginate paging_simple_numbers"></div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>';

            container.html(template);

            options.$tbody = container.find('table tbody');
            options.$thead = container.find('table thead tr');
            options.$tfoot = container.find('table tfoot tr');
            options.$pagination = container.find('.gridPagination');
            options.$tools = container.find('.tools');
            options.$multiTools = container.find('.multi-tools');
            options.$filterBox = container.find('.filter-box');

            this.renderHead();
            this.renderFilter();
        },

        /**
         * 加载数据
         * @param  {Object} params 参数键值对
         */
        loadData: function(params) {
            var that = this;
            var options = this.options;
            var dynamicParams = $.isFunction(this.options.getParams) ? this.options.getParams() : {};
            var url = this.replaceUrlParams(this.options.dataUrl, $.extend(dynamicParams, params));

            $.get(url)
            .success(function(response) {
                var page = options.pagination;
                    page.pageSize = response.pageSize;


                that.options.$multiSelect[0].checked = false;
                that.disableBatchTools();

                // 如果页码或总记录数有变化，则重置分页条
                if (response.currentPage !== page.currentPage || page.totalNum !== response.totalNum) {
                    page.currentPage = response.currentPage;
                    page.totalNum = response.totalNum;
                    options.$pagination.pagination('reset', page); // 更新分页条
                }

                options.data = response.data;
                that.render(response.data);
            })
            .error(function() {

            });
        },

        /**
         * 重新加载数据
         */
        reload: function(params) {
            this.loadData(params);
        },

        /**
         * 渲染过滤器
         */
        renderFilter: function() {
            var options = this.options;
            options.$filterBox.append($(options.filter).hide().clone().show());

            var form = options.$filterBox.find('form');

            form = (form.size() > 0) ? form : options.$filterBox;
            if (form.find('[role="filterBtn"]').size() === 0) {
                form.append('<a role="filterBtn" href="#" class="btn btn-default btn-small"><i class="fa fa-search"></i></a>');
            }
            form = null;
        },

        /**
         * 渲染表头
         */
        renderHead: function() {
            var options = this.options;
            var columns = options.columns;
            var ths = [];

            // 新增按钮
            if (!!options.addPageUrl) {
                options.$tools.append('<a class="btn btn-primary btn-small" href="'+ options.addPageUrl +'" role="add"><i class="fa fa-plus"></i> 新增</a>');
            }

            options.$tools.html(this.generateApartMenu());

            // 添加多选按钮以及批量操作按钮
            if (options.checkbox) {
                ths.push('<th style="width:24px; text-align:center; padding-right:8px;"><div class="checkbox"><input type="checkbox" role="multiSelect" name="multiSelect" /></div></th>');

                // var multiDel = '<a href="#" role="multiDelete" class="btn btn-primary disabled"><i class="fa fa-remove"></i> <span>删除</span></a>';
                options.$multiTools.append(this.generateBatchMenu());
            }

            $.each(columns, function(i, col) {
                var width = col.width ? col.width : 'auto';
                var align = col.align ? col.align : 'left';

                ths.push('<th style="width:'+ width +'px; text-align:'+ align +'" title="'+ (col.title || col.id) +'">'+ (col.title || col.id) +'<i class="resize" role="resize"></i></th>');
            });

            // 功能按钮列
            ths.push('<th></th>');

            options.$thead.html(ths.join('\n'));
            options.$multiSelect = options.$thead.find('[role="multiSelect"]');
        },

        /**
         * 渲染表格数据
         * @param  {data} data 表格数据
         */
        render: function(data) {
            var options = this.options;
            var that = this;
            var columns = options.columns;
            var tableRows = [];

            $.each(data, function(i, row) {
                var id = that.getRowId(row);

                tableRows.push('<tr data-id="'+ id +'">');

                if (options.checkbox) {
                    tableRows.push('<th style="width:24px; text-align:center;"><div class="checkbox"><label for=""><input type="checkbox" role="select" name="'+ id +'" id="row_'+ id +'" /></label></div></th>');
                }

                $.each(columns, function(i, col) {
                    var value = row[col.id];
                    var width = col.width ? col.width : 'auto';
                    var align = col.align ? col.align : 'left';
                    var formatter = col.formatter || col.filter;

                    value = $.isFunction(formatter) ? formatter(value, row) : value;
                    tableRows.push('<td style="width:'+ width +'px; text-align:'+ align +'" title="'+ $('<div/>').html(value).text() +'">'+ value + '</td>')
                });
                
                tableRows.push('<td style="text-align: right; padding:4px; white-space:nowrap; word-break:keep-all;">'+ that.generatorRowMenu(id, row) + '</td>')

                tableRows.push('</tr>');
            });

            this.options.$tbody.html(tableRows.join('\n'));
        },

        /**
         * 获取Row ID
         * @param {Object} row 一条数据
         * @return {String} 返回指定数据的ID
         */
        getRowId: function(row) {
            var options = this.options;
            var idField = options.idField || 'id';

            return row[idField];
        },

        /**
         * 生成操作菜单
         * @param {String} id Row ID
         * @param {Object} row 行数据
         * @return {String} HTML String.
         */
        generatorRowMenu: function(id, row) {
            var options = this.options;
            var tools = [];

            if (options.tools) {
                $.each(options.tools, function(i, tool) {
                    if ($.isFunction(tool.action)) {
                        var icon = tool.icon.match(/^fa-/) ? ('fa '+ tool.icon) : tool.icon;
                        tools.push('<a class="btn btn-link btn-small" style="margin-right:-6px; padding:6px 8px" href="#" role="toolAction" data-toolindex="'+ i +'" data-id="'+ id +'"><i class="'+ icon +'"></i> '+ tool.title +'</a>');
                    }
                });
            }

            return tools.join('\n');
        },

        /**
         * 生成批量操作菜单
         * @param {String} id Row ID
         * @return {String} HTML String.
         */
        generateBatchMenu: function() {

            var options = this.options;
            var tools = [];
            if (options.tools) {
                $.each(options.tools, function(i, tool) {
                    if (tool.batchAction && $.isFunction(tool.batchAction)) {
                        var cssClass = [];
                        var icon = tool.icon.match(/^fa-/) ? ('fa '+ tool.icon) : tool.icon;
                        var force = tool.forceEnabled ? '1' : '0';

                        cssClass.push(tool.style ? ('btn-'+tool.style) : 'btn-default');
                        cssClass.push(tool.forceEnabled ? '' : 'disabled');
                        tools.push('<a class="btn '+ cssClass.join(' ') +' btn-small" force-enabled='+ (force) +' href="#" role="batchToolAction" data-toolindex="'+ i +'"><i class="'+ icon +'"></i> '+ tool.title +'</a>');
                    }
                });
            }

            return tools.join('\n');
        },

        /**
         * 生成独立的功能菜单
         */
        generateApartMenu: function() {

            var options = this.options;
            var apart = [];

            if (options.tools) {
                $.each(options.tools, function(i, tool) {

                    if (tool.apartAction && $.isFunction(tool.apartAction)) {
                        var cssClass = tool.style ? ('btn-'+tool.style) : 'btn-default';
                        var icon = tool.icon.match(/^fa-/) ? ('fa '+ tool.icon) : tool.icon;
                        apart.push('<a class="btn '+ cssClass +' btn-small" href="#" role="apartToolAction" data-toolindex="'+ i +'"><i class="'+ icon +'"></i> '+ tool.title +'</a>');
                    }
                });
            }

            return apart.join('\n');
        },

        /**
         * 获取自定义query string以及filter的字段
         * @return {Object} 参数值
         */
        getCustomQueryString: function() {
            var options = this.options;
            var queryParams = $.isFunction(options.queryParams) ? options.queryParams() : {};
            var filters = options.$filterBox.find('form').serializeArray();
            var params = {};

            $.each(filters, function(i, o) {
                params[o.name] = o.value;
            });

            return $.extend(queryParams, params);
        },

        /**
         * 把URL中的变量（$xxx）替换成参数值
         * @param {String} url    url template
         * @param {String} params url
         */
        replaceUrlParams: function(url, params) {
            var options = this.options;
            var pageOpts = options.$pagination.pagination('getOptions') || options.pagination;
            var urlRegExp = /\$(\w+)/g;
            var paramKeys = (url.match(urlRegExp)||[]).map(function(a){return a.replace(/^\$/,'')});
            var queryParams = this.getCustomQueryString();
            var queryStr = [];

            // 动态参数
            for (var k in queryParams) {
                queryStr.push(k + '=' + encodeURIComponent(queryParams[k]));
            }

            // 固定参数
            params = $.extend({
                pageSize: pageOpts.pageSize,
                pageCount: pageOpts.pageCount,
                totalNum: pageOpts.totalNum,
                currentPage: pageOpts.currentPage,
                pageIndex: pageOpts.currentPage
            }, params);

            $.each(paramKeys, function (i, key) {
                url = url.replace(new RegExp('\\$'+ key, 'g'), params[key]||'');
            });

            url += (url.indexOf('?') === -1 ? '?' : '&') + queryStr.join('&');

            url = this.setUrlParams(url, params);

            return url;
        },

        setUrlParams: function(url, params) {
            var parsed = url.split('?');
            var urlParams = (parsed[1]||'').split('&').map(function(o, i) {
                var arr = o.split('=');

                for (var k in params) {
                    if (arr[0] === k) {
                        arr[1] = params[k];
                    }
                }

                return arr.join('=');
            });

            url = parsed[0] + '?' + urlParams.join('&');

            return url;
        },

        /**
         * 根据Row ID获取数据
         * @param  {String} id RowID
         * @return {Object}
         */
        getDataByRowId: function(id) {
            var options = this.options;
            var result;

            $.each(this.options.data, function(i, row) {
                var rowid = row[options.idField].toString();
                if (rowid && rowid === id.toString()) {
                    result = row;
                    return false;
                }
            });

            return result;
        },

        /**
         * 获取以选中的选项
         * @return {[type]} [description]
         */
        getSelected: function() {
            var ids = [];

            this.options.$tbody.find('input:checkbox:checked').each(function() {
                ids.push(this.name);
            });

            return ids;
        },

        /**
         * 初始化Action事件
         * @return {[type]} [description]
         */
        bindEvents: function() {
            var that = this;
            var options = this.options;
            var roles = [
                '[role="delete"]',
                '[role="add"]',
                '[role="multiDelete"]',
                '[role="update"]',
                '[role="select"]',
                '[role="batchToolAction"]',
                '[role="apartToolAction"]',
                '[role="toolAction"]',
                '[role="filterBtn"]',
                '[role="multiSelect"]'
            ];

            options.container.off('.grid');

            options.container.on('click.grid', roles.join(','), function(event) {
                var role = $(this).attr('role');
                var handle = 'handle' + role[0].toUpperCase() + role.slice(1);

                if (this.tagName.toLowerCase() === 'a') {
                    event.preventDefault();
                }

                if ($.isFunction(that[handle])) {
                    that[handle]($(this));
                }
            });

            options.container.on('click.grid', '[grid-action]', function(event) {
                event.preventDefault();
                var action = $(this).attr('grid-action');
                var regExp = /([\w_]+)\(([^\)]*)\)/;
                var result = action.match(regExp);
                var method;
                var params;

                if (result) {
                    method = result[1];
                    params = (result[2]||'').split(',').map(function(o, i) {
                        var p = o.replace(/($[\s*]|[\s*]^)/);
                        return (new Function('return '+ p))();
                    });

                    if ($.isFunction(that[method])) {
                        that[method].apply(that, params);
                    }
                }


            });

            // 列宽度调整
            options.container.on('mousedown.grid', '[role="resize"]', function(event) {
                var left = event.pageX;
                var col = $(event.currentTarget).parent();
                var originWidth = col.width();

                $(document).on('mousemove.resizeCol', function(event) {

                    var newLeft = event.pageX;
                    var width = newLeft - left;
                    col.width(Math.max(24, Math.min(500, originWidth + width)));
                });

                $(document).on('mouseup.resizeCol', function(event) {
                    $(document).off('.resizeCol');
                });
            });
        },

        handleBatchToolAction: function(targetElement) {
            var options = this.options;
            var toolIndex = targetElement.attr('data-toolindex');
            var tool = options.tools[toolIndex];
            var action = tool.batchAction;
            var list = this.getSelected();

            if ($.isFunction(action)) {
                action.call(this, list.join(','), targetElement, this);
            }
        },

        handleApartToolAction: function(targetElement) {
            var options = this.options;
            var toolIndex = targetElement.attr('data-toolindex');
            var tool = options.tools[toolIndex];
            var action = tool.apartAction;
            var list = this.getSelected();

            if ($.isFunction(action)) {
                action.call(this, targetElement, this);
            }
        },

        handleToolAction: function(targetElement) {
            var options = this.options;
            var toolIndex = targetElement.attr('data-toolindex');
            var tool = options.tools[toolIndex];
            var action = tool.action;
            var rowid = targetElement.attr('data-id');
            var row = this.getDataByRowId(rowid);

            if ($.isFunction(action)) {
                action.call(this, row, targetElement, this);
            }
        },

        handleDelete: function(targetElement) {
            var id = targetElement.attr('data-id');

            if (window.confirm('确定要删除吗？')) {
                alert('删除成功。');
            }
        },

        handleFilterBtn: function(targetElement) {
            var options = this.options;
            var filters = options.$filterBox.find('form').serializeArray();
            var params = {};

            $.each(filters, function(i, o){
                params[o.name] = o.value;
            });

            this.reload(params);
        },

        handleUpdate: function(targetElement) {
            var id = targetElement.attr('data-id');
            alert(id);
        },

        handleAdd: function(targetElement) {
            var that = this;
            var options = this.options;

            $.get(options.addPageUrl)
            .success(function(html) {

                Dialog.show({
                    title: that.options.addDialogTitle || '新增',
                    message: $(html),
                    submitDataType: 'json', //json,form
                    submit: function(data, dialog) {

                        if (dialog.options.submitDataType === 'json') {
                            $.ajax({
                                url: options.addUrl,
                                type: 'POST',
                                contentType: 'application/json; charset=utf-8', // 很重要
                                traditional: true,
                                data: JSON.stringify(data), // {"name":"zhangsan", "age": 28}
                                success: function(res, status, xhr) {
                                    Dialog.alert({message:'保存成功。', size:'size-small', type:'type-success'});
                                    that.reload(); //刷新表格
                                    dialog.close();
                                },
                                error: function() {
                                    Dialog.alert({message:'提交失败, 请再试一次。', size:'size-small', type:'type-danger'});
                                }
                            });
                        } else {

                            $.post(options.addUrl, data)
                                .success(function() {
                                    Dialog.alert({message:'保存成功。', size:'size-small', type:'type-success'});
                                    that.reload(); //刷新表格
                                    dialog.close();
                                })
                                .error(function() {
                                    Dialog.alert({message:'提交失败, 请再试一次。', size:'size-small', type:'type-danger'});
                                });
                        }
                    },
                    buttons: [{
                        label: '取消',
                        action: function(dialog) {
                            dialog.close();
                        }
                    }, {
                        label: '保存',
                        cssClass: 'btn-primary',
                        action: function(dialog) {
                            dialog.submit();
                        }
                    }]
                });
            })
            .error(function() {

            });
        },

        handleMultiDelete: function(targetElement) {
            var selected = this.getSelected();

            if (confirm('是否批量删除'+selected.length+'项？')) {
                alert('删除成功。');
            }
        },

        handleSelect: function(targetElement) {
            this.toggleBatchTools();
            this.options.$multiSelect[0].checked = this.isAllSelected();
        },

        handleMultiSelect: function(targetElement) {

            if (targetElement[0].checked) {
                this.selectAll();
            } else {
                this.deselectAll();
            }

            this.toggleBatchTools();
        },

        enableBatchTools: function() {
            this.options.$multiTools.find('[role="batchToolAction"]').removeClass('disabled');
        },

        disableBatchTools: function() {
            this.options.$multiTools.find('[role="batchToolAction"][force-enabled="0"]').addClass('disabled');
        },

        toggleBatchTools: function() {
            if (this.getSelected().length > 0) {
                this.enableBatchTools();
            } else {
                this.disableBatchTools();
            }
        },

        selectAll: function() {
            this.options.$tbody.find('[role="select"]').each(function() {
                this.checked = true;
            });
        },

        deselectAll: function() {
            this.options.$tbody.find('[role="select"]').each(function() {
                this.checked = false;
            });
        },

        isAllSelected: function() {
            var listLength = this.options.$tbody.find('tr').length;
            var selected = this.getSelected();

            return (listLength === selected.length);
        }
    };

    // 组件
    $.fn.grid = function(config) {
        var ARGS = arguments;

        if (typeof config === 'string') {
            var pg = $(this).data('grid');
            var args = Array.prototype.slice.call(ARGS, 1);

            if (pg && typeof pg[config] === 'function') {
                pg[config].apply(pg, args);
            }

        } else {
            return this.each(function() {
                var options = $.extend({}, $.fn.grid.defaults, config, {container: $(this)});
                var instance = new Grid(options);

                $(this).data('grid', instance);
            });
        }
    };

    // 默认配置对象
    $.fn.grid.defaults = {

        pagination: {
            "pageSize": 10,
            "currentPage": 1,
            "totalNum": 0,
            "textPrev": "上一页",
            "textNext": "下一页",
            "textStatus": "当前显示第 ${limit1} 至 ${limit2} 条，共 ${total} 条数据。"
        },
        title: '表格标题',
        dataUrl: '/mock/grid.json?pageSize=$pagesize&pageIndex=$pageIndex&sortField=$sortField&sortType=$sortType',
        deleteUrl: '',
        updateUrl: '',
        addUrl: '',
        highlight: true,
        idField: 'id',
        zebra: true,
        checkbox: true,
        onSelected: function() {},
        columns: [
            {
                id:'rowIdFieldName',
                title:'姓名',
                sortable:true,
                width:100,
                align:'left',
                formatter:function(value, data){ return value; }
            },
            'moduleCode'
        ]
    };

}(this, jQuery));