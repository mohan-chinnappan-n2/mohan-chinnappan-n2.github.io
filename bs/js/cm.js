
// read query params

const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function(part) {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
});

let items = document.querySelectorAll('.carousel .carousel-item')
const minPerSlide = qresult.s || 4;
if (items.length < 2) {
    document.getElementById('nb').style.display='none';    
} else {
    document.getElementById('nb').style.display='none2;';    
}

document.getElementById('ns').textContent = `Number of slides in the view: ${minPerSlide}` ;
items.forEach((el) => {

    console.log(el);
    let next = el.nextElementSibling
    for (let i=1; i<minPerSlide; i++) {
        if (!next) {
            // wrap carousel by using first child
        	next = items[0]
      	}
        let cloneChild = next.cloneNode(true)
        el.appendChild(cloneChild.children[0])
        next = next.nextElementSibling
    }
});
