import { LightningElement, track, api } from 'lwc';
import fetchDataHelper from './fetchDataHelper';

const columns = [
    { label: 'Label', fieldName: 'name' },
    { label: 'Website', fieldName: 'website', type: 'url' },
    { label: 'Phone', fieldName: 'phone', type: 'phone' },
    { label: 'Balance', fieldName: 'amount', type: 'currency' },
    { label: 'CloseAt', fieldName: 'closeAt', type: 'date' }
];
export default class App extends LightningElement {

   
    @track columns = columns;
    @track data = [];

     async connectedCallback() {
        const data = await fetchDataHelper({ amountOfRecords: 5 });
        this.data = data;
    }



}
