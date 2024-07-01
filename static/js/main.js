$(function(){
    // console.log('jQuery ready')
    // console.log('_.now()', _.now())
    // console.log('bootstrap.Modal', bootstrap.Modal)

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
            // TODO: Update page in-place, rather than navigating away
            window.location = window.baseurl + '/councils/' + council.council_slug + '#councils';
        });
    });

    $('.js-toggle-filters').on('click', function(){
        $('.data-explorer__filters').toggleClass('active');
    });

    var map = L.map( $('#map')[0] ).setView([54.5408, -2.8791], 7);
    L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(map);
});
