import { select, json, tree, hierarchy } from 'd3';
var svg = select('svg');
var width = document.body.clientWidth;
var height = document.body.clientHeight;
svg
    .attr('width', width)
    .attr('height', height)
    .append('rect')
    .attr('width', width)
    .attr('height', height);
var hhTree = tree()
    .size([height, width]);
json('data/hh.json')
    .then(function (data) {
    console.log(data);
    var root = hierarchy(data);
    var links = hhTree(root).links();
    console.log(links);
});
//# sourceMappingURL=app.js.map