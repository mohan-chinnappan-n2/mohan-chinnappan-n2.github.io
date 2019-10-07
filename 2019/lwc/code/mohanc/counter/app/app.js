import { LightningElement, track, api } from 'lwc';

export default class App extends LightningElement {

    @track cdata = [
      {name: 'fruits', value : 10},
      {name: 'veg', value : 20}

    ];
}
