
// slides.js
// mchinnappan
// jshint esversion:6

let index = 1;
let slides = document.querySelectorAll(".slide");

function clearActives() {
    let tocs = document.getElementsByClassName('toc');
    for (let tocitem of tocs){
        tocitem.classList.remove('tocactive');
    }
}

function setActive() {
  let ele =  this.event.target;
  clearActives();
  ele.parentElement.classList.add('tocactive');
}

// fill the menu items
function fillMenuItems() {
  let container = document.getElementById('mitems');
  let ndx = 1;
  for (let slide of slides) {
    //console.log(slide);
    let li = document.createElement('li');
    if (ndx === 1) {
         li.setAttribute('class', 'list-group-item toc tocactive');
    } else {
         li.setAttribute('class', 'list-group-item toc');
    }
    
    li.setAttribute('id', slide.getAttribute('id') + '_t' );
    li.setAttribute('onclick', 'setActive()');

    let a = document.createElement('a');
    a.setAttribute('href', '#' + slides[ndx-1].id);
    a.text = slide.getAttribute('id');
    li.appendChild(a);

    container.appendChild(li);
    ndx++;
  }
}

// setup menu
fillMenuItems();

// slide nav functions
function gotoSlide(loc) {
  let gotoId = slides[loc-1].id;
  document.location.hash = gotoId;
  clearActives(); 
  let li = document.getElementById(gotoId + '_t');
  li.classList.add('tocactive');
  
}
function nextSlide() {
  if ( (index+1) <= slides.length) {
    index++;
  } else {
    index = 1;
  }
  gotoSlide(index);
}

function prevSlide() {
  if (index > 0) {
    index--;
  } else {
    index = slides.length + 1;
  }

  gotoSlide(index);
}

document.body.onkeyup = function (e) {
  if (e.keyCode == 32) {
    nextSlide();
  }
};