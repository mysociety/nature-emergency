var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

function setUpGeocodeAutocomplete(inputElement, singleResultCallback) {
    var awesomplete = new Awesomplete(
        inputElement,
        {
            list: _.pluck(window.councils, 'council_name'),
            minChars: 3,
            autoFirst: true
        }
    );

    awesomplete.container.addEventListener('awesomplete-select', function(selection){
        selection.preventDefault();
        var council = _.findWhere(
            window.councils,
            {'council_name': selection.text.value}
        );
        singleResultCallback(council);
    });

    $(inputElement).on('keypress', function (e) {
        // Reset Awesomplete overrides from last geocoding result.
        awesomplete.list = _.pluck(window.councils, 'council_name');
        awesomplete.filter = Awesomplete.FILTER_CONTAINS;

        if (e.which === 13) {
            e.preventDefault();

            // If the user presses Enter, we assume they’ve entered a
            // postcode and intend to search by it. We tidy the postcode
            // then send it to MapIt. (If the text isn’t a valid postcode,
            // MapIt will return an error, which we just silently ignore.)
            var postcode = inputElement.value.replaceAll(' ', '').toLowerCase();
            $.ajax({
                url: 'https://mapit.mysociety.org/postcode/' + encodeURIComponent(postcode) + '.json',
                dataType: 'json'
            }).done(function(data){
                var areas = _.values(data.areas);
                var matches = _.filter(areas, function(area){
                    return [
                        'CTY', // County councils (two-tier)
                        'COI', // Isles of Scilly is a Unitary authority (single-tier)
                        'DIS', // Non-Metropolitan Districts (two-tier)
                        'GLA', // Greater London Authority (which we treat as a Combined Authority)
                        'LBO', // London Boroughs (single-tier)
                        'LGD', // Nothern Irish councils (single-tier)
                        'MTD', // Metropolitan Districts (single-tier)
                        'UTA', // Unitary Authorities (single-tier)
                    ].indexOf(area.type) > -1;
                });

                // If MapIt returns a single area, redirect to it
                // (as if it had been selected from the Awesomplete).
                if (matches.length == 1) {
                    var council = _.findWhere(
                        window.councils,
                        {'council_gss': matches[0].codes.gss}
                    );
                    singleResultCallback(council);

                // If MapIt returns multiple areas (in the case of
                // two-tier authorities, eg: CB3 9DR) override the
                // Awesomplete to display them in a dropdown menu.
                } else if (matches.length > 1) {
                    // Get matching councils from window.councils (matching by GSS code).
                    var councils = _.filter(window.councils, function(council){
                        return _.map(matches, function(match){
                            return match.codes.gss;
                        }).indexOf(council.council_gss) > -1;
                    });

                    // Note: We will revert these Awesomplete overrides
                    // on the next keypress.
                    awesomplete.list = _.pluck(councils, 'council_name');
                    awesomplete.filter = function(){ return true; }
                    awesomplete.evaluate();
                }
            });
        }
    });
}

$(function(){
    $('.scorecard__data__table, .mini-scorecard').on('click', 'tbody tr', function(){
        window.location = $(this).find('a').eq(0).attr('href');
    });

    $('input[name="pc"]').each(function(){
        var inputElement = this;
        setUpGeocodeAutocomplete(
            inputElement,
            function (council) {
                window.location = window.baseurl + '/councils/' + council.council_slug;
            }
        );
    });

    $('#scorecard-filters-detail').on('change', function(e){
        var $form = $(this);
        var $table = $('#scorecard-table');
        var filters = [];

        // Loop through <select> elements, pulling out the CSS classes
        // we need to add to the table, to show/hide the relevant rows.
        $form.find('select').each(function(){
            var val = $(this).val();

            // Bail out early if <select> has the default "Any" value.
            if (val !== "") {
                filters.push(val);
            }
        });

        // The browser will hide/show table rows based on this
        // `data-filters` attribute.
        if (filters.length) {
            $table.attr('data-filters', filters.join(' '));
        } else {
            $table.removeAttr('data-filters');
        }

        // Update the stats above the table.
        var $visibleRows = $table.find('tbody tr').filter(':visible');
        $('.scorecard-filtered-count').text($visibleRows.length);
        $.each({
            'ned': [1, 2, 3],
            'priority-1': [1],
            'priority-2': [1],
            'priority-3': [1]
        }, function(slug, values){
            if($visibleRows.length) {
                var selector = $.map(values, function(value){
                    return '[data-' + slug + '="' + value + '"]';
                }).join(', ');
                var matches = $visibleRows.filter(selector).length;
                var percent = Math.round((matches / $visibleRows.length) * 100);
            } else {
                var matches = 0;
                var percent = 0; // prevent NaN when no matches
            }
            $('#scorecard-summary-' + slug + '-absolute').text(matches);
            $('#scorecard-summary-' + slug + '-percent').text(percent);
        });
    });

    $('#scorecard-table-search').each(function(){
        var inputElement = this;
        setUpGeocodeAutocomplete(
            inputElement,
            function (council) {
                var $row = $('#scorecard-table').find('tr[data-council-slug="' + council.council_slug + '"]').eq(0);
                $row.addClass('highlight').siblings('.highlight').removeClass('highlight');
                $row[0].scrollIntoView({
                    block: 'center',
                    inline: 'center'
                });
            }
        );
    });

    $('[data-copy-content]').on('click', function(e){
        e.stopPropagation();
        if (navigator.clipboard) {
            var $el = $(this);
            var $feedback = $el.find('[data-copy-feedback]');
            var $target = $($el.attr('data-copy-content'));
            var successHTML = $el.attr('data-copy-success');
            var originalHTML = $feedback.html();

            var copyHTML = new Blob([ $target.html() ], { type: 'text/html' });
            var copyText = new Blob([ $target.text() ], { type: 'text/plain' });
            var clipboardData = new ClipboardItem({ "text/html": copyHTML, "text/plain": copyText });

            navigator.clipboard.write([ clipboardData ]).then(function(){
                $feedback.html(successHTML);
                $el.attr('data-copied', true);
                setTimeout(function(){
                    $feedback.html(originalHTML);
                    $el.removeAttr('data-copied');
                }, 2000);
            });
        }
    });

    $('[data-copy-attribute]').on('click', function(e){
        e.stopPropagation();
        if (navigator.clipboard) {
            var $el = $(this);
            var $feedback = $el.find('[data-copy-feedback]');
            var copyText = $el.attr('data-copy-attribute');
            var successHTML = $el.attr('data-copy-success');
            var originalHTML = $feedback.html();

            var copyText = new Blob([ copyText ], { type: 'text/plain' });
            var clipboardData = new ClipboardItem({ "text/plain": copyText });

            navigator.clipboard.write([ clipboardData ]).then(function(){
                $feedback.html(successHTML);
                $el.attr('data-copied', true);
                setTimeout(function(){
                    $feedback.html(originalHTML);
                    $el.removeAttr('data-copied');
                }, 2000);
            });
        }
    });
});
