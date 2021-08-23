 
    // simple editor based on the famous medium editor
    // Aug 2021
    // mohan chinnappan
    
    const editor = new MediumEditor('.editable');
    const outputFilename = 'editor';
    
    const editorToPrint = document.getElementById('editor');
    const pdfBtn = document.getElementById('pdf-btn');

    pdfBtn.addEventListener('click', event => {
       html2pdf(editorToPrint);
    });
    
    const htmlBtn = document.getElementById('html-btn');
    const downloadLink = document.getElementById('download');


    htmlBtn.addEventListener('click', event => {
      const htmlContent =  editorToPrint.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      // create object url for the blob we gathered so far
      const url = URL.createObjectURL(blob);
      downloadLink.href = url; // wire it to the anchor tag href
      downloadLink.download = outputFilename + '.html';
      // auto click the the link to start the download
      downloadLink.click();
    });
