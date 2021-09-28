// input-1.js

(function() {
  var script = document.createElement('script');
  script.src = 'https://unpkg.com/web-vitals/dist/web-vitals.iife.js';
  script.onload = function() {
    // When loading `web-vitals` using a classic script, all the public
    // methods can be found on the `webVitals` global namespace.
    webVitals.getCLS(console.log);
    webVitals.getFID(console.log);
    webVitals.getLCP(console.log);
  }
  document.head.appendChild(script);
}());



console.log(navigator.userAgentData);
// refer: https://codepen.io/kevinpowell/pen/gORbbWr
const colorInput = document.querySelector("input[type=color]");
const colorVariable = "--clr-accent";

colorInput.addEventListener("change", (e) => {
document.documentElement.style.setProperty(
    colorVariable,
    e.target.value
);
});