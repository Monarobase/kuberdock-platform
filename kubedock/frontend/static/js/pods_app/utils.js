define(['moment-timezone', 'numeral'], function (moment) {
    this.modalDialog = function(options){
        var modal = $('.modal'),
            modalDialog = modal.find('.modal-dialog');
        if ($('.modal-backdrop').is(':visible')) {
            // previous modal dialog is still visible. Delay until it's fully closed
            return modal.one('hidden.bs.modal', _.bind(this.modalDialog, this, options));
        }
        modalDialog.css('margin-top', ( $(window).height() / 2 - 140 ));
        if(options.title) modal.find('.modal-title').html(options.title);
        if(options.body) modal.find('.modal-body').html(options.body);
        if(options.large) modal.addClass('bs-example-modal-lg');
        if(options.small) modal.addClass('bs-example-modal-sm');
        if(options.show) modal.modal('show');
        if(options.footer){
            modal.find('.modal-footer').empty();
            var buttonText = options.type === 'delete' ? 'Delete' : 'Ok';
            if(options.footer.buttonOk){
                modal.find('.modal-footer').append(
                    $('<button type="button" class="btn blue" ' +
                          'data-dismiss="modal">').unbind('click')
                        .bind('click', options.footer.buttonOk)
                        .text(buttonText)
                );
            }
            if(options.footer.buttonCancel === true){
                modal.find('.modal-footer').prepend(
                    $('<button type="button" class="btn"' +
                          'data-dismiss="modal">Cancel</button>')
                );
            }
        }
        return modal;
    };

    this.modalDialogDelete = function(options){
        options.type = 'delete';
        return this.modalDialog(options);
    };

    this.notifyWindow = function(b, type){
        var msg = typeof b == "string" ? b :
                  !(b.responseJSON && b.responseJSON.data) ? b.responseText :
                  typeof b.responseJSON.data == 'string' ? b.responseJSON.data :
                  JSON.stringify(b.responseJSON.data);
        if (b && b.status == 401){
            window.location = '/login';
        } else {
            $.notify(msg,{
                autoHideDelay: 5000,
                clickToHide: true,
                globalPosition: 'bottom left',
                className: type || 'error',
            });
        }
    };

    this.preloader = {
        show: function(){ $('#page-preloader').show(); },
        hide: function(){ $('#page-preloader').hide(); }
    };

    this.hasScroll = function() {
        var hContent = $('body').height(),
            hWindow = $(window).height();

        return  hContent > hWindow ? true : false;
    };

    this.scrollTo = function(a, b){
        el = a.offset().top;
        $('html, body').animate({
            scrollTop: el-50
        }, 500);
    };

    // Quick fix. Name localizeDatetime conflicts with upper utils function.
    // TODO: replace usage of this function in views/pod_item.js with upper
    // utils module.
    this.localizePodDatetime = function(dt, tz, formatString){
        formatString = formatString || 'YYYY-MM-DD HH:mm:ss';
        if (tz === undefined && typeof userProfile != 'undefined') {
            tz = userProfile.timezone;
        }
        if (typeof tz !== 'string') {
            tz = 'UTC';
        } else {
            tz = tz.split(' (', 1)[0];
        }
        try {
            return moment(dt).tz(tz).format(formatString);
        } catch (e){
            console.log(e);
        }
        return moment(dt).format(formatString);
    };

    // TODO: crate models Package and Kube; use backbone-associations for relations
    this.getUserPackage = function(full) {
        var package = _.findWhere(packages, {id: userPackage});
        if (full) {
            var kubes = _.indexBy(kubeTypes, 'id');
            package.kubes = _.chain(packageKubes).where({package_id: package.id})
                .each(function(packageKube){
                    _.extend(packageKube, kubes[packageKube.kube_id]);
                }).value();
        }
        return package;
    };

    // TODO: it should be a method of Package model
    this.getFormattedPrice = function(package, price, format) {
        format = format !== undefined ? format : '0.00';

        return package.prefix + numeral(price).format(format) + package.suffix;
    };

    return this;
});
