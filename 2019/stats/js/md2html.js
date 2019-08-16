// md2html.js
// mohan chinnappan
document.addEventListener('DOMContentLoaded', (event) => {
  const converter = new showdown.Converter();
  mds.forEach((item, ndx) => {
    const mdEle = document.getElementById(item);
    const dataTrim = mdEle.getAttribute('data-trim');
    console.log(dataTrim);
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
