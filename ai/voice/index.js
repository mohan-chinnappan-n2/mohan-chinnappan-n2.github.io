 

let recognizer;

const ul = document.querySelector('#scores');
const uls = document.querySelector('#scoresSorted');
function predictWord() {
 // Array of words that the recognizer is trained to recognize.
 const words = recognizer.wordLabels();
 recognizer.listen(({scores}) => {
   // Turn scores into a list of (score,word) pairs.
   scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));

  // paintScores(scores, ul); 

   // Find the most probable word.
   scores.sort((s1, s2) => s2.score - s1.score);

   paintScores(scores, uls); 


   document.querySelector('#result').textContent = scores[0].word;
 }, {probabilityThreshold: 0.75});

}

function paintScores(s, ulele) {
  ulele.innerHTML = '';
  for (let i = 0; i < s.length; i++) {
   const li = document.createElement('li');
   li.innerHTML = `${s[i].word}: ${s[i].score}`;
   li.setAttribute('class', 'list-group-item');
   ulele.appendChild(li);
 }

}

async function app() {
 recognizer = speechCommands.create('BROWSER_FFT');
 console.log(recognizer.wordLabels());

 await recognizer.ensureModelLoaded();
 const words = recognizer.wordLabels();
 document.querySelector('#knownwords').innerHTML   = `${words.join(' :: ')}`;

 predictWord();
}

app();
