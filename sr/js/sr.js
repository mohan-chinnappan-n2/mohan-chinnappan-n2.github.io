// Author: Mohan Chinnappan
// Aug 2021

// docs: ref: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API



// read query params

const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function(part) {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
});
// ?f=filename is the format
const defaultName = 'screenRecording'
const outputFilename =  (qresult.f  ||  defaultName ) + '.webm' ;


// dowload to wire up
const downloadLink = document.getElementById('download');

// options and consts
const displayMediaOptions = {
     // MediaTrackConstraints.cursor,  
     //  indicating whether or not the cursor should be included in the captured display surface's stream, 
     //  display surface can be:
     //  - application, browser, monitor or window

       video: { cursor: "motion"}, // it's only visible while the mouse is in motion
 
       audio: { echoCancellation: true,  noiseSuppression: true} // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/noiseSuppression
};

const mimeType = 'video/webm';

async function startCapture(displayMediaOptions) {
  let captureStream = null;
  try {
      /*

      // ref: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
      The getDisplayMedia() method is added to the MediaDevices interface. 
      Similar to getUserMedia(), this method creates a promise that resolves with a
       MediaStream containing:
        -  the display area selected by the user, in a format that matches the specified options (displayMediaOptions).
    */

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
    stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    handleMediaRecording({stream, mimeType});

  } catch(err) {
    alert (err);
    console.error("Error: " + err);
  }


}

// click handling of start button 
const startButton = document.getElementById('start');
startButton.addEventListener('click', e => {
        startCapture();
});


const handleMediaRecording = ({stream, mimeType}) => {
        let recordedChunks = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start(200); // 200: The number of milliseconds to record into each Blob. 
       
        // event handling 
        mediaRecorder.ondataavailable =  event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }

        };

        // when the user clicks stop button 
        //  - create a blob with gathered recordedChunks
        //  - create an object url for that blob
        //  - hang that url to the download link
        //  - auto-click that download link
        mediaRecorder.onstop =  () => {
            const blob = new Blob(recordedChunks, {
                type: mimeType
            });
            recordedChunks = [] ; // reset it
            // create object url for the blob we gathered so far
            const url = URL.createObjectURL(blob);
            downloadLink.href = url; // wire it to the anchor tag href
            downloadLink.download = outputFilename;
            // auto click the the link to start the download
            downloadLink.click();

            window.URL.revokeObjectURL(url); // cleanup

        };
    };

// EOF

