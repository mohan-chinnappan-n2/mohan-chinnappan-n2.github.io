// uitls.js
// author: mohan chinnappan

Split(["#code", "#content"], {
            sizes: [55, 40]
});


// file management
let getUploadedFile = (event) => {
  const input = event.target;
  if ("files" in input && input.files.length > 0) {
    console.log(input.files[0]);
    placeFileContent(document.getElementById("editor"), input.files[0]);
  }
};
let placeFileContent = (target, file) => {
  readFileContent(file)
    .then((content) => {
      editor.setValue(content);
    })
    .catch((error) => console.log(error));
};

let readFileContent = (file) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

document
  .getElementById("inputfile")
  .addEventListener("change", getUploadedFile);

// save to file
saveSourceToFile = () => {
  //var textToWrite = document.getElementById('textArea').innerHTML;

  var fileContent = editor.getValue();
  var textFileAsBlob = new Blob([fileContent], { type: "text/plain" });
  var fileNameToSaveAsInput = document.getElementById("savefilename").value;
  //console.log('fileNameToSaveAsInput:' , fileNameToSaveAsInput)
  var fileNameToSaveAs = fileNameToSaveAsInput || "myPage.html";

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
};
document.getElementById("save").addEventListener("click", saveSourceToFile);
