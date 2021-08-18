// author: mohan chinnppan, aug 2021
// ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

// constrol buttons 
const cameraButton = document.querySelector("#start-camera");
const startButton = document.querySelector("#start-record");
const stopButton = document.querySelector("#stop-record");

// video download anchor tag
const downloadLink = document.querySelector("#download-video");

// video ele to display the video
const video = document.querySelector("#video");



// read query params
const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function(part) {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
});
// ?f=filename is the format
const defaultName = 'videoRecording';
const outputFilename =  (qresult.f  ||  defaultName ) + '.webm' ;

// video geometry
const width = 1280;
const height = 720;


let cameraStream = null; // hold the getUserMedia stream
let mediaRecorder = null; // our recorder
let recordedChunks = [];  // we will collect blogs here

// when the user clicks on start camera button
cameraButton.addEventListener('click', async () => {
   	cameraStream = await navigator.mediaDevices.getUserMedia(
        { video: { width, height }, 
         audio: { echoCancellation: true,  noiseSuppression: true}
     });
    video.srcObject = cameraStream;
    
    video.style.display = 'block';
    cameraButton.disabled = true;
    startButton.disabled = false;
});

// when the user clicks on the start recording button
startButton.addEventListener('click', event  => {
     startButton.disabled = true;
     video.style.display = 'block';

     mediaRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
    // event : new recorded video blob available 
    mediaRecorder.addEventListener('dataavailable', event => {
		  recordedChunks.push(event.data); // gather the blobs
    });

    // event : user has clicked the stop recording button, recording stopped & all blobs sent
    mediaRecorder.addEventListener('stop', event => {
    	// create local object URL from the so far recorded video blobs
      const url  = URL.createObjectURL(new Blob(recordedChunks, { type: 'video/webm' }));
      recordedChunks = [] ; // reset it
      downloadLink.href = url;
      downloadLink.download = outputFilename; // download filename

      downloadLink.click();
      startButton.disabled = true;
    });

    // start recording with each recorded blob having 1 second video (1000 ms)
    mediaRecorder.start(1000);
    stopButton.disabled = false;
});

// user has clicked the stop recording button
stopButton.addEventListener('click', () => {
  mediaRecorder.stop(); 
  
  // downloadLink.style.display = 'block';
  stopButton.disabled = true;

 // stop all the tracks in the camera stream 
  cameraStream.getTracks().forEach( track => {
    track.stop();
  });

  cameraButton.disabled = false;
  video.style.display = 'none';


});
