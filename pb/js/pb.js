
// ref: https://usefulangle.com/post/352/javascript-capture-image-from-camera
// modifcations: mohan chinnappan
let cameraButton = document.querySelector("#start-camera");
let video = document.querySelector("#video");
let clickButton = document.querySelector("#click-photo");
let canvas = document.querySelector("#canvas");

cameraButton.addEventListener('click', async () => {
   	let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
	video.srcObject = stream;
        clickButton.disabled = false;
});

clickButton.addEventListener('click', () => {
   	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
   	let image_data_url = canvas.toDataURL('image/jpeg');
        video.style.display = 'none';
        // user can download the canvas image by right click and download

});
