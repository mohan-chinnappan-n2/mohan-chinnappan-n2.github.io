import { LightningElement, api } from "lwc";
import isGuest from "@salesforce/user/isGuest";
import basePath from "@salesforce/community/basePath";

export default class Logout extends LightningElement {

    /**
     * the display text for the logout link
     */
    @api logoutText;

    get isGuest() {
        return isGuest;
    }

    get logoutLink() {
        const sitePrefix = basePath.replace(/\/s$/i, ""); // site prefix is the community basePath without the trailing "/s"
        return sitePrefix + "/secur/logout.jsp";
    }
}
