//app.js
// mohan chinnappan
// refer MDN for docs


// elements

const inputEle = document.getElementById("input");
const speakBtn = document.getElementById("encode");

var pitch = document.querySelector("#pitch");
var pitchValue = document.querySelector(".pitch-value");
var rate = document.querySelector("#rate");
var rateValue = document.querySelector(".rate-value");

const voiceSelect = document.getElementById("voices");


let voices = [];

// let us get the voices supported
const getVoices = () => {
  let selectedIndex =
    voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;

  voices = speechSynthesis.getVoices();
  for (const i in voices) {
    const voice = voices[i];
    const option = document.createElement("option");
    option.textContent = voice.name + " (" + voice.lang + ")";

    if (voice.default) {
      option.textContent += " -- DEFAULT";
    }

    option.setAttribute("data-lang", voice.lang);
    option.setAttribute("data-name", voice.name);

    voiceSelect.appendChild(option);
  }
  voiceSelect.selectedIndex = selectedIndex;
};

speechSynthesis.onvoiceschanged = getVoices;



// speak function takes in a string
const speak = (str) => {
  let utterance = new SpeechSynthesisUtterance(str);
  utterance.pitch = pitch.value;
  utterance.rate = rate.value;

  
  const selectedOption = voiceSelect.selectedOptions[0].getAttribute(
    "data-name"
  );
  for (i = 0; i < voices.length; i++) {
    if (voices[i].name === selectedOption) {
        utterance.voice = voices[i];
      break;
    }
  }
  speechSynthesis.speak(utterance);
};



// event handlers
voiceSelect.onchange = function () {
  speak(inputEle.value);
};

speakBtn.addEventListener("click", (event) => {
  const input = inputEle.value;
  speak(input);
});

pitch.onchange = function () {
  pitchValue.textContent = pitch.value;
};

rate.onchange = function () {
  rateValue.textContent = rate.value;
};
