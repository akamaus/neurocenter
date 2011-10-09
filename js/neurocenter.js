(function ($) {
     var seq = 1;
     Drupal.behaviors.scan_neuro_data = {
         attach: function (context, settings) {
             $('div.field-name-field-neuro-data',context).each(function(k,v) {
                 var conf = $('div.field-item', v).html();
                 $(v).empty();
                 implant_spike(v,conf);
             });
         }
     };

     function implant_spike(container, conf) {
         var paper_id = 'neurocenter-' + seq;
         seq++;

         $(container).append('<div id="'+paper_id+'" class="neurocenter"></div>');
         var spike = window.spike = new Spike(paper_id);

         var cfg = JSON.parse(conf);
         Spike.restore(spike, cfg);
     }

})(jQuery);
