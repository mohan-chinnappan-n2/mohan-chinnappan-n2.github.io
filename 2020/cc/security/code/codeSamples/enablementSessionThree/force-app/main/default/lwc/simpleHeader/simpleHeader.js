import { LightningElement, api } from 'lwc';

export default class SimpleHeader extends LightningElement {
    @api backgroundColor;

    get generatedStyle() {
        return `background-color: ${this.backgroundColor};`;
    }

    handleLogoClick() {
        // do something...
    }

    handleNotificationsClick() {
        // do something...
    }

    handleProfileMenuClick() {
        // do something...
    }
}