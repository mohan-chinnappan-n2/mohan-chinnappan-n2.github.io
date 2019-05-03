// renderMdFile.js 
// mohan chinnappan
function  renderMdFile(file, ele) {
    var converter = new showdown.Converter();
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
    if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status == 0) {
                var content = rawFile.responseText;
                ele.innerHTML =  converter.makeHtml(content); 
             }
         }
    }
    rawFile.send(null);
}

   // query parm parser
   let getQueryParams = () => {
    const query = location.search.substr(1);
    let result = {};
    query.split("&").forEach(function(part) {
         const item = part.split("=");
         result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
   };

   

