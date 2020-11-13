
// sample error page - mohan chinnappan (nov-2020)
const queryInfo = () => {
    const query = location.search.substr(1);
    const qresult = {};
    query.split("&").forEach( part => {
        const item = part.split("=");
        qresult[item[0]] = decodeURIComponent(item[1]);
    });
    return qresult;

}

const errorMessages = {
  
  "e100": "Duplicate User",
  "e200": "Invalid User",
};


const getErrorMessage = () => {
    const q = queryInfo();
    if (q && q.err) {
       const msg = errorMessages[q.err];
       if (msg) return  `${q.err}: ${msg}`;
       else return  'All Good!';
    }
}

const em = getErrorMessage();
if (em) {
    document.getElementById('err').innerHTML = em;
}
