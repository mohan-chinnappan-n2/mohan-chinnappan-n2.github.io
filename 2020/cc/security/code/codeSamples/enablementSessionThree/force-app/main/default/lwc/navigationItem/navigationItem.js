import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class NavigationItem extends NavigationMixin(LightningElement) {

    // the navigationMenuItem from the apex controller, 
    // contains a label and a target.
    @api item = {};

    @track href = 'javascript:void(0);';

    // the Page Reference object used for lightning:navigation
    pageReference;

    connectedCallback() {
        const { type, target, defaultListViewId } = this.item;
        
        // get the correct PageReference object for the nav menu item type
        if (type === 'SalesforceObject') {
            // aka "Salesforce Object" menu item type
            this.pageReference = {
                type: 'standard__objectPage',
                attributes: { 
                    objectApiName: target
                },
                state: {
                    filterName: defaultListViewId
                }
            };
        } else if (type === 'InternalLink') {
            // aka "Community Page" menu item type

            // WARNING: Normally you shouldn't use 'standard__webPage' for internal relative targets, but unfortunately
            // we currently don't have a perfect way of identifying the PageReference type of an InternalLink URL

            // NOTE: there is currently a bug where navigation fails unless you include the community base prefix before the relative URL!
            // As a workaround, we are just parsing the community base prefix from the current URL
            const slashSPrefix = '/s';
            const currPath = window.location.pathname;
            const communityBasePrefix = currPath.substring(0, currPath.indexOf(slashSPrefix, 1) + slashSPrefix.length);

            this.pageReference = {
                type: 'standard__webPage',
                attributes: {
                    url: communityBasePrefix + target 
                }
            };
        } else if (type === 'ExternalLink') {
            // aka "External URL" menu item type
            this.pageReference = {
                type: 'standard__webPage',
                attributes: {
                    url: target
                }
            };
        }

        // use the NavigationMixin from lightning/navigation to generate the URL for navigation. 
        if (this.pageReference) {
            this[NavigationMixin.GenerateUrl](this.pageReference)
                .then(url => {
                    this.href = url;
                });
        }
    }

    handleClick(evt) {
        // use the NavigationMixin from lightning/navigation to perform the navigation.
        evt.stopPropagation();
        evt.preventDefault();
        if (this.pageReference) {
            this[NavigationMixin.Navigate](this.pageReference);
        } else {
            console.log("Navigation menu type not implemented: " + this.item.type);
        }
    }

}