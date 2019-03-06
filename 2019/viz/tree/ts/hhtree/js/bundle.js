(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3')) :
    typeof define === 'function' && define.amd ? define(['d3'], factory) :
    (global = global || self, factory(global.d3));
}(this, function (d3) { 'use strict';

    var svg = d3.select('svg');
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;
    svg
        .attr('width', width)
        .attr('height', height)
        .append('rect')
        .attr('width', width)
        .attr('height', height);
    var hhTree = d3.tree()
        .size([height, width]);
    d3.json('data/hh.json')
        .then(function (data) {
        console.log(data);
        var root = d3.hierarchy(data);
        var links = hhTree(root).links();
        console.log(links);
    });

}));
