
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
  let select = document.getElementById('outline');

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

    // select2
    let opt = document.createElement('option');
    opt.setAttribute('value', slide.getAttribute('id') );
    opt.text = slide.getAttribute('id') ; 
    select.appendChild(opt);

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
  const SPACE = 32;
  if (e.keyCode === SPACE) {
    nextSlide();
  }
};

// select2 

$('#outline').select2({
    placeholder: 'Select a topic'
  });

$('#outline').change(function(e) {
    let value = e.target.value;
    document.location.hash = value;
    
    clearActives(); 
    let li = document.getElementById(value + '_t');
    li.classList.add('tocactive');
    li.focus();

});

$(function () {
    $('#help').tooltip({ placement: 'bottom', width: "300px"});
});

// pdf print

 document.getElementById('printpdf').addEventListener('click', () => {
        console.log('pdf print click');
        const activeSlideId = document.querySelector('ol#mitems.list-group>li.list-group-item.tocactive>a').innerText;
        const element = document.getElementById(activeSlideId);
        console.log(element);
        html2pdf(element);
   });


