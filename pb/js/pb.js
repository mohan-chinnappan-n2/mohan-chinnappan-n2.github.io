

// Author: Mohan Chinnappan
// Aug 2021

// docs: ref: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API


const cameraButton = document.querySelector("#start-camera");
const clickButton = document.querySelector("#click-photo");
const stopButton = document.querySelector("#stop-camera");

const canvas = document.querySelector("#canvas");
const video = document.querySelector("#video");
let stream = null;

// read query params

const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function(part) {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
});
// ?f=filename is the format
const defaultName = 'myPhoto'
const outputFilename =  (qresult.f  ||  defaultName ) + '.jpg' ;


// dowload to wire up
const downloadLink = document.getElementById('download');


cameraButton.addEventListener('click', async () => {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
	video.srcObject = stream;
        clickButton.disabled = false;
        stopButton.disabled = true;
        cameraButton.disabled = true;
        video.style.display = 'block';

});

clickButton.addEventListener('click', () => {
   	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg');
        downloadLink.href = url; // wire it to the anchor tag href
        downloadLink.download = outputFilename;
        // auto click the the link to start the download
        downloadLink.click();
        video.style.display = 'none';
        // user can download the canvas image by right click and download
        stopButton.disabled = false;

});
stopButton.addEventListener('click', () => {
        console.log(stream.getTracks().length);
        stream.getTracks()[0].stop();
        clickButton.disabled = true;
        stopButton.disabled = true;
        cameraButton.disabled = false;

});




