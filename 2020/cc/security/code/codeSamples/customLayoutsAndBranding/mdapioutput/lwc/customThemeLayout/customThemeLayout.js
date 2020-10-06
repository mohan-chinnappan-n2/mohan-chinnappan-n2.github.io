import { LightningElement, api } from 'lwc';

/**
 * @slot header
 * @slot footer
 */
export default class CustomThemeLayout extends LightningElement {
    @api backgroundColor = '#fff';

    renderedCallback() {
        this.template.querySelector(".container").style.backgroundColor = this.backgroundColor;
    }
}