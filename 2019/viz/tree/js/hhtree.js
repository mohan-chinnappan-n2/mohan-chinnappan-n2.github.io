/* jshint esversion:6 */
// mohan chinnappan
// portions Copyright (c) 2013-2016, Rob Schmuecker

/*

The panning functionality can certainly be improved in my opinion and I would be thrilled to see better solutions contributed.

One can do all manner of housekeeping or server related calls on the drop event to manage a remote tree dataset for example.

Dragging can be performed on any node other than root (flare).
Dropping can be done on any node.

Panning can either be done by dragging an empty part of the SVG around or dragging a node towards an edge.

Zooming is performed by either double clicking on an empty part of the SVG or by scrolling the mouse-wheel.
To Zoom out hold shift when double-clicking.

Expanding and collapsing of nodes is achieved by clicking on the desired node.

The tree auto-calculates its sizes both horizontally and vertically so it can adapt between 
many nodes being present in the view to very few whilst making the view managable and pleasing on the eye.

*/

let renderTree = (stg) => {

    // Get JSON data
    treeJSON = d3.json(stg.treeDataFile,  (error, treeData) => {
        if (error) { alert(error); return; }

        let zoomMax =  stg.zoomMax;

        // Calculate total nodes, max label length
        let totalNodes = 0;
        let maxLabelLength = 0;
        // variables for drag/drop
        let selectedNode = null;
        let draggingNode = null;
      
        // Misc. variables
        let i = 0;
        const duration = stg.transitionDuration;

        let root;

        // size of the diagram
        const viewerWidth = $(document).width();
        const viewerHeight = $(document).height();
        console.log(`viewerWidth; ${viewerWidth},  viewerHeight: ${viewerHeight}`);

        let tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

        // define a d3 diagonal projection for use by the node paths later on.
        let diagonal = d3.svg.diagonal().projection( (d) =>  [d.y, d.x] );

        // A recursive helper function for performing
        //  totalNodes, maxLabelLength calculation
        // by walking through all nodes
        let visit = (parent, visitFn, getChildrenFn) => {
            if (!parent) return;
            visitFn(parent);
            var children = getChildrenFn(parent);
            if (children) {
                var count = children.length;
                for (let ndx = 0; ndx < count; ndx++) {
                    visit(children[ndx], visitFn, getChildrenFn);
                }
            }
        }

        // Call visit function to establish maxLabelLength and TotalNodes
        visit(treeData, (d) => { totalNodes++; maxLabelLength = Math.max(d.name.length, maxLabelLength); }, 
                        (d) => d.children && d.children.length > 0 ? d.children : null
        );
        console.log(`totalNodes: ${totalNodes}, maxLabelLength: ${maxLabelLength}`);


        // sort the tree according to the node names
        let sortTree = () => tree.sort( (a, b) =>  b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1  );
        // Sort the tree initially incase the JSON isn't in a sorted order.
        // sorting turned off
        if (stg.enableSorting) sortTree();

        // TODO: Pan function, can be better implemented.

        let pan = (domNode, direction) => { 
            var speed = stg.panSpeed;
            if (panTimer) {
                clearTimeout(panTimer);
                translateCoords = d3.transform(svgGroup.attr("transform"));
                console.log(`direction: ${direction}`);
                if (direction === 'left' || direction === 'right') {
                    translateX = direction === 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                    translateY = translateCoords.translate[1];
                } else if (direction === 'up' || direction === 'down') {
                    translateX = translateCoords.translate[0];
                    translateY = direction === 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
                }
                scaleX = translateCoords.scale[0];
                scaleY = translateCoords.scale[1];
                scale = zoomListener.scale();
                svgGroup.attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);
                // svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
                d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
                zoomListener.scale(zoomListener.scale());
                zoomListener.translate([translateX, translateY]);
                panTimer = setTimeout(function() {
                    pan(domNode, speed, direction);
                }, 50);
            }
        };

        // Define the zoom function for the zoomable tree

        let zoom =() => 
            svgGroup.attr("transform", `translate(${d3.event.translate}) scale(${d3.event.scale})`);
        
        // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
        var zoomListener = d3.behavior.zoom().scaleExtent([ zoomMax.x, zoomMax.y ]).on("zoom", zoom);

        let initiateDrag = (d, domNode) => {
            draggingNode = d;
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
            d3.select(domNode).attr('class', 'node activeDrag');

            svgGroup.selectAll("g.node").sort( (a, b) => { // select the parent and sort the path's
                if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
                else return -1; // a is the hovered element, bring "a" to the front
            });
            // if nodes has children, remove the links and nodes
            if (nodes.length > 1) {
                // remove link paths
                links = tree.links(nodes);
                nodePaths = svgGroup.selectAll("path.link")
                    .data(links, function(d) {
                        return d.target.id;
                    }).remove();
                // remove child nodes
                nodesExit = svgGroup.selectAll("g.node")
                    .data(nodes, function(d) {
                        return d.id;
                    }).filter(function(d, i) {
                        if (d.id == draggingNode.id) {
                            return false;
                        }
                        return true;
                    }).remove();
            }

            // remove parent link
            parentLink = tree.links(tree.nodes(draggingNode.parent));
            svgGroup.selectAll('path.link').filter(function(d, i) {
                if (d.target.id == draggingNode.id) {
                    return true;
                }
                return false;
            }).remove();

            dragStarted = null;
        };


        // define the baseSvg, attaching a class for styling and the zoomListener
        let baseSvg = d3.select(stg.container).append("svg")
            .attr("width", viewerWidth)
            .attr("height", viewerHeight)
            .attr("class", "overlay")
            .call(zoomListener);

        // Append a group which holds all nodes and which the zoom Listener can act upon.
        let svgGroup = baseSvg.append("g");




        // Define the drag listeners for drag/drop behaviour of nodes.
        dragListener = d3.behavior.drag()
            .on("dragstart", function(d) {
                if (d == root) { return; }
                dragStarted = true;
                nodes = tree.nodes(d);
                d3.event.sourceEvent.stopPropagation();
                // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
            })
            .on("drag", function(d) {
                if (d == root) {
                    return;
                }
                if (dragStarted) {
                    domNode = this;
                    initiateDrag(d, domNode);
                }

                // get coords of mouseEvent relative to svg container to allow for panning
                relCoords = d3.mouse($('svg').get(0));
                if (relCoords[0] < stg.panBoundary) {
                    panTimer = true;
                    console.log('panning-left');
                    pan(this, 'left');
                } else if (relCoords[0] > ($('svg').width() - stg.panBoundary)) {

                    panTimer = true;
                    pan(this, 'right');
                } else if (relCoords[1] < stg.panBoundary) {
                    panTimer = true;
                    pan(this, 'up');
                } else if (relCoords[1] > ($('svg').height() - stg.panBoundary)) {
                    panTimer = true;
                    pan(this, 'down');
                } else {
                    try {
                        clearTimeout(panTimer);
                    } catch (e) {

                    }
                }

                d.x0 += d3.event.dy;
                d.y0 += d3.event.dx;
                var node = d3.select(this);
                node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
                updateTempConnector();
            }).on("dragend", function(d) {
                if (d == root) {
                    return;
                }
                domNode = this;
                if (selectedNode) {
                    // now remove the element from the parent, and insert it into the new elements children
                    var index = draggingNode.parent.children.indexOf(draggingNode);
                    if (index > -1) {
                        draggingNode.parent.children.splice(index, 1);
                    }
                    if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                        if (typeof selectedNode.children !== 'undefined') {
                            selectedNode.children.push(draggingNode);
                        } else {
                            selectedNode._children.push(draggingNode);
                        }
                    } else {
                        selectedNode.children = [];
                        selectedNode.children.push(draggingNode);
                    }
                    // Make sure that the node being added to is expanded so user can see added node is correctly moved
                    expand(selectedNode);
                    sortTree();
                    endDrag();
                } else {
                    endDrag();
                }
            });

        let endDrag = () => {
            selectedNode = null;
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
            d3.select(domNode).attr('class', 'node');
            // now restore the mouseover event or we won't be able to drag a 2nd time
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
            updateTempConnector();
            if (draggingNode !== null) {
                update(root);
                centerNode(draggingNode);
                draggingNode = null;
            }
        }

        // Helper functions for collapsing and expanding nodes.
        let collapse = (d) => {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        };
        let expand = (d) => {
            if (d._children) {
                d.children = d._children;
                d.children.forEach(expand);
                d._children = null;
            }
        };

        var overCircle = (d) => {
            selectedNode = d;
            updateTempConnector();
        };
        var outCircle = (d) => {
            selectedNode = null;
            updateTempConnector();
        };

        // Function to update the temporary connector indicating dragging affiliation
        var updateTempConnector = () => {
            var data = [];
            if (draggingNode !== null && selectedNode !== null) {
                // have to flip the source coordinates since we did this for the existing connectors on the original tree
                data = [{
                    source: {
                        x: selectedNode.y0,
                        y: selectedNode.x0
                    },
                    target: {
                        x: draggingNode.y0,
                        y: draggingNode.x0
                    }
                }];
            }
            // console.log(`data for templink: ${JSON.stringify(data)}`);
            var link = svgGroup.selectAll(".templink").data(data);

            link.enter().append("path")
                .attr("class", "templink")
                .attr("d", d3.svg.diagonal())
                .attr('pointer-events', 'none');

            link.attr("d", d3.svg.diagonal());

            link.exit().remove();
        };

        // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

        function centerNode(source) {
            scale = zoomListener.scale();
            console.log(`scale: ${scale}`);
            x = -source.y0;
            y = -source.x0;
            x = x * scale + viewerWidth / 2;
            y = y * scale + viewerHeight / 2;
            d3.select('g').transition()
                .duration(duration)
                .attr("transform", `translate(${x}, ${y}) scale(${scale})`);
            zoomListener.scale(scale);
            zoomListener.translate([x, y]);
        }

        // Toggle children function
        let toggleChildren  = (d) => {
            // console.log('toggleChildren');
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            return d;
        };

        // Toggle children on click.
        let click = (d) => {
            if (d3.event.defaultPrevented) return; // click 
            // alert('clicked');
            d = toggleChildren(d);
            update(d);
            centerNode(d);
        };

        //=========== update ================

        let update = (source) => {
            // Compute the new height, function counts total children of root node and sets tree height accordingly.
            // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
            // This makes the layout more consistent.
            let levelWidth = [1];
            let childCount = (level, n) => {
                if (n.children && n.children.length > 0) {
                    if (levelWidth.length <= level + 1) { levelWidth.push(0); console.log(levelWidth); }

                    levelWidth[level + 1] += n.children.length;
                    n.children.forEach( (d) => childCount(level + 1, d) );
                }
            };

            childCount(0, root);
            console.log(`levelWidth: ${levelWidth}, max: ${d3.max(levelWidth) }`);

            let newHeight = d3.max(levelWidth) * stg.pixelsPerLine;  
            console.log(newHeight, viewerWidth);
            tree = tree.size([newHeight, viewerWidth]);

            // Compute the new tree layout.
            let nodes = tree.nodes(root).reverse();
            let links = tree.links(nodes);

            // Set widths between levels based on maxLabelLength.
            nodes.forEach( (d) => d.y = (d.depth * (maxLabelLength * stg.factorWidthBetweenLevels)) ); //e.g. maxLabelLength * 10px
                // alternatively to keep a fixed scale one can set a fixed depth per level
                // Normalize for fixed-depth by commenting out below line
                // d.y = (d.depth * 500); //500px per level.

            // Update the nodes…
            node = svgGroup.selectAll("g.node")
                  .data(nodes, (d) =>  d.id || (d.id = ++i) );

            // Enter any new nodes at the parent's previous position.
            let nodeEnter = node.enter().append("g")
                .call(dragListener)
                .attr("class", "node")
                .attr("transform", function(d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
                .on('click', click);

            nodeEnter.append("circle")
                .attr('class', 'nodeCircle')
                .attr("r", 0)
                .style("fill", function(d) {
                    return d._children ? stg.nodeColorWithChildren : stg.nodeColorWithoutChildren;
                });

            nodeEnter.append("text")
                .attr("x", (d) => d.children || d._children ? -stg.nodeTextOffset  :  stg.nodeTextOffset  )
                .attr("dy", ".35em")
                .attr('class', 'nodeText')
                .attr("text-anchor", (d) => d.children || d._children ? "end" : "start" )
                .text( (d) => `${d.name}` )
                .style("fill-opacity", 0 )
                ;

            // phantom node to give us mouseover in a radius around it
            nodeEnter.append("circle")
                .attr('class', 'ghostCircle')
                .attr("r", stg.dragTargetCircleRadius)
                .attr("opacity", 0.2) // change this to zero to hide the target area
            .style("fill", stg.dragTargetCircleColor)
                .attr('pointer-events', 'mouseover')
                .on("mouseover", (node) =>  overCircle(node) )
                .on("mouseout", (node)  =>  outCircle(node)  )
                ;

            // Update the text to reflect whether node has children or not.
            node.select('text')
                .attr("x", (d) =>  d.children || d._children ? -stg.nodeTextOffset :  stg.nodeTextOffset  )
                .attr("text-anchor", (d) => d.children || d._children ? "end" : "start" )
                .text( (d) => `${d.name }` )
                ;
            

            // Change the circle fill depending on whether it has children and is collapsed
            node.select("circle.nodeCircle")
                .attr("r", 4.5)
                .style("fill", (d) => d._children ? stg.nodeColorWithChildren : stg.nodeColorWithoutChildren )
                ;

            // Transition nodes to their new position.
            let nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", (d) => `translate(${d.y},${d.x})`);

            // Fade the text in
            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            let nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", (d) => `translate(${source.y},${source.x})`)
                .remove();

            nodeExit.select("circle")
                .attr("r", 0);

            nodeExit.select("text")
                .style("fill-opacity", 1);

            // Update the links…
            let link = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("d", function(d) {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    };
                    return diagonal({
                        source: o,
                        target: o
                    });
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", (d) => {
                    let o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach( (d) => { d.x0 = d.x; d.y0 = d.y; } );

        }; // update(source)


        //----------------------------

    
        //console.log(svgGroup);

        // Define the root
        root = treeData;
        root.x0 = viewerHeight / 2;
        root.y0 = 0;

        // Layout the tree initially and center on the root node.
        //console.log(root);
        update(root);
        centerNode(root);
    });
}
