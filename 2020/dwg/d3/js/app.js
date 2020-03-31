(function () {
    d3.select('#svg').on('click', function () {
        draw('svg');
    });
    d3.select('#canvas').on('click', function () {
        draw('canvas');
    });
    if (d3.resolution() > 1) {
        d3.select('#paper').append('label').html(
                "<input id='canvas-low' name='type' type='radio'><span>canvas low resolution</span>"
        );
        d3.select('#canvas-low').on('click', function () {
            draw('canvas', 1);
        });
    }

    var example = d3.select("#example"),
        width = d3.getSize(example.style('width')),
        height = Math.min(500, width),
        radius = 20,
        area = Math.PI*radius*radius,
        margin = 2*radius,
        text = '';

    var shapes = ['Circle', 'Cross', 'Diamond', 'Square', 'Star', 'Triangle', 'Wye'],
        color = d3.scaleSequential(d3.interpolateViridis),
        N = 20,
        points = d3.range(N).map(function(i) {
        return {
            type: shapes[Math.floor(Math.random()*shapes.length)],
            color: color((i+1)/N),
            x: Math.round(Math.random() * (width - 2*margin) + margin),
            y: Math.round(Math.random() * (height - 2*margin) + margin)
        };
    });

    draw('svg');

    function draw(type, r) {
        example.select('.paper').remove();
        var paper = example
            .append(type)
            .classed('paper', true)
            .style('stroke', '#333')
            .attr('width', width).attr('height', height).canvasResolution(r).canvas(true);

        var marks = d3.symbol().type(function (d) {return d3['symbol' + d.type];}).size(function (d) {return area;});

        paper.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .style("stroke-width", 0)
            .style('fill', '#333')
            .style('fill-opacity', 0.1)
            .on("mousemove.hover", mouseover);

        paper
            .selectAll("path")
            .data(points)
            .enter()
            .append("path")
            .attr("transform", translate)
            .attr("d", marks)
            .style("fill", function (d) {return d.color;})
            .style("stroke-width", 0)
            .on("mouseenter.hover", mouseenter)
            .on("mouseleave.hover", end)
            .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", mouseenter));

        var coord = paper.append('text')
            .text(text)
            .classed('coord', true)
            .style('font-size', '20px')
            .style('text-anchor', 'middle')
            .style('alignment-baseline', 'middle')
            .attr("transform", translate({x: width-100, y: 20}));

        function mouseover () {
            text = d3.event.offsetX + ', ' + d3.event.offsetY;
            coord.text(text);
        }

        function mouseenter () {
            d3.select(this).style('stroke-width', '1px').style("fill", '#fff').style('cursor', 'move');
        }

        function dragstarted () {
            d3.select(this).raise().style('stroke-width', '2px');
        }

        function dragged(d) {
            d.x = d3.event.x;
            d.y = d3.event.y;
            d3.select(this).attr("transform", translate(d));
        }

        function end() {
            var el = d3.select(this),
                d = el.datum();
            el.style("stroke-width", 0).style("fill", d.color).style('cursor', 'default');
        }

        function translate (d) {
            return "translate(" + d.x + "," + d.y + ")";
        }
    }
}());
