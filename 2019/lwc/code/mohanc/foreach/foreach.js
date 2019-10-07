import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {

    @track mapItems = [
        { name: 'Asia', wiki: 'https://en.wikipedia.org/wiki/Asia'},
        { name: 'South Asia', wiki: 'https://en.wikipedia.org/wiki/South_Asia'},
        { name: 'India', wiki: 'https://en.wikipedia.org/wiki/India'},

    ];

    @track icons = [
        {name: 'utility:settings', label: 'Settings'},
        {name: 'utility:adduser', label: 'Add User'},
        {name: 'utility:delete', label: 'Delete'},
        {name: 'utility:save', label: 'Save'},
        {name: 'utility:bookmark', label: 'Bookmark'},
        {name: 'utility:zoomin', label: 'Zoom in'},
        {name: 'utility:zoomout', label: 'Zoom out'}


    ];

    @track clickedIconLabel;

     handleIconClick(event) {
        this.clickedIconLabel = event.target.alternativeText;
    }

   @track clickedMenuItem;

     handleMenuClick(event) {
        this.clickedMenuItem = event.target.label;
    }

}
