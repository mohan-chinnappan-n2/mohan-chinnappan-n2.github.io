import { LightningElement, track, api } from 'lwc';

export default class App extends LightningElement {

    @track _selected = [];

    @track options = [
         
            { label: 'அறத்துப்பால்( Virtue )',  value: 'அறத்துப்பால் ( Virtue )', content: 'அறத்துப்பால் content goes here' },
            { label: 'பொருட்பால்( Polity )',  value: 'பொருட்பால் ( Polity )', content: 'பொருட்பால் content goes here' },
            { label: 'காமத்துப்பால்(  Love  )', value: 'காமத்துப்பால் (  Love  )', content: 'காமத்துப்பால் content goes here' }
          
    ];

     handleChange(e) {
        this._selected = e.detail.value;
    }

    get selected() {
        return this._selected.length ? this._selected : 'none';
    }


}
