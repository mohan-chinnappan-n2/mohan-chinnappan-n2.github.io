import { LightningElement, track } from 'lwc';
import frozenLabel from '@salesforce/label/c.lwrTestLabel'; 

export default class LabelCmp extends LightningElement {
  @track label = frozenLabel;
}