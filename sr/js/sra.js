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

       video: { cursor: "always"}, // it's only visible while the mouse is in motion
 
       audio: { echoCancellation: true,  noiseSuppression: true,   sampleRate: 44100} // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/noiseSuppression
};

const mimeType = 'video/webm';
let stream = null;
let mediaRecorder = null

async function startCapture(displayMediaOptions) {
  try {
      /*

      // ref: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
      The getDisplayMedia() method is added to the MediaDevices interface. 
      Similar to getUserMedia(), this method creates a promise that resolves with a
       MediaStream containing:
        -  the display area selected by the user, in a format that matches the specified options (displayMediaOptions).
    */

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    const [vtracks] = stream.getVideoTracks();

    const audioStream = await navigator.mediaDevices.getUserMedia({audio: true});
    const [atracks] = audioStream.getAudioTracks();

    const stream2 = new MediaStream( [vtracks, atracks]);

    // workaround in current w3c spec
    // ref: https://stackoverflow.com/questions/61975745/mediarecorder-api-recorder-wont-call-onstop-when-recording-multiple-tracks
    stream.getTracks().forEach((track) =>
      track.addEventListener("ended", () => {
        audioStream.getAudioTracks().forEach((audio) => audio.stop());
        if (mediaRecorder) recorder.stop();
        mediaRecorder = null;
      })
    ); 
    

    handleMediaRecording({stream: stream2, mimeType});

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
        mediaRecorder = new MediaRecorder(stream);
        // console.log(stream);
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
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/onstop

        // https://stackoverflow.com/questions/61975745/mediarecorder-api-recorder-wont-call-onstop-when-recording-multiple-tracks
        mediaRecorder.onstop =  () => {
          // alert ('stop');
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
