// app.js

// mohan chinnappan

// refer: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
// refer: https://www.youtube.com/watch?v=wCwKkT1P7vY

// refer: https://github.com/TomHumphries/InfiniteCanvasWhiteboard/blob/master/index.html

// CANVAS GEOMETRY

// these 2 can be read from url param
const widthPercent = 1.0;
const heightFactor = 2;


const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth * widthPercent;
canvas.height = window.innerHeight * heightFactor;

// CONTEXT

let initBgColor = "white";
let wbContent = [];
let wbIndex = -1;

let shapeSelected = 'freehand';
let isShapeDrawn = false;
let startX = 0;
let startY = 0;

let context = canvas.getContext("2d");
context.fillStyle = initBgColor;
context.fillRect(0, 0, canvas.width, canvas.height);

// DRAWING

let drawColor = "black";
let penThick = 10;
let isDrawing = false;

const getLocation = (event) => {
  return [event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop];
};

const start = (event) => {
  isDrawing = true;
  context.beginPath();
  const loc = getLocation(event);
  startX = loc[0];
  startY = loc[1];
  context.moveTo(loc[0], loc[1]);

  event.preventDefault();
};

const draw = (event) => {
  const loc = getLocation(event);
  if (isDrawing &&  shapeSelected === 'freehand') {

    context.lineTo(loc[0], loc[1]);

    context.strokeStyle = drawColor;
    // line attributes
    context.lineWidth = penThick;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.stroke();
  }
  event.preventDefault();
};

const stop = (event) => {
  const loc = getLocation(event);
  if (isDrawing) {
    if (shapeSelected === "rect" || shapeSelected === 'circle') {
      const width = loc[0] - startX;
      const height = loc[1] - startY;

      // draw a new rect from the start position
      // to the current mouse position
      context.strokeStyle = drawColor;
      // line attributes
      context.lineWidth = penThick;
      context.lineCap = "round";
      context.lineJoin = "round";
      if (shapeSelected === 'rect')  {
          context.strokeRect(startX, startY, width, height);
      }
      else if (shapeSelected === 'circle') {
        // alert('circle');
        context.beginPath();
        const startAngle = 0;
        const endAngle = 2 * Math.PI;
        context.arc(startX, startY, width, startAngle, endAngle);
        context.stroke();


      }  
       
    } else {
      context.stroke();
      context.closePath(); //end the drawing
    }
    isDrawing = false;
  }
  event.preventDefault();

  // for undo feature store the image data
  if (event.type !== "mouseout") {
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    wbContent.push(imgData);
    wbIndex++;
  }
};

canvas.addEventListener("touchstart", start, false);
canvas.addEventListener("touchmove", draw, false);
canvas.addEventListener("touchend", stop, false);

canvas.addEventListener("mousedown", start, false);
canvas.addEventListener("mousemove", draw, false);

canvas.addEventListener("mouseup", stop, false);
canvas.addEventListener("mouseout", stop, false);

// COLORS

// color change handler
const colorElements = document.querySelectorAll(".color");
for (const ele of colorElements) {
  ele.addEventListener("click", (event) => {
    const target = event.target;
    drawColor = target.dataset.color;
  });
}

// color via color selector
const colorSelEle = document.getElementById("color-sel");
colorSelEle.addEventListener("input", (event) => {
  const target = event.target;
  drawColor = target.value;
});

// LINE THICKNESS

const penThickEle = document.getElementById("pen-thick");
penThickEle.addEventListener("input", (event) => {
  const target = event.target;
  penThick = target.value;
});

// CLEAR

const clearBtn = document.getElementById("clear");
const clear = (event) => {
  context.fillStyle = initBgColor;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillRect(0, 0, canvas.width, canvas.height);

  // reset
  wbContent = [];
  wbIndex = -1;
};
clearBtn.addEventListener("click", clear);

// UNDO

const undoBtn = document.getElementById("undo");

const undo = (event) => {
  if (wbIndex <= 0) {
    clear();
  } else {
    wbContent.pop();
    wbIndex--;
    // put n-1 position image
    context.putImageData(wbContent[wbIndex], 0, 0);
  }
};
undoBtn.addEventListener("click", undo);

// SAVE

const renderImage = (base64URL) => {
  const win = window.open();
  win.document.write(
    '<iframe src="' +
      base64URL +
      '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>'
  );
};

const saveBtn = document.getElementById("save");
saveBtn.addEventListener("click", (event) => {
  const imageUrl = canvas.toDataURL("image/png");
  renderImage(imageUrl);
});

// SHAPES

// rect
const rectBtn = document.getElementById("rect");
rectBtn.addEventListener("click", (event) => {
  shapeSelected = "rect";
  isShapeDrawn = false;
});

// freehand
const freehandBtn = document.getElementById("freehand");
freehandBtn.addEventListener("click", (event) => {
  shapeSelected = "freehand";
});

// circle
const circleBtn = document.getElementById("circle");
circleBtn.addEventListener("click", (event) => {
  shapeSelected = "circle";
});