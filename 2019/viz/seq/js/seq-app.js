 /* jslint esversion: 6 */

 /* seq-app.js 
     mohan chinnappan
     based on work by: Andrew Brampton
 */

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

 let params = getQueryParams();
    console.log(params.f);
    //const url =  params.f ;
    const url =  params.f || './seqs/farming.seq.txt';
    //console.log(`url: ${url}`);
    
    let getFile = async (name)  => {
      let response = await fetch(name);
      return await response.text();
    }
    
  

  //========================


    const diagram_div = document.getElementById('diagram');
    const download_link = document.getElementById('download');
    const editorEl = document.getElementById('editor');
    const editor = ace.edit(editorEl);

    const theme_div = document.getElementById('theme');
    const scale_div = document.getElementById('scale');


    function setup_editor() {

      editor.setTheme("ace/theme/crimson_editor");
      editor.getSession().setMode("ace/mode/asciidoc");
      editor.getSession().on('change', _.debounce(on_change, 100));

      let data = getFile(url).then( data => {
       editor.setValue(data);
     });

      download_link.onclick = function (ev) {
        var svg = document.getElementsByTagName('svg')[0];
        var width = parseInt(svg.getAttribute('width'));
        var height = parseInt(svg.getAttribute('height'));
        var data = editor.getValue();
        var xml =
          '<?xml version="1.0" encoding="utf-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"><svg xmlns="http://www.w3.org/2000/svg" width="' +
          width + '" height="' + height + '" xmlns:xlink="http://www.w3.org/1999/xlink"><source><![CDATA[' + data +
          ']]></source>' + svg.innerHTML + '</svg>';

        this.setAttribute("download", "diagram.svg");
        this.setAttribute("href", "data:image/svg+xml," + encodeURIComponent(xml));
      };
      // theme_div.onchange = on_change();

    }

    function on_change() {
      diagram_div.innerHTML = '';
      const theme = theme_div.value;
      const scale = scale_div.value;

      // alert ('onchange ' + theme);
      try {
        var diagram = Diagram.parse(editor.getValue());
        editor.getSession().setAnnotations([]);
        // Clear out old diagram
        diagram_div.innerHTML = '';
        var options = {
          theme: theme,
          scale: scale
        };
        console.log(options);

        // Draw
        diagram.drawSVG('diagram', options);
      } catch (err) {
        var annotation = {
          type: "error", // also warning and information
          column: 0,
          row: 0,
          text: err.message
        };
        if (err instanceof Diagram.ParseError) {
          annotation.row = err.loc.first_line - 1;
          annotation.column = err.loc.first_column;
        }
        editor.getSession().setAnnotations([annotation]);
        throw err;
      }
    }

    on_change();

    setup_editor();

  // file loading 
   
  let getUploadedFile = (event) => {
      const input = event.target;
      if ('files' in input && input.files.length > 0) {
          console.log(input.files[0]);
          placeFileContent( document.getElementById('editor'), input.files[0]);
      }
  }
  let placeFileContent = (target, file) => {
      readFileContent(file).then ( content => {
         editor.setValue(content); 
          //console.log()
      }).catch (error => console.log(error))
  }

  let readFileContent = (file) => {
      const reader = new FileReader();
      return new Promise( (resolve, reject) => {
          reader.onload = event => resolve(event.target.result);
          reader.onerror = error => reject(error);
          reader.readAsText(file);
      });
  };

  document.getElementById('inputfile').addEventListener('change', getUploadedFile);

  // save to file
 function saveSourceToFile() {
  //var textToWrite = document.getElementById('textArea').innerHTML;
  
    var fileContent = editor.getValue();
    var textFileAsBlob = new Blob([ fileContent ], { type: 'text/plain' });
    var fileNameToSaveAsInput = document.getElementById('savefilename').value;
    //console.log('fileNameToSaveAsInput:' , fileNameToSaveAsInput)
    var fileNameToSaveAs =   fileNameToSaveAsInput ||  "myseq.seq.txt";

  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL != null) {
    // Chrome allows the link to be clicked without actually adding it to the DOM.
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  } else {
    // Firefox requires the link to be added to the DOM before it can be clicked.
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();
}
var saveSrcButton = document.getElementById('save');
saveSrcButton.addEventListener('click', saveSourceToFile);







  

    Split(["#menu", "#content"], {
      sizes: [55, 45]
    });