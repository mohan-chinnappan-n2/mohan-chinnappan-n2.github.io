// md content renderer
// mohan chinnappan

const converter = new showdown.Converter({tables: true});
const mdEle = document.getElementById("content");

// read params
const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function (part) {
  var item = part.split("=");
  qresult[item[0]] = decodeURIComponent(item[1]);
});

let url = qresult.f || "help.md";
const c = qresult.c;



let input = "";
if (qresult.c) {
  await navigator.clipboard.readText().then((clipText) => {
    console.log(clipText);
    input = clipText;
    const html = converter.makeHtml(input);
    console.log(html)
    mdEle.innerHTML = html;
    url = "";
  });
} else {
  const mdContent = readURL(url);
  mdContent.then((mdTxt) => {
    const html = converter.makeHtml(mdTxt);
    mdEle.innerHTML = html;
  });
}

let readURL = async (url) => {
  try {
    const dt = new Date();
    if (url.indexOf("?") < 0) url += `?v=${dt.getTime()}`;
    const response = await fetch(`${url}`);
    return await response.text();
  } catch (err) {
    console.log("fetch failed", err);
  }
};

// read file
const readSingleFile = (e) => {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  let contents = "";
  const reader = new FileReader();
  reader.onload = function (e) {
    contents = e.target.result;
    const html = converter.makeHtml(contents);
    mdEle.innerHTML = html;
  };
  reader.readAsText(file);
};

document.getElementById("file-input").onchange = function (e) {
  readSingleFile(e);
};
document.getElementById("file-input").onclick = function (e) {
  readSingleFile(e);
};
