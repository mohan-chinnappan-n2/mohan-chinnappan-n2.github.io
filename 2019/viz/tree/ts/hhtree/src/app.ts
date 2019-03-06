import  {select, json, tree, hierarchy, linkHorizontal}  from 'd3';

const svg = select('svg');

const width = document.body.clientWidth;
const height = document.body.clientHeight;
 
svg
    .attr('width', width)
    .attr('height', height)
  .append('rect')
     .attr('width', width)
     .attr('height', height)
     ;

const hhTree = tree()
    .size( [ height, width])
    ;

json('data/hh.json')
    .then (data => {
        console.log(data)
        const root = hierarchy(data);
        const links = hhTree(root).links();

        console.log(links);


    });


     