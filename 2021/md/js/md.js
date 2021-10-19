// md.js
// mohan chinnappan
// md content renderer



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





