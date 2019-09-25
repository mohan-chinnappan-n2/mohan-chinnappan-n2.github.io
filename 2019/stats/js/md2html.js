// md2html.js
// mohan chinnappan

/* jshint esversion: 6 */


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



const mdElements = document.getElementsByClassName('md');
var mds = [];
for (var i = 0; i < mdElements.length; i++) {
    const ele = mdElements[i];
    mds.push(ele.getAttribute('id'));
};

const mdFileElements = document.getElementsByClassName('md-file');
var fileMds = [];
for (var i = 0; i < mdFileElements.length; i++) {
    const ele = mdFileElements[i];
    fileMds.push(ele.getAttribute('id'));
};

// html file 
const htmlFileElements = document.getElementsByClassName('html-file');
var fileHtmls = [];
for (var i = 0; i < htmlFileElements.length; i++) {
    const ele = htmlFileElements[i];
    fileHtmls.push(ele.getAttribute('id'));
};

fileHtmls.forEach( (id) => {
  const htmlEle = document.getElementById(id);
  const url = htmlEle.getAttribute('data-url');
  const htmlContent =  readURL(url);
  htmlContent.then ( (htmlTxt) => {
    htmlEle.innerHTML = htmlTxt;
  });

});



const converter = new showdown.Converter();

let md2html = (id) => {
  const mdEle = document.getElementById(id);
  const url = mdEle.getAttribute('data-url');
  const mdContent =  readURL(url);
  mdContent.then ( (mdTxt) => {
    const html = converter.makeHtml(mdTxt);
    mdEle.innerHTML = html;
  });
}



fileMds.forEach( (id) => {
    md2html(id);
})

document.addEventListener('DOMContentLoaded', (event) => {
  mds.forEach((item, ndx) => {
    const mdEle = document.getElementById(item);
    const dataTrim = mdEle.getAttribute('data-trim');
    //console.log(dataTrim);
    var text = mdEle.textContent;

    if (dataTrim !== 'false') {
        var trimmedText = [];
        text.split('\n').forEach( (titem, tndx) => {
          trimmedText.push(titem.trim());
        });
       text = trimmedText.join('\n');
    }
    //console.log(text);
    const html = converter.makeHtml(text);
    mdEle.innerHTML = html;
    mdEle.style.display = 'block';

  });

});
