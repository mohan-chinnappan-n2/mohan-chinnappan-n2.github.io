const formatDate = (dt,sep) => {

    const dd = dt.getDate();
    let mm = dt.getMonth() + 1;
    if (mm < 10) mm = `0${mm}`;
    const yy = dt.getFullYear();
    const output = `${yy}${sep}${mm}${sep}${dd}`;
    return output;
}

const events =  [
  {
    title: 'All Day Event',
    start: '2021-08-01'
  },
  {
    title: 'Long Event',
    start: '2021-08-08',
    end: '2021-08-10'
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
    title: 'Birthday Party',
    start: '2021-08-13T07:00:00'
  },
  {
    title: 'Click for Google',
    url: 'http://google.com/',
    start: '2021-08-28'
  }
];

// dom is ready
document.addEventListener('DOMContentLoaded', function() {
    // fetch date from the input
    const startEl = document.getElementById('start');
    const calendarEl = document.getElementById('calendar');
    const dt = formatDate(new Date(), '-');
    startEl.value = dt;

    startEl.addEventListener('change', (event) => {
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: startEl.value,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events
      });
     calendar.render();

    });



   

  });
