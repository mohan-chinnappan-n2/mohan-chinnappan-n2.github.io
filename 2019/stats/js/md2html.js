// md2html.js
// mohan chinnappan
document.addEventListener('DOMContentLoaded', (event) => {
  const converter = new showdown.Converter();
  mds.forEach((item, ndx) => {
    const mdEle = document.getElementById(item);
    const text = mdEle.textContent.split('\n')
    var trimmedText = [];
    text.forEach( (titem, tndx) => {
      trimmedText.push(titem.trim());
    });
    const html = converter.makeHtml(trimmedText.join('\n'));
    mdEle.innerHTML = html;
    mdEle.style.display = 'block';

  });
});
