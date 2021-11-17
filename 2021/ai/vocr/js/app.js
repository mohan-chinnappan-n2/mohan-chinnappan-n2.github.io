// app.js



// read query params

const query = location.search.substr(1);
var qresult = {};
query.split("&").forEach(function(part) {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
});
// ?f=filename is the format
const defaultLang = 'en'
const defaultInterval = 1000;

const lang =  qresult.l  ||  defaultLang;
const ocrInterval =  qresult.i  ||  defaultInterval;  


const { createWorker, createScheduler } = Tesseract;


    const scheduler = createScheduler();
    const video = document.getElementById('poem-video');
    const messages = document.getElementById('messages');
    let timerId = null;

    // UTIL function to paint the messages

    const addMessage = (m, bold) => {
      let msg = `<p>${m}</p>`;
      if (bold) {
        msg = `<p class="bold">${m}</p>`;
      }
      messages.innerHTML += msg;
      messages.scrollTop = messages.scrollHeight;
    }


    // OCR
    const doOCR = async () => {
      // Create a canvas
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 360;
      // put the video into this canvas
      c.getContext('2d').drawImage(video, 0, 0, 640, 360);

      // timestamp stuff
      const start = new Date();
      const { data: { text } } = await scheduler.addJob('recognize', c); // OCRing the canvas content
      const end = new Date();

      // time info
      addMessage(`[${start.getMinutes()}:${start.getSeconds()} - ${end.getMinutes()}:${end.getSeconds()}], ${(end - start) / 1000} seconds`);
      // ocr text
      text.split('\n').forEach((line) => {
        addMessage(line);
      });
    };




  


    // BOOTSTRAP

    (async () => {
      addMessage('=== Initializing Tesseract.js... ===');
      for (let i = 0; i < 4; i++) {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage(lang);
        await worker.initialize(lang);
        scheduler.addWorker(worker);
      }
      addMessage('=== Initialization of Tesseract.js done. ===');
      video.addEventListener('play', () => {
        timerId = setInterval(doOCR, ocrInterval);
      });
      video.addEventListener('pause', () => {
        clearInterval(timerId);
      });
      addMessage('=== Now you can play the video. ===');
      video.controls = true;
    })();


