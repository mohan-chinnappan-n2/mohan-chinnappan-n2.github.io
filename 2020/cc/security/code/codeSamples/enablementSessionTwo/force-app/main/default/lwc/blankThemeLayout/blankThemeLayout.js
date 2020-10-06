import { LightningElement, api } from 'lwc';

/**
 * @slot header
 * @slot footer
 * @slot default
 */
export default class blankThemeLayout extends LightningElement {
    @api backgroundColor = '#fff';

    renderedCallback() {
        this.template.querySelector(".container").style.backgroundColor = this.backgroundColor;
    }
}