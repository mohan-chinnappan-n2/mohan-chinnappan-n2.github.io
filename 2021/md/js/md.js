// md content renderer
// mohan chinnappan


// read params
const query = location.search.substr(1);
    var qresult = {};
    query.split("&").forEach(function(part) {
          var item = part.split("=");
          qresult[item[0]] = decodeURIComponent(item[1]);
    });
 

const url = qresult.f || 'help.md';


let readURL = async (url) => {
  try {
      const dt = new Date();
      if (url.indexOf('?') < 0) url +=`?v=${dt.getTime()}`;
      const response = await fetch(`${url}`);
      return await response.text();
  } catch (err) {
      console.log('fetch failed', err);
  }
}   



const converter = new showdown.Converter();
const mdEle = document.getElementById('content');
const mdContent =  readURL(url);

mdContent.then ( (mdTxt) => {
    const html = converter.makeHtml(mdTxt);
    mdEle.innerHTML = html;
  });


// read file
const readSingleFile = e => {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  let contents = "";
  const reader = new FileReader();
  reader.onload = function(e) {
    contents = e.target.result;
    const html = converter.makeHtml(contents);
    mdEle.innerHTML = html;

  };
  reader.readAsText(file);
}

document.getElementById('file-input').onchange = function(e) {
  readSingleFile(e);
}
document.getElementById('file-input').onclick = function(e) {
  readSingleFile(e);
}


