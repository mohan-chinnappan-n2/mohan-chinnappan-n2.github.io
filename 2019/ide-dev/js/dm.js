/*jshint esversion: 6 */

/*

 dm.js

 mohanc
 
*/

 // ------ File Loaders
  // Load text documents

    FileReaderJS.setupInput(document.getElementById('loadObjDocument'), {
      readAsDefault: 'Text',
      on: {
        load: function (event, file) {
         const data = event.target.result.split("\n");
         // remove the last empty item
         data.pop();
         fillObjectSide(data);
        }
      }
    });

    FileReaderJS.setupInput(document.getElementById('loadFileDocument'), {
      readAsDefault: 'Text',
      on: {
        load: function (event, file) {
         const data = event.target.result.split("\n");
         // remove the last empty item
         data.pop();
         fillFileSide(data);
        }
      }
    });

 
    function fillObjectSide(objFields) {
        let ofldsEle = document.getElementById('oflds');

        for (const field of objFields) {
        const liEle = document.createElement('li');
        liEle.setAttribute('class', 'list-group-item');

        const ofDiv = document.createElement('div');
        ofDiv.setAttribute('class', 'col-lg-6 of');
        ofDiv.innerHTML = field;

        const ffInput = document.createElement('input');
        ffInput.setAttribute('class', 'col-lg-6 ff');

        const wrapDiv = document.createElement('div');
        wrapDiv.setAttribute('class', 'row')

        wrapDiv.appendChild(ofDiv);
        wrapDiv.appendChild(ffInput);

        liEle.appendChild(wrapDiv);

        ofldsEle.appendChild(liEle);
      }
    }

    


     // clear automap
    function clearAutomap() {
     const fflds = document.getElementsByClassName('ff'); 
     const oflds = document.getElementsByClassName('of');
     let index = 0;
     for (const ofld of oflds) {
         fflds[index].value = '';
         index++;
     }

    }

    // automap for all the fields in the file
    function doAutomap() {
        // alert('doAutoMap');
         const fileflds =  document.getElementsByClassName('filefld');
         // console.log(fileflds); 
         for (const filefld of fileflds) {
                 automap(filefld.innerHTML);
         }
    }

    // automap a given field in the input file
    function automap(field) {
        // console.log(`field: ${field}`);
        const fflds = document.getElementsByClassName('ff'); 
        const oflds = document.getElementsByClassName('of');
        let index = 0;
        for (const ofld of oflds) {
             // console.log(ofld.innerHTML, field);
            const indexOf = ofld.innerHTML.indexOf(field); 
            // console.log(indexOf);
            if ( indexOf >= 0) {
                 // console.log(`value before: ${fflds[index].value}`);
                // console.log('setting value');
                // console.log(fflds[index]);
                fflds[index].value = field;
                // console.log(`value set: ${index} : ${fflds[index].value}`);

            }
            index++;
        }
     }

     // create a map file in the format of SDL (salesforce data loader)
     function createMapFile() {
         const fflds = document.getElementsByClassName('ff'); 
         const oflds = document.getElementsByClassName('of');
         let sdlStr = "";
         let index = 0;
         for (const ofld of oflds) {
             // console.log(ofld.innerHTML, field);
             const of = ofld.innerHTML;
             const ff = fflds[index].value;
             sdlStr += `${of}=${ff}\n`;
             index++;
         }
         // console.log(sdlStr);
         document.getElementById('mapData').innerHTML = sdlStr;
         document.getElementById('saveMapFileBtn').style.display = '';
         return sdlStr;

         
     }
 

function fillFileSide(fileFields) {
    let ffldsEle = document.getElementById('fflds');

    for (const field of fileFields) {
       const liEle = document.createElement('li');
       liEle.setAttribute('class', 'list-group-item filefld');
       liEle.setAttribute('draggable', 'true');
       liEle.addEventListener('dragstart',  (evt) => {
            const ele = evt.target;
             evt.dataTransfer.setData("text/plain",  ele.innerHTML);
             // console.log(ele.innerHTML);
           }
           , false
       );
       liEle.innerHTML = field;
       ffldsEle.appendChild(liEle);
       // ffldsEle.appendChild(document.createElement('input'));
    }
}

  



function saveMapFile() {
        // Save a map document
            // Save Dialog
            const editor = document.getElementById('mapData')
            let fname = window.prompt("Save as in Downloads folder...");
            
            // Check json extension in file name
            if(fname.indexOf(".")=== -1) {
                fname += ".sdl.txt";
            } else {
                if(fname.split('.').pop().toLowerCase() === "sdl.txt") {
                    // Nothing to do
                } else {
                    fname = fname.split('.')[0] + ".sdl.txt";
                }
            }
            var blob = new Blob([editor.innerHTML], {type: 'text/plain;charset=utf-8'});
            saveAs(blob, fname);
  } 