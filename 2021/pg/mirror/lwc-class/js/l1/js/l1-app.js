// l1-app.js

// Definitions
class Person {
    constructor (name, city ) {
     this.name = name;
     this.city = city;

    }
}
class Customer extends Person {
    constructor (name, city, amount) {
        super(name, city);
        this.amount = amount;
    }

    deposit(amount) {
     this.amount += amount;
    }
    withDraw(amount) {
     this.amount -= amount;
    }
}


async function  getTime() {
    const timeUrl = 'https://mohansun-rum.herokuapp.com/time';
    const options = { method: 'GET', 
                      headers: { 'Content-Type': 'application/json; charset=utf-8' } 
                    };

    const response = await fetch(timeUrl, options);
    const timeData = await response.json();
    return timeData;

}

async function getFakeData() {
    const recordMetadata = {
        name: 'name',
        email: 'email',
        website: 'url',
        amount: 'currency',
        phone: 'phoneNumber',
        closeAt: 'dateInFuture',
    };
    const amountOfRecords = 10;
    const options = {
         method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            amountOfRecords,
            recordMetadata,
        })
    };
    const fakeDataUrl = 'https://data-faker.herokuapp.com/collection';
    const response = await fetch(fakeDataUrl, options);
    const fakeData = await response.json();
    return fakeData;
}




// Handler
async function  hanldeShowResults(event) {
    // create a new customer
    let myCust = new Customer('Johny Appleseed','New Found Land',  100);

    // deposit money 
    myCust.deposit(200);
    // withdraw some
    myCust.withDraw(50);
    console.log(myCust);

    console.assert(myCust.amount === 250, "Not adding up!");
    const resultsEle = document.getElementById('results');
    resultsEle.value = JSON.stringify(myCust, null, 4);

    const timeData = await getTime();
    console.log(timeData);
    const restDataEle = document.getElementById('restData');
    restDataEle.value = JSON.stringify(timeData, null, 4);

    const fakeData = await getFakeData();
    console.log(fakeData);
    const fakeDataEle = document.getElementById('fakeData');
    fakeDataEle.value = JSON.stringify(fakeData, null, 4);
    
}

// render function code
const codeEle = document.getElementById('code');
codeEle.value = hanldeShowResults.toString();





