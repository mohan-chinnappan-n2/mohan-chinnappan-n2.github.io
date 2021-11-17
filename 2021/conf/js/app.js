// app.js


// references
// https://webrtc.org/getting-started/overview
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
// https://mac-blog.org.ua/webrtc-one-to-one-without-signaling-server
// https://medium.com/av-transcode/what-is-webrtc-and-how-to-setup-stun-turn-server-for-webrtc-communication-63314728b9d0

// COTURN (TURN server - mac)
// - https://formulae.brew.sh/formula/coturn

// Heroku
// - https://elements.heroku.com/buttons/hashobject/twilio-stun-turn

// node.js TURN
// - https://github.com/Atlantis-Software/node-turn

// 
let channel = null;

let messagesEle= document.getElementById('messages');

let createdOfferEle = document.getElementById('createdOffer');
let remoteOfferEle = document.getElementById('remoteOffer');

let createdAnswerEle = document.getElementById('createdAnswer');
let remoteAnswerEle = document.getElementById('remoteAnswer');


// post into our messages area
const postMessage = msg => {
    messagesEle.value = msg; 
}

// CONNECTION Object

/*

Connections between two peers are represented by the RTCPeerConnection interface. 
Once a connection has been established and opened using RTCPeerConnection:
 - media streams (MediaStreams) and/or
 -  data channels (RTCDataChannels) 
 can be added to the connection.

*/
const connection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

// HANDLE ondatachannel
connection.ondatachannel = event => {
  channel = event.channel;
  channel.onmessage = (event) => postMessage(event.data);
}


// CONNECTION STATE
connection.onconnectionstatechange = event => {
  document.getElementById("connectionState").innerText =
    connection.connectionState;
}

connection.oniceconnectionstatechange = event => {
  document.getElementById("iceConnectionState").innerText =
    connection.iceConnectionState;
}


// CREATE OFFER
async function step_1_initiator_create_offer() {
  channel = connection.createDataChannel("data");
  // channel.onopen = event => console.log('onopen', event)
  // channel.onmessage = event => console.log('onmessage', event)
  channel.onmessage = (event) => postMessage(event.data);

 
  // create offer and handle onicecandidate event
  const offer = await connection.createOffer();

  connection.onicecandidate = (event) => {
    // create the offer and unhide the textarea with the offer so
    //  we can copy and paste into the other end (peer)
    if (!event.candidate) {
        createdOfferEle.value = JSON.stringify( connection.localDescription);
        createdOfferEle.hidden = false;
    }
  }

  // set the offer as the connection's local description
  await connection.setLocalDescription(offer);
}


// ACCEPT THE OFFER
async function step_2_accept_remote_offer() {
  const offer = JSON.parse(remoteOfferEle.value);
  // set the received offer as the connection's remote description
  await connection.setRemoteDescription(offer);
}

// STEP-3 CREATE ANSWER
async function step_3_create_answer() {
  // create answer and handle onicecandidate event
  const answer = await connection.createAnswer();
  connection.onicecandidate = (event) => {
    // create the answer and unhide the textarea with the answer so
    //  we can copy and paste into the other end (initiator)
    if (!event.candidate) {
         createdAnswerEle.value = JSON.stringify( connection.localDescription);
         createdAnswerEle.hidden = false;
    }
  }
 // set the answer as the connection's local description
  await connection.setLocalDescription(answer);
}


// STEP-4 ACCEPT ANSWER
async function step_4_accept_answer() {
  const answer = JSON.parse(remoteAnswerEle.value);
  // set the received answer as the connection's remote description
  await connection.setRemoteDescription(answer);
}

// CONNECTION ESTABLISHED - LET US SEND MESSAGES
async function send_text() {
  const text = document.getElementById("send-msg").value;
  // send to the connection's dataChannel (channel)
  channel.send(text);
}
