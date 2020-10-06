import { LightningElement, api, wire, track } from 'lwc';
import getNavigationItems from '@salesforce/apex/NavigationItemsController.getNavigationItems';

export default class NavigationMenu extends LightningElement {

    /**
     * the menuName (NavigationMenuLinkSet.MasterLabel) exposed by the .js-meta.xml
     */
    @api menuName;
    /**
     * the menu items when fetched by the NavigationItemsController
     */
    @track menuItems;
    /**
     * the error if it occurs
     */
    @track error;

    /**
     * the publish status of the communitiy, needed in order to determine from which schema to 
     * fetch the NavigationMenuItems from
     */
    publishStatus;

    /**
     * We use wire and pass it the controller and the arguments that the controller needs. 
     */
    @wire(getNavigationItems, { 
        menuName: '$menuName',
        publishStatus: '$publishStatus'
    })
    wiredMenuItems({error, data}) {
        if (data && !this.menuItems) {
            this.menuItems = data.map((item, index) => {
                return {
                    target: item.Target,
                    id: index,
                    label: item.Label
                }
            });
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.wiredMenuItems = null;
        }
    }

    connectedCallback() {
        // Determine the publish status based on the current location.
        const { location } = window;
        const { href } = location;
        this.publishStatus = href.includes('--preview.') || href.includes('--live.') ? 'Draft' : 'Live';
    }

}