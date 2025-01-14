$(function(){
    $('.scorecard__data__table, .mini-scorecard').on('click', 'tbody tr', function(){
        window.location = $(this).find('a').eq(0).attr('href');
    });

    $('input[name="pc"]').each(function(){
        var $pc = $(this);
        new Awesomplete(
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
        $.each(['ned', 'priority-1', 'priority-2', 'priority-3'], function(i, slug){
            if($visibleRows.length) {
                var $matches = $visibleRows.filter('[data-' + slug + '="1"]');
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
