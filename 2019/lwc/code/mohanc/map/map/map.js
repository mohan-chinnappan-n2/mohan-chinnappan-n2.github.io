import { LightningElement, track, api } from 'lwc';
 

export default class App extends LightningElement {

  
    @track mapMarkers = [];
    @track name = 'Location 1';

    loadItems() {
	 
            const Latitude = 42.3140089;
            const Longitude = -71.2504676;

			this.mapMarkers = [{
				location: { Latitude, Longitude },
				title: "Location 1",
				description: `Coords: ${Latitude}, ${Longitude}`
			}];
		
	}
    get cardTitle() {
		return (this.name) ? `${this.name}'s location` : 'Item location';
	}

}
