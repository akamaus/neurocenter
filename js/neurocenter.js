(function ($) {
     var seq = 1;
     Drupal.behaviors.neurocenter_editor = {
         attach: function (context, settings) {
             $('div.neurocenter_editor textarea',context).each(function(k,v) {

                 var cfg_elem = $(v);
                 var container = $(cfg_elem.parents('div.neurocenter_editor'));
                 conf = cfg_elem.val();
                 container.children().hide();

                 var spike = implant_spike(container,conf);

                 cfg_elem.parents('form').submit(function() {
                     cfg_elem.val(JSON.stringify(Spike.store(spike)));
                 });
             });
         }
     };

     Drupal.behaviors.neurocenter_player = {
         attach: function (context, settings) {
             $('div.neurocenter_player div.serialized_network', context).each(function(k,v) {
                 var cfg_elem = $(v);
                 var container = $(cfg_elem.parents('div.neurocenter_player'));
                 conf = cfg_elem.html();
                 container.children().empty();

                 var spike = implant_spike(container,conf);
             });
         }
     };


     function implant_spike(container, conf) {
         var paper_id = 'neurocenter-' + seq;
         seq++;

         container.append('<div id="'+paper_id+'" class="neurocenter"></div>');
         var w = container.attr('data-width');
         var h = container.attr('data-height');
         if (w>0) $('#' +paper_id).width(w);
         if (h>0) $('#' +paper_id).height(h);

         var spike = window.spike = new Spike(paper_id);
         try {
             var cfg = JSON.parse(conf);
             Spike.restore(spike, cfg);
         } catch(e) {
             alert("couldn't parse neural net for some reason");
         }
         return spike
     }

})(jQuery);
