import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class SearchBar extends NavigationMixin(LightningElement) {
    @api searchPlaceholder = "Search...";

    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            const queryTerm = evt.target.value;
            this.navigateToSearch(queryTerm);
        }
    }

    navigateToSearch(queryTerm) {
        // Navigate to search page using lightning/navigation API: https://developer.salesforce.com/docs/component-library/bundle/lightning:navigation/documentation
        this[NavigationMixin.Navigate]({
            type: 'standard__search',
            attributes: {},
            state: {
                term: queryTerm
            }
        });
    }

}