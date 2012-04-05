(function ($) {
     var seq = 1;
     Drupal.behaviors.neurocenter_editor = {
         attach: function (context, settings) {
             $('div.neurocenter-block textarea',context).each(function(k,v) {

                 var cfg_elem = $(v);
                 var container = $(cfg_elem.parents('div.neurocenter-block'));
                 conf = cfg_elem.val();
                 container.children().hide();

                 var spike = implant_spike(cfg_elem.parents('div.neurocenter-block'),conf);

                 cfg_elem.parents('form').submit(function() {
                     cfg_elem.val(JSON.stringify(Spike.store(spike)));
                 });
             });
         }
     };

     function implant_spike(container, conf) {
         var paper_id = 'neurocenter-' + seq;
         seq++;
         $(container).append('<div id="'+paper_id+'" class="neurocenter"></div>');
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
