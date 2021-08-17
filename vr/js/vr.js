const cameraButton = document.querySelector("#start-camera");
const video = document.querySelector("#video");
const startButton = document.querySelector("#start-record");
const stopButton = document.querySelector("#stop-record");
const downloadLink = document.querySelector("#download-video");

// ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

let cameraStream = null;
let mediaRecorder = null;
let blobsRecorded = [];

cameraButton.addEventListener('click', async () => {
   	cameraStream = await navigator.mediaDevices.getUserMedia(
        { video: { width: 1280, height: 720 }, 
         audio: { echoCancellation: true,  noiseSuppression: true}
     });
    video.srcObject = cameraStream;

    cameraButton.disabled = true;
    startButton.disabled = false;

});

startButton.addEventListener('click', event  => {
  startButton.disabled = true;
  video.style.display = 'block';


    mediaRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });

    // event : new recorded video blob available 
    mediaRecorder.addEventListener('dataavailable', event => {
		  blobsRecorded.push(event.data);
    });

    // event : recording stopped & all blobs sent
    mediaRecorder.addEventListener('stop', event => {
    	// create local object URL from the so far recorded video blobs
    	let video_local = URL.createObjectURL(new Blob(blobsRecorded, { type: 'video/webm' }));
      downloadLink.href = video_local;
      startButton.disabled = false;
    });

    // start recording with each recorded blob having 1 second video (1000 ms)
    mediaRecorder.start(1000);
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
  mediaRecorder.stop(); 
  
  downloadLink.style.display = 'block';
  stopButton.disabled = true;

  cameraStream.getTracks().forEach( track => {
    track.stop();
  });

  cameraButton.disabled = false;
  video.style.display = 'none';


});
