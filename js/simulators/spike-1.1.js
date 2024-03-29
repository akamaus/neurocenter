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

if (!window.SpikeCode)
    window.SpikeCode = new Object();
window.SpikeCode['1.1'] = Spike_1_1();

function Spike_1_1() {
    var $$ = jQuery;

    // Important constants
    var model_parameters = {
        // Coefficients of FitzHugh-Nagumo model
        a: -0.7,
        b: 0.8,
        tau: 1/0.08,
        // initial conditions
        v0: -0.9,
        w0: 0.24,
        dt: 0.2,
        // misc
        manual_stimilus: 1,
        link_weight: 0.5,
        link_weight_max: 5
    };

    var display_parameters = {
        neuron_radius:  1 / 20, // ratio to canvas size
        tick_interval:  100
    };

    // Language augmentation
    Array.prototype.delete_first = function(obj) {
        if (this.indexOf) {
            // for some mysterious reasons it gets called on Drupal ajax requests for window, not for arrays,
            // so exclude that possibility
            var i = this.indexOf(obj);
            if (i >= 0)
                this.splice(i,1);
        }
        return this;
    };

    // 2D point
    function Pos(x,y) {
        this.x = x;
        this.y = y;
    };
    Pos.dist = function(p1,p2) {
        var dx = p1.x - p2.x,
            dy = p1.y - p2.y;
        return Math.sqrt(dx*dx + dy*dy);
    };

    Pos.prototype.toString = function() {
        return this.x + " " + this.y;
    };

    Pos.prototype.scale = function(a,b) {
        return new Pos(a * this.x, b * this.y);
    }

    // Value scroller
    function ValueRange(min, max, value) {
        this.min = min;
        this.max = max;
        this.value = value;
        this.step = (max - min) / 50.0;
    }

    ValueRange.prototype.move = function(d) {
        this.value += this.step * d;
        if (this.value < this.min) this.value = this.min;
        else if (this.value > this.max) this.value = this.max;
    };

    ValueRange.prototype.valueOf = function() {
        return this.value;
    };

    // mapping from [o1,o2] into [d1,d2]
    function affine(o1,o2,d1,d2, x) {
        var p = (x-o1) / (o2-o1);
        return d1 + (d2-d1)*p;
    };

    function int_map(o1,o2,d1,d2, x) {
        var res = affine(o1,o2,d1,d2, x);
        if (d1<d2) {
            var min = d1,max = d2;
        } else
            var min = d2,max = d1;
        if (res < min) res = min;
        else if (res > max) res = max;
        return Math.round(res);
    };


    // Neuron related

    function Neuron(spike, x, y) {
        this.spike = spike; // access to rest neurons
        this.num = spike.free_neuron_index++;

        this.soma = this.spike.paper.circle(x * this.spike.paper.width, y * this.spike.paper.height, this.getSize());
        this.soma.neuron = this;
        this.soma.node.neuron = this;
        this.outgoing_links = [];
        this.incoming_links = [];

        this.v = model_parameters.v0; // potential
        this.w = model_parameters.w0; // stabilizer
        this.i = 0; // summary external current
        this.i_prev = 0; // summary external current

        this.spike.neurons.push(this);

        this.soma.drag(Neuron.on_drag_move, Neuron.on_drag_start, Neuron.on_drag_stop);

        this.soma.dblclick(function() { this.neuron.stimulate(); });
        this.soma.click(function() {this.neuron.select(); });

        var n = this;
        $$(this.soma.node).bind("mousedown", function(e) { n.on_mouse_down(e); });

        this.setPos(new Pos(x,y));
        this.redraw();
    }

    Neuron.prototype.getPos = function() { return this.soma.getPos(); };
    Neuron.prototype.setPos = function(p) { this.soma.setPos(p); };

    Neuron.prototype.getSize = function() {
        return Math.min(this.spike.paper.width,this.spike.paper.height) * display_parameters.neuron_radius;
    }

    Neuron.prototype.tick = function() {
        var v = this.v,
            w = this.w,
            i = this.i_prev; // incoming current from last tick
        var dv = v - v*v*v - w + i,
            dw = (v - model_parameters.a - model_parameters.b*w)/model_parameters.tau;

        this.v += dv*model_parameters.dt;
        this.w += dw*model_parameters.dt;

        if (this.v > 0) // transmitting impulse
            for (i=0; i< this.outgoing_links.length; i++) {
                this.outgoing_links[i].n2.i += this.outgoing_links[i].weight * this.v;
            }
    };

    // Neuron UI

    Neuron.on_drag_start = function() {
        this.opos = this.getPos();
        this.attr({'stroke-width': 3});
    };

    Neuron.on_drag_stop = function() {
        this.attr({'stroke-width': 1});
    };

    Neuron.on_drag_move = function(dx, dy) {
        this.setPos({x: this.opos.x + dx / this.paper.width,
                     y: this.opos.y + dy / this.paper.height});
        $$(this.neuron.outgoing_links).each(function(k,v) {v.redraw(); });
        $$(this.neuron.incoming_links).each(function(k,v) {v.redraw(); });
    };

    Neuron.prototype.on_mouse_down = function(e) {
        switch(e.which) {
        case 2:
            var n1 = this.spike.selected_neuron,
                n2 = this;
            if (n1 && n1 != n2 && !Neuron.linked(n1,n2)) {
                new Link(this.spike, n1,n2);
            }
            n2.select();
            break;
        case 3:
            this.remove();
            break;
        }
    };

    Neuron.prototype.stimulate = function() {
        this.v += model_parameters.manual_stimilus;
    };

    Neuron.prototype.select = function() {
        if (this.spike.selected_neuron) {
            this.spike.selected_neuron.soma.attr({"stroke-dasharray": ""});
        }
        this.spike.selected_neuron = this;
        this.spike.selected_neuron.soma.attr({"stroke-dasharray": "--"});

        if (this.spike.chart)
            this.spike.update_stats();
    };

    Neuron.prototype.toString = function() {return "N " + this.num; };

    Neuron.prototype.redraw = function() {
        this.soma.attr({fill: "rgb(" + int_map(-1.5,1.5, 0, 255, this.v) +"," + int_map(-1.5,1.5, 255, 0, this.v) +",0)"});
    };

    Neuron.linked = function(n1,n2) {
        for (i in n1.outgoing_links) {
            if (n1.outgoing_links[i].n2 === n2) return true;
        }
        return false;
    };

    Neuron.prototype.remove = function() {
        $$(this.incoming_links).each(function(k,l) { l.remove(); });
        $$(this.outgoing_links).each(function(k,l) { l.remove(); });
        this.spike.neurons.delete_first(this);
        this.soma.remove();
    };

    // serializing and deserializing
    Neuron.save = function(n) {
        var s = {};

        s.num = n.num;
        s.v = n.v; // potential
        s.w = n.w; // stabilizer
        s.i = n.i; // summary external current

        s.pos = n.getPos();

        return s;
    };

    Neuron.load = function(spike, source) {
        var n = new Neuron(spike, source.pos.x, source.pos.y);
        if (source.num)
            n.num = source.num; // We want to clone original numbers so ignore internal Neuron counter if external index is supplied
        n.v = source.v;
        n.w = source.w;
        n.i = source.i;

        return n;
    };

    // Link related
    function Link(spike, n1, n2, w) {
        this.spike = spike; // access to rest links

        this.n1 = n1;
        this.n2 = n2;
        n1.outgoing_links.push(this);
        n2.incoming_links.push(this);

        this.spike.links.push(this);

        this.weight = new ValueRange(0, model_parameters.link_weight_max, w || model_parameters.link_weight);
        this.axon = this.spike.paper.path();
        this.axon.link = this;
        this.axon.node.link = this;

        this.axon.attr({'stroke-width': 5});
        this.axon.attr({path: "M0 0"});

        this.axon.click(function() {this.link.select(); });
        $$(this.axon.node).bind("mousedown", Link.on_mouse_down);
        $$(this.axon.node).mousewheel(Link.on_wheel);

        this.redraw();
    }

    Link.on_mouse_down = function(e) {
        switch(e.which) {
        case 3:
            this.link.remove();
        }
    };

    Link.on_wheel = function(e,d) {
        this.link.weight.move(d);
        return false;
    };

    Link.prototype.select = function() {
        if (Link.selected) {
            Link.selected.axon.attr({"stroke-dasharray": ""});
        }
        Link.selected = this;
        Link.selected.axon.attr({"stroke-dasharray": "-"});
    };

    Link.prototype.remove = function() {
        this.n1.outgoing_links.delete_first(this);
        this.n2.incoming_links.delete_first(this);
        this.spike.links.delete_first(this);

        this.axon.remove();
    };

    Link.prototype.toString = function() { return this.n1 + " -> " + this.n2; };
    Link.prototype.redraw = function() {
        var w = this.axon.paper.width,
            h = this.axon.paper.height;
        this.axon.scale(1.,1.);
        this.axon.attr({path: "M" + this.n1.getPos().scale(w,h) + "L" + this.n2.getPos().scale(w,h)});
        var dist = Pos.dist(this.n1.getPos().scale(w,h), this.n2.getPos().scale(w,h)),
        correction = (dist - this.n1.getSize() - this.n2.getSize()) / dist;
        console.log(correction);
        if (correction < 0)
            correction = 1e-9;
        this.axon.scale(correction,correction);
    };

    // serializing and deserializing
    Link.save = function(l) {
        var s = {};
        s.n1_num = l.n1.num;
        s.n2_num = l.n2.num;
        s.weight = l.weight.valueOf();

        return s;
    };

    Link.load = function(spike, neuro_map, s) { // neuro_map is an assoacitive array from neuron indexes to neurons themselves
        return new Link(spike, neuro_map[s.n1_num], neuro_map[s.n2_num], s.weight);
    };

    function Spike(id) {
        this.neurons = [];
        this.links = [];
        this.tick = 0;

        this.paper = Raphael(id, $$('#'+id).width(), $$('#'+id).height());

        this.free_neuron_index = 0;
        this.selected_neuron = undefined;

        Spike.setup_canvas(this.paper);
        this.chart = undefined; // here later we can attach the chart

        // binding handlers
        var s = this;

        $$(window).focus(function() { s.start_timer(); } );
        $$(window).blur(function() { s.stop_timer(); } );

        $$('#'+id).click(function(e) { s.on_canvas_click(e); } );
        $$('#'+id).bind("contextmenu", function() { return false; } );

        this.start_timer();
    };

    Spike.prototype.on_tick = function() {
        this.tick++;
        for (var i=1;i<=2; i++) {
            $$(this.neurons).each(function(k,n) {n.i_prev = n.i; n.i = 0; });
            $$(this.neurons).each(function(k,n) {n.tick(); });
        }
        $$(this.neurons).each(function(k,n) {n.redraw(); });

        if (this.chart)
            this.chart.update_stats();
    };

    Spike.prototype.start_timer = function() {
        if (!this.timer) {
            var s = this;
            this.timer = setInterval(function() { s.on_tick(); }, display_parameters.tick_interval);
        }
        if (this.chart)
            this.chart.start();
    };

    Spike.prototype.stop_timer = function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
        if (this.chart)
            this.chart.stop();
    };

    // handlers
    Spike.prototype.on_canvas_click = function(e) {
        var target = e.target;

        var x = e.pageX - $$(target).offset().left,
            y = e.pageY - $$(target).offset().top;

        if(target.tagName == "svg") {
            new Neuron(this, x / this.paper.width, y / this.paper.height);
        }
    };

    Spike.setup_canvas =function(paper) {
        var c = paper.circle(0,0,1);
        c.__proto__.getPos = function() {
            return new Pos(this.attr("cx") / this.paper.width, this.attr("cy") / this.paper.height);
        };
        c.__proto__.setPos = function(pos) {
            this.attr({cx: pos.x * this.paper.width, cy: pos.y * this.paper.height});
        };
    };

    // Serializing and deserializing
    Spike.prototype.store = function() {
        var spike = this;
        var state = {};
        state.neurons = [];
        $$(spike.neurons).each(function(k,n) { state.neurons.push(Neuron.save(n)); });

        state.links = [];
        $$(spike.links).each(function(k,l) { state.links.push(Link.save(l)); });

        return state;
    };

    Spike.prototype.restore = function(state) {
        var spike = this;
        $$(spike.neurons).each( function(k,n) { n.remove(); });

        var neuro_map = {}; // assotiation between neuron numbers and objects
        var max_n = 0; // last neuron index
        $$(state.neurons).each( function(k,n) {
            var neuro = Neuron.load(spike, n);
            neuro_map[neuro.num] = neuro;
            if (max_n < neuro.num)
                max_n = neuro.num;
        });
        $$(state.links).each( function(k,l) {
            Link.load(spike, neuro_map, l);
        });

        spike.free_neuron_index = max_n+1;
    };

    return Spike;
};