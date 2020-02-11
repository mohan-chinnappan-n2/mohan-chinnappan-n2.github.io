import { LightningElement, track, api } from 'lwc';

export default class App extends LightningElement {
    @track appName = "FSC-FA-Rollup";
    version = '0.0.1';
    @track appNameVersioned = `${this.appName} - ${this.version}`;
    showVersion = true;

    appNameChange(event) {
        this.appNameVersioned = `${event.target.value} - ${this.version}`;
    }


    contacts = [
        {
            Id: '003171931112854375',
            Name: 'Amy Taylor',
            Title: 'VP of Engineering'
        },
        {
            Id: '003192301009134555',
            Name: 'Michael Jones',
            Title: 'VP of Sales'
        },
        {
            Id: '003848991274589432',
            Name: 'Jennifer Wu',
            Title: 'CEO'
        }
    ];


}
