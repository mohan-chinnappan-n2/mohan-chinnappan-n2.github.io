import { LightningElement, track, api } from 'lwc';

export default class App extends LightningElement {

    @track greeting = "Hello World from LWC!"

    handleGreetingChange = (event) => {
       this.greeting = event.target.value;
    }

}
