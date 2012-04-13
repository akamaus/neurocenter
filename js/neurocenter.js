(function ($) {
    var seq = 1;

    window.spike_array=[];

    Drupal.behaviors.neurocenter_editor = {
        attach: function (context, settings) {
            $('div.neurocenter_editor textarea',context).each(function(k,v) {
                var cfg_elem = $(v);
                var spike = implant_spike(cfg_elem);
                // saving the net after editing
                cfg_elem.parents('form').submit(function() {
                    cfg_elem.val(JSON.stringify(spike.store()));
                });
            });
        }
    };

    Drupal.behaviors.neurocenter_player = {
        attach: function (context, settings) {
            $('div.neurocenter_player div.serialized_network', context).each(function(k,v) {
                var cfg_elem = $(v);
                var spike = implant_spike(cfg_elem);
            });
        }
    };


    function implant_spike(bearing) {
        var paper_id = 'neurocenter-' + seq;
        seq++;
        // player and editor use different tags for passing configuration
        switch(bearing.get(0).nodeName.toLowerCase()) {
        case "textarea":
            var conf = bearing.val();
        case "div":
            var conf = bearing.html();
        };

        bearing.hide();
        bearing.after('<div id="'+paper_id+'" class="neurocenter"></div>');

        var w = bearing.attr('data-width'),
            h = bearing.attr('data-height');
        var version = bearing.attr('data-model-version');
        var Spike = window.SpikeCode[version];

        if (!Spike) {
            alert('Error: model version ' + version + " is not registered");
        }

        if (w>0) $('#' +paper_id).width(w);
        if (h>0) $('#' +paper_id).height(h);

        var spike = new Spike(paper_id);
        spike_array.push(spike);

        try {
            var cfg = JSON.parse(conf);
            spike.restore(cfg);
        } catch(e) {
            alert("couldn't parse neural net for some reason");
        }
        return spike
    }

})(jQuery);
