//app.js


const encode = str => {
    return encodeURIComponent(str.trim());
}

const decode = str => {
    return decodeURIComponent(str.trim());
}


const inputEle = document.getElementById('input');
const outputEle = document.getElementById('output');

const encodeBtn = document.getElementById('encode');
const decodeBtn = document.getElementById('decode');

encodeBtn.addEventListener('click', event => {
   const input = inputEle.value;
   const output = encode(input);
   outputEle.value = output;
});

decodeBtn.addEventListener('click', event => {
    const input = inputEle.value;
    const output = decode(input);
    outputEle.value = output;
 });




 