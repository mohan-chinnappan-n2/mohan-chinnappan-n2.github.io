/* jshint esversion:6 */
// mohan chinnappan


let renderTree = (stg) => {

    // Get JSON data
    treeJSON = d3.json(stg.treeDataFile,  (error, treeData) => {
        if (error) { alert(error); return; }
        console.log(treeData);

        // size of the diagram
        const viewerWidth = $(document).width();
        const viewerHeight = $(document).height();
        console.log(`w x h: ${viewerWidth} x ${viewerHeight}`);

        let treemap = d3.tree().size([viewerWidth, viewerHeight]);

        //  assigns the data to a hierarchy using parent-child relationships
        let nodes = d3.hierarchy(treeData);

        console.log(nodes);

        // maps the node data to the tree layout
        nodes = treemap(nodes);




    });
};
