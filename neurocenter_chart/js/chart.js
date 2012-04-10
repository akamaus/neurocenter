/* Spike
 *
 * An interactive spiking neural network simulator
 * https://github.com/akamaus/Spike/wiki
 *
 * Copyright 2011, Dmitry Vyal
 * Released under the GPLv2 license
 *
 * Date: Sun, 31 Jul 2011 22:49:45 +0400
 */

function Chart(elem) {
  try {
    //  throw new Object();
    this.chart = new SmoothieChart({
        grid: { strokeStyle:'rgb(0, 125, 0)', fillStyle:'rgb(0, 0, 0)',
                lineWidth: 1, millisPerLine: 2000, verticalSections: 4 },
        labels: { fillStyle:'rgb(60, 0, 0)' },
        fps:5,
        millisPerPixel: 100,
        minValue:-2,
        maxValue:2,
       interpolation: "line"
   });

    // Data
    this.chart_data = new TimeSeries();

    this.chart.addTimeSeries(this.chart_data,
        { strokeStyle:'rgb(0, 0, 255)', fillStyle:'rgba(0, 0, 255, 0.3)', lineWidth:3 });
    this.chart.streamTo($$(elem).get(0),300);

  } catch (err) {
      $$(elem).remove();
  }
};

Chart.prototype.start = function() {
    if (this.chart)
        this.chart.start();
};

Chart.prototype.stop = function() {
    if (this.chart)
        this.chart.stop();
};

Chart.prototype.append_datum = function(v) {
    if (this.chart_data) {
        this.chart_data.append(new Date().getTime(), v);
    }
};

Spike.chart = new Chart($$('#exitation-chart'));

Spike.update_stats = function() {
    var neuron_stats = "";
    var link_stats = "";

    var neuron = Neuron.selected;
    if (neuron) {
        neuron_stats += 'Id: ' + neuron + "<br/>";
        neuron_stats += 'V: ' + neuron.v.toFixed(2) + "<br/>";
        Spike.chart.append_datum(neuron.v);
    }
    if(Link.selected) {
        link_stats += 'Id: ' + Link.selected + "<br/>";
        link_stats += 'Weight: ' + Link.selected.weight.valueOf().toFixed(2) + "<br/>";
    }

    $$('#neuron-stats').html(neuron_stats);
    $$('#link-stats').html(link_stats);
};
