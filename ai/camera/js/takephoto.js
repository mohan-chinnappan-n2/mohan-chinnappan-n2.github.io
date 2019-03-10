// takePhoto.js
// mohan chinnappan 
async function takePhoto(quality) {
      const resultImg = document.getElementById('result');
      resultImg.style.display = 'none'; 

      const captureBtn = document.getElementById('capture');

      const video = document.getElementById('vid');
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
      video.srcObject = stream;
      await video.play();


      // Wait for Capture to be clicked.
      await new Promise( (resolve) => captureBtn.onclick = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getVideoTracks()[0].stop();

      video.remove();
      captureBtn.remove();
      resultImg.style.display = 'block'; 
      

      return canvas.toDataURL('image/jpeg', quality);
    }

let resultEle = document.getElementById('result');
let dataFile =  takePhoto(1.0);
dataFile.then( data =>   resultEle.setAttribute('src', data) );
