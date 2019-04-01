 /* seq-app.js 
     mohan chinnappan
     based on work by: Andrew Brampton
 */
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

    Split(["#menu", "#content"], {
      sizes: [55, 45]
    });