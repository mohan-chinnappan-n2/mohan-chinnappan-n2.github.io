import { LightningElement } from 'lwc';
import qrcode from './qrcode.js';

/*
 LWC for rendering qr code 

 author: mohan chinnappan
 
 */

 
export default class App extends LightningElement {

 

    renderedCallback() {
            const qrc = new qrcode(0, 'H');
            // get the recordId
            let str =  `${this.recordId}`;
            // console.log(`recordid: ${str}`);
            qrc.addData(str);
            qrc.make();
            let ele = this.template.querySelector("div.qrc"); 
            ele.innerHTML = qrc.createSvgTag({});
            
    }

}
