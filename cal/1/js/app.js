const formatDate = (dt,sep) => {

    const dd = dt.getDate();
    let mm = dt.getMonth() + 1;
    if (mm < 10) mm = `0${mm}`;
    const yy = dt.getFullYear();
    const output = `${yy}${sep}${mm}${sep}${dd}`;
    return output;
}


const pdfBtn = document.getElementById('pdf-btn');
const calendarEl = document.getElementById('calendar');


pdfBtn.addEventListener('click', event => {
   html2pdf(calendarEl);
});



const events =  [
  {
    title: 'All Day Event',
    start: '2021-08-01'
  },
  {
    title: 'Work on Whitepapers',
    start: '2021-08-08',
    end: '2021-08-09'
  },
  {
    groupId: '999',
    title: 'Repeating Event',
    start: '2021-08-09T16:00:00'
  },
  {
    groupId: '999',
    title: 'Repeating Event',
    start: '2021-08-16T16:00:00'
  },
  {
    title: 'Conference',
    start: '2021-08-11',
    end: '2021-08-13'
  },
  {
    title: 'Meeting',
    start: '2021-08-12T10:30:00',
    end: '2021-08-12T12:30:00'
  },
  {
    title: 'Lunch',
    start: '2021-08-12T12:00:00'
  },
  {
    title: 'Meeting',
    start: '2021-08-12T14:30:00'
  },
  {
    title: 'Update Media Apps',
    url: 'https://mohan-chinnappan-n2.github.io/media-app.html',
    start: '2021-08-14T07:00:00'
  },
  {
    title: 'Click for home page',
    url: 'https://mohan-chinnappan-n.github.io/',
    start: '2021-08-28'
  }
];


const renderCal = (el, initialDate, events) => {
  const calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    initialDate,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events
  });
 calendar.render();
}

// dom is ready
document.addEventListener('DOMContentLoaded', function() {
    // fetch date from the input
    const startEl = document.getElementById('start');
    const dt = formatDate(new Date(), '-');
    startEl.value = dt;
    renderCal(calendarEl, startEl.value, events);
    startEl.addEventListener('change', (event) => {
      renderCal(calendarEl, startEl.value, events);
    });



   

  });
