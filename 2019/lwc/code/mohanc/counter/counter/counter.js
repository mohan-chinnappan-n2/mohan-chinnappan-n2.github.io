import { LightningElement, track, api } from 'lwc';

export default class Counter extends LightningElement {

    @api item = "fruits";
    @api value = 0;
    
}
