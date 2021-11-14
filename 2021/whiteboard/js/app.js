// app.js

// refer: https://www.youtube.com/watch?v=wCwKkT1P7vY


// CANVAS GEOMETRY
const widthPercent = .8;

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * widthPercent;
canvas.height = window.innerHeight ;

// CONTEXT

let initBgColor = 'white';
let wbContent = [];
let wbIndex = -1;

let context = canvas.getContext('2d');
context.fillStyle = initBgColor;
context.fillRect (0, 0, canvas.width, canvas.height );

// DRAWING

let drawColor = 'black';
let penThick = 10;
let isDrawing = false;


const getLocation = event => {
    return [event.clientX - canvas.offsetLeft,  event.clientY - canvas.offsetTop];
}

const start = event => {
    isDrawing = true;
    context.beginPath();
    const loc = getLocation(event);
    context.moveTo(loc[0], loc[1]);

    event.preventDefault();
}

const draw = event => {
    const loc = getLocation(event);

    if (isDrawing) {
        context.lineTo(loc[0], loc[1] );

        context.strokeStyle = drawColor;
        // line attributes
        context.lineWidth = penThick;
        context.lineCap = "round";
        context.lineJoin = "round";

        context.stroke();
    }
    event.preventDefault();

    
}

const stop = event => {
    if (isDrawing) {
        context.stroke();
        context.closePath(); //end the drawing
        isDrawing = false;
    }
    event.preventDefault();

    // for undo feature store the image data
    if (event.type !== 'mouseout') {
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height); 
        wbContent.push(imgData);
        wbIndex++;
    }


}

canvas.addEventListener('touchstart', start, false);
canvas.addEventListener('touchmove', draw, false);
canvas.addEventListener('touchend', stop, false);


canvas.addEventListener('mousedown', start, false);
canvas.addEventListener('mousemove', draw, false);

canvas.addEventListener('mouseup', stop, false);
canvas.addEventListener('mouseout', stop, false);


// COLORS

// color change handler
const colorElements = document.querySelectorAll('.color');
for (const ele of colorElements) {
    ele.addEventListener('click', event => {
        const target = event.target;
        drawColor = target.dataset.color;;
    })
}

// color via color selector
const colorSelEle = document.getElementById('color-sel');
colorSelEle.addEventListener('input', event => {
    const target = event.target;
    drawColor = target.value;

    
});

// LINE THICKNESS

const penThickEle = document.getElementById('pen-thick');
penThickEle.addEventListener('input', event => {
    const target = event.target;
    penThick = target.value;
});


// CLEAR

const clearBtn = document.getElementById('clear');
const clear = event => {
    context.fillStyle = initBgColor;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);

    // reset
    wbContent = [];
    wbIndex = -1;


}
clearBtn.addEventListener('click', clear );


// UNDO

const undoBtn = document.getElementById('undo');

const undo = event => {
    if (wbIndex <= 0) {
        clear();
    } else {
        wbContent.pop();
        wbIndex--;
        // put n-1 position image
        context.putImageData(wbContent[wbIndex], 0, 0);
    }
}
undoBtn.addEventListener('click', undo );



// SHAPES

drawRect = (x, y, w, h) => {
    context.beginPath();
    context.rect(x, y, w, h);
    context.stroke();
}


// SAVE 

const  renderImage = base64URL => {
    const win = window.open();
    win.document.write('<iframe src="' + base64URL  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}


const saveBtn =  document.getElementById('save');
saveBtn.addEventListener('click', event => {
    const imageUrl = canvas.toDataURL("image/png");
    renderImage(imageUrl);

})




