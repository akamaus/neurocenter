(function ($) {
     var seq = 1;
     Drupal.behaviors.scan_neuro_data = {
         attach: function (context, settings) {
             $('div.field-name-field-neuro-data',context).each(function(k,v) {
                 var conf = $('div.field-item', v).html();
                 alert('conf: ' + conf);
                 $(v).empty();
                 implant_spike(v,conf);
             });
         }
     };

     function implant_spike(container, conf) {
         $(container).append('<div id="neurocenter-'+seq+'" class="neurocenter">ZZZ</div>');
         seq++;
     }

})(jQuery);
