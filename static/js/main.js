$(function(){
    $('.scorecard__data__table').on('click', 'tbody tr', function(){
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
});
