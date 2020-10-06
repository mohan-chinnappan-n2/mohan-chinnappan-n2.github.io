import { LightningElement, api } from "lwc";
import { NavigationMixin } from 'lightning/navigation';

// load 3rd party library
import leaflet from "@salesforce/resourceUrl/leaflet";
import { loadStyle, loadScript } from "lightning/platformResourceLoader";

// retrieve data
import getServiceAppointments from "@salesforce/apex/ServiceAppointmentsMapController.getServiceAppointments";

export default class MyMap extends NavigationMixin(LightningElement) {

  @api mapboxToken;

  connectedCallback() {
    Promise.all([
      loadStyle(this, leaflet + "/leaflet.css"),
      loadScript(this, leaflet + "/leaflet.js"),
      getServiceAppointments()
    ]).then(([, , appointments]) => {
      // initialize the library using a reference to the container element obtained from the DOM
      const el = this.template.querySelector("div");
      const mymap = L.map(el).setView([37.7749, -122.4194], 13);

      // Load and display tile layers with your access token
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
        {
          maxZoom: 18,
          id: "mapbox.streets",
          accessToken: this.mapboxToken
        }
      ).addTo(mymap);

      // Add appointments to the map
      for (const { Id, Latitude, Longitude, Description } of appointments) {
        L.marker([Latitude, Longitude])
          .addTo(mymap)
          .bindPopup(
            `<a href="javascript:void(0)" data-record-id="${Id}">${Description}</a>`
          );
      }
    });
  }

  handleclick(event) {
    if (event.srcElement.dataset.recordId) {
      this[NavigationMixin.Navigate]({
        type: "standard__recordPage",
        attributes: {
          recordId: event.srcElement.dataset.recordId,
          objectApiName: 'ServiceAppointment'
        }
      });
    }
  }
}
