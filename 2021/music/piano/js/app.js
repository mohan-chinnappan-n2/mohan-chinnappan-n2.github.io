// app.js

// ref: Caroline Gabriel's work on JS Piano


// KEYS
const keys = document.querySelectorAll(".key");
const note = document.querySelector(".nowplaying");

const playNote = e => {
  const audio = document.querySelector(`audio[data-key="${e.keyCode}"]`);
  const   key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
  if (!key) return;
  const keyNote = key.getAttribute("data-note");
  key.classList.add("playing");
  note.innerHTML = keyNote;
  audio.currentTime = 0;
  audio.play();
}


const removeTransition = e => {
  if (e.propertyName !== "transform") return;
  const ele = e.target;
  ele.classList.remove("playing");
}
keys.forEach(key => key.addEventListener("transitionend", removeTransition));
window.addEventListener("keydown", playNote);



// HINTS
const hintsOn = (e, index) => {
  e.setAttribute("style", "transition-delay:" + index * 50 + "ms");
}
const hints = document.querySelectorAll(".hints");
hints.forEach(hintsOn);



