(function(global, $, undefined) {

    // 组件
    $.fn.asyncmenu = function(config) {
        return this.each(function(elem) {

            var options = $.extend({}, $.fn.asyncmenu.defaults, config);

            if ($(this).data('asyncmenu') === 1) {
                return;
            } else {

                $(this).data('asyncmenu', 1);
                $(this).off('.asyncmenu')
                .on('click.asyncmenu', 'a[href]', function($event) {

                    var url = $(this).attr('href');
                    var isLink = !url.match(/^(#|javascript:|mailto:|file:\/\/\/)/);
                    var isDownload = url.match(/(docx?|xlsx?|pdf|jpe?g|gif|png|webp|bmp)$/);

                    if (url && isLink && !isDownload) {
                        $event.preventDefault();
                        pageLoader.load(url);
                    }


                    // $.get(url)
                    // .success(function(html) {
                    //     $(options.container).html(html);
                    // })
                    // .error(function() {
                    //     alert('error');
                    // });
                });
            }
        });
    };

    // 默认配置对象
    $.fn.asyncmenu.defaults = {
        container: 'body'
    };

    $('body').asyncmenu();

}(this, jQuery));