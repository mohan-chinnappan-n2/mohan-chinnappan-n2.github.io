// greeter mchinnappan (nov-2020)
const queryInfo = () => {
    const query = location.search.substr(1);
    const qresult = {};
    query.split("&").forEach( part => {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
    });
    return qresult;

}

const greetingMessages = {
  "bd":  { msg: "Happy Birthday to you!", audio:"https://raw.githubusercontent.com/mohan-chinnappan-n/thirukkural-songs/master/greetings/Happy_Birthday_To_You_C_Major.mp3"},
  "gm":   { msg: "Greetings to you!", audio:"https://raw.githubusercontent.com/mohan-chinnappan-n/thirukkural-songs/master/greetings/greet-1.mp3"}
};


const getGreetingMessage = () => {
    const q = queryInfo();
    if (q && q.m) {
       const msg = greetingMessages[q.m];
       if (msg) return msg;
    }
}

const greet= getGreetingMessage();
if (greet) {
    document.getElementById('msg').innerHTML = greet.msg;
    document.getElementById('mp3').src =  greet.audio;
} else {
    document.getElementById('msg').innerHTML = greetingMessages.gm.msg;
    document.getElementById('mp3').src =  greetingMessages.gm.audio;

}




