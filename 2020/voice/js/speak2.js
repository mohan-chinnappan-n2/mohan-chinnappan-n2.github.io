// greeter mchinnappan (nov-2020)
const queryInfo = () => {
    const query = location.search.substr(1);
    const qresult = {};
    query.split("&").forEach( part => {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
    });
    return qresult;

}

const greetingMessages = {
  "bd":  { msg: "Happy Birthday", audio:"https://raw.githubusercontent.com/mohan-chinnappan-n/thirukkural-songs/master/greetings/Happy_Birthday_To_You_C_Major.mp3"},
  "gm":   { msg: "Greetings", audio:"https://raw.githubusercontent.com/mohan-chinnappan-n/thirukkural-songs/master/greetings/greet-1.mp3"}
};


const getGreetingMessage = () => {
    const q = queryInfo();
    if (q && q.m) {
       const msg = greetingMessages[q.m];
       if (msg) return msg;
    }
}

const getName = () => {
    const q = queryInfo();
    if (q && q.n) {
       return q.n;
    }
}


document.addEventListener('DOMContentLoaded', (event) => {
    const greet= getGreetingMessage();
    if (greet) {
        const msg =  `${greet.msg}${getName() ? ', ' +  getName() :'' }`;
        document.getElementById('greetings').innerHTML =  msg;
        document.getElementById('msgInput').value=  msg;
       document.getElementById('mp3').src =  greet.audio;

    } else {
        const msg =  `${greetingMessages.gm.msg}${getName() ? ', ' +  getName() :'' }`;
        document.getElementById('greetings').innerHTML =  msg;
        document.getElementById('msgInput').value= msg;
        document.getElementById('mp3').src =  greetingMessages.gm.audio;

    }

})
var synth = window.speechSynthesis;

var inputForm = document.querySelector('form');
var inputTxt = document.getElementById('msgInput');
var voiceSelect = document.querySelector('select');

var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');

var voices = [];

function populateVoiceList() {
  voices = synth.getVoices().sort(function (a, b) {
      const aname = a.name.toUpperCase(), bname = b.name.toUpperCase();
      if ( aname < bname ) return -1;
      else if ( aname == bname ) return 0;
      else return +1;
  });
  var selectedIndex = voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
  voiceSelect.innerHTML = '';
  for(i = 0; i < voices.length ; i++) {
    var option = document.createElement('option');
    option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
    
    if(voices[i].default) {
      option.textContent += ' -- DEFAULT';
    }

    option.setAttribute('data-lang', voices[i].lang);
    option.setAttribute('data-name', voices[i].name);
    voiceSelect.appendChild(option);
  }
  voiceSelect.selectedIndex = selectedIndex;
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

function speak(){
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }
    if (inputTxt.value !== '') {
    var utterThis = new SpeechSynthesisUtterance(inputTxt.value);
    utterThis.onend = function (event) {
        //console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    }
    var selectedOption = voiceSelect.selectedOptions[0] ? voiceSelect.selectedOptions[0].getAttribute('data-name') : 'Alex';
    for(i = 0; i < voices.length ; i++) {
      if(voices[i].name === selectedOption) {
        utterThis.voice = voices[i];
        break;
      }
    }
    utterThis.pitch = pitch.value;
    utterThis.rate = rate.value;
    synth.speak(utterThis);
  }
}

inputForm.onsubmit = function(event) {
  event.preventDefault();
  speak();
  inputTxt.blur();
}

pitch.onchange = function() {
  pitchValue.textContent = pitch.value;
}

rate.onchange = function() {
  rateValue.textContent = rate.value;
}

voiceSelect.onchange = function(){
  speak();
}

