// qr-app.js
// mohan chinnappan
// based on the work by: davidshimjs and others

(function() {
var qrcode = new QRCode("qrcode");

// query parm parser
let getQueryParams = () => {
const query = location.search.substr(1);
let result = {};
query.split("&").forEach(function(part) {
     const item = part.split("=");
     result[item[0]] = decodeURIComponent(item[1]);
});
return result;
};

let params = getQueryParams();
  console.log(params.f);
  //const url =  params.f ;
  const text =  params.f || 'An ounce of practice is worth more than tons of preaching. - Mohandas K Gandhi';
  document.getElementById('text').value = text;
  document.getElementById('qtext').innerHTML = text;
  

  //console.log(`url: ${url}`);
  qrcode.makeCode(text); 
  



function makeCode () {		
  var elText = document.getElementById("text");
  
  if (!elText.value) {
      alert("Input a text");
      elText.focus();
      return;
  }
  
  qrcode.makeCode(elText.value);
  document.getElementById('qtext').innerHTML = elText.value;
  
}

// makeCode();

$('#qr').click( function() {
makeCode();
}); 

$("#text").
  on("blur", function () {
      makeCode();
  }).
  on("keydown", function (e) {
      if (e.keyCode == 13) {
          makeCode();
      }
  });



Split(["#menu", "#content"], {
    sizes: [55, 45]
});

})();
