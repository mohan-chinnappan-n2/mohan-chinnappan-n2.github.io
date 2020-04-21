'use strict';

// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
  video: true, 
  audio:true
};

// Video element where stream will be placed.
const localVideo = document.querySelector('video');

// Local stream that will be reproduced on the video.
let localStream;

// Handles success by adding the MediaStream to the video element.
let gotLocalMediaStream = (mediaStream) => {
  localStream = mediaStream;
  // MediaStream {id: "1QUy7hcoB2hOWzdBpZExPU0eOjzTKDcEd8Wx", active: true, onaddtrack: null, onremovetrack: null, onactive: null, …}

  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
let handleLocalMediaStreamError = (error)  => {
  console.log('navigator.getUserMedia error: ', error);
}

// Initializes media stream.
navigator.mediaDevices
.getUserMedia(mediaStreamConstraints)
.then(gotLocalMediaStream)
.catch(handleLocalMediaStreamError);

// stop the video track
document.getElementById('stop').addEventListener('click', (event) => {
  const track = parseInt( event.target.dataset.track);
  // console.log(track);
  //https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
  localStream.getVideoTracks()[track].stop();
});

/*

localStream.getVideoTracks()[0]
=>

MediaStreamTrack {kind: "video", id: "d353a620-a9ac-4c22-a5a9-ce5d12410ea8", label: "FaceTime HD Camera", enabled: true, muted: false, …}
kind: "video"
id: "d353a620-a9ac-4c22-a5a9-ce5d12410ea8"
label: "FaceTime HD Camera"
enabled: true
muted: false
onmute: null
onunmute: null
readyState: "live" //<----
onended: null
contentHint: ""
__proto__: MediaStreamTrack

===============


localStream.getVideoTracks()[0].stop() // will stop the video

MediaStreamTrack {kind: "video", id: "d353a620-a9ac-4c22-a5a9-ce5d12410ea8", label: "FaceTime HD Camera", enabled: true, muted: false, …}
kind: "video"
id: "d353a620-a9ac-4c22-a5a9-ce5d12410ea8"
label: "FaceTime HD Camera"
enabled: true
muted: false
onmute: null
onunmute: null
readyState: "ended" //<----
onended: null
contentHint: ""
__proto__: MediaStreamTrack


===============


with
const mediaStreamConstraints = {
  video: true, 
  audio:true
};


localStream.getAudioTracks()[0]
MediaStreamTrack {kind: "audio", id: "e0f86051-07f1-4a43-988b-fc61e892a7cc", label: "External Microphone (Built-in)", enabled: true, muted: false, …}
kind: "audio"
id: "e0f86051-07f1-4a43-988b-fc61e892a7cc"
label: "External Microphone (Built-in)"
enabled: true
muted: false
onmute: null
onunmute: null
readyState: "live"
onended: null
contentHint: ""
__proto__: MediaStreamTrack


===============

localVideo.attributes

NamedNodeMap {0: autoplay, 1: playsinline, autoplay: autoplay, playsinline: playsinline, length: 2}
length: 2
0: autoplay
1: playsinline
autoplay: autoplay
playsinline: playsinline
__proto__: NamedNodeMap

// changing the video of the localVideo via JS

localVideo.style.width = '100px';



*/