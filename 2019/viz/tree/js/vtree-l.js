/* jslint esversion:6 */

// mohan chinnappan


// tree drawing functions 

// node color provider
var getNodeColor = (d) => {
    if ( d.parent === "null") return 'salmon';
    if ( d.depth === 1)       return 'steelblue';
    if ( d.primary)           return '#ffcc99';
    return '#99ccff';
}
let duration = 750;


    //------- view-source:http://bl.ocks.org/d3noob/raw/8326869/
// household render
var drawHousehold = ( margin, w, h, tdata , settings )  => {

  
  try {

    let width =  w - margin.right - margin.left;
    let height = h - margin.top - margin.bottom;
    

    let svg = d3.select('body').append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`)
               ;

    
    let tree = d3.layout.tree()
                 .size([height, width]);

    let diagonal = d3.svg.diagonal()
                     .projection( (d) =>  [d.x, d.y]);

    // get tree nodes for the given data (treeData[0]) with name, depth, x, y,  parent...
    let nodes = tree.nodes(tdata[0]);
    // console.log(nodes);
    // .reverse();
    // creates source, target,...
    let links = tree.links(nodes);

    // Normalize for fixed-depth - make y as depth*100
    nodes.forEach(function(d) { d.y = d.depth * settings.normalize });

    let i = 0;

    let svgNodes = svg.selectAll("g")
        // introduce node id as current value of i
        .data( nodes, (d) =>  d.id || (d.id = ++i ) )

        .enter()
            // append g container
            // <g class="node" transform="translate(314.2857142857143,100)">
            .append('g')
            .attr('class', 'node')
             
            .attr('transform', (d) => `translate(${d.x},${d.y})` )


        svgNodes
            // a draw circle radius 10
            // <circle r="10" style="fill: rgb(153, 204, 255);">

            .append('circle')
            .attr('r', settings.circleRadius)
            //.append ('rect')
            //.attr('width', settings.circleRadius * 2)
            //.attr('height', settings.circleRadius * 2)
            .style('fill', (d) => getNodeColor(d) )
            .on('click', (d) => alert (d.name) )
            ;
           
    
        svgNodes
           
            // <text y="-18" dy=".35em" text-anchor="middle" style="fill-opacity: 1;">Top Level</text>
            // set y as 18 to write text under the circle , -18 to write above the circle
            .append('text')
            .attr('y', (d) => d.children || d._children ? -settings.labelOffset : settings.labelOffset )
            .attr('dy', '.35em')
            .attr("text-anchor", "middle")
            .style("fill-opacity", 1)
            .text( (d) => d.name +   (d.role !== undefined ? ' : ' + d.role : '') ) 
            ;  

        // links
        let link = svg.selectAll("path")
                .data(links, (d) => d.target.id)
                .enter()
                    .insert("path", "g")
                    .attr("class", "link")
                  
                    .attr("d", diagonal);

       }
       catch (e) {
           alert (e);
       }

     }