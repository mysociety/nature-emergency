$(function(){
    $('.scorecard__data__table, .mini-scorecard').on('click', 'tbody tr', function(){
        window.location = $(this).find('a').eq(0).attr('href');
    });

    $('input[name="pc"]').each(function(){
        var $pc = $(this);

        var awesomplete = new Awesomplete(
            $pc[0],
            {
                list: _.pluck(window.councils, 'council_name'),
                minChars: 3,
                autoFirst: true
            }
        );

        document.addEventListener('awesomplete-select', function(selection){
            selection.preventDefault();
            var council = _.findWhere(
                window.councils,
                {'council_name': selection.text.value}
            );
            window.location = window.baseurl + '/councils/' + council.council_slug + '#councils';
        });

        $pc.on('keypress', function (e) {
            // Reset Awesomplete overrides from last geocoding result.
            awesomplete.list = _.pluck(window.councils, 'council_name');
            awesomplete.filter = Awesomplete.FILTER_CONTAINS;

            if (e.which === 13) {
                e.preventDefault();

                // If the user presses Enter, we assume they’ve entered a
                // postcode and intend to search by it. We tidy the postcode
                // then send it to MapIt. (If the text isn’t a valid postcode,
                // MapIt will return an error, which we just silently ignore.)
                var postcode = $pc.val().replaceAll(' ', '').toLowerCase();
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
                        window.location = window.baseurl + '/councils/' + council.council_slug + '#councils';

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
        $('#scorecard-filtered-count').text($visibleRows.length);
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
                var $matches = $visibleRows.filter(selector);
                var percent = Math.round(($matches.length / $visibleRows.length) * 100);
            } else {
                var percent = 0; // prevent NaN when no matches
            }
            $('#scorecard-summary-' + slug).text(percent);
        });
    });

    $('#scorecard-table-search').on('keyup', function(){
        var searchTerm = $.trim($(this).val());
        var $table = $('#scorecard-table');

        $table.find('tr.highlight').removeClass('highlight');

        if(searchTerm.length > 1) {
            var matches = _.filter(window.councils, function(council){
                return council.council_name.toUpperCase().indexOf(searchTerm.toUpperCase()) > -1;
            });
            _.each(matches, function(match){
                $table.find('tr[data-council-slug="' + match.council_slug + '"]').addClass('highlight');
            });
            if (matches.length === 1) {
                $table.find('tr[data-council-slug="' + matches[0].council_slug + '"]').eq(0)[0].scrollIntoView({
                    block: 'center',
                    inline: 'center'
                });
            }
        }
    });
});
