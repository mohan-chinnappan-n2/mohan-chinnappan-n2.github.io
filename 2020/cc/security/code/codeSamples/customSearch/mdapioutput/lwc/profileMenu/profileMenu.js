import { LightningElement, track } from 'lwc';
import getUserDisplayName from '@salesforce/apex/applauncher.IdentityHeaderController.getUserDisplayName';
import getLogoutUrl from '@salesforce/apex/applauncher.IdentityHeaderController.getLogoutUrl';
import getLoginUrl from '@salesforce/apex/system.Network.getLoginUrl';
import isGuestUser from '@salesforce/user/isGuest';
import communityId from '@salesforce/community/Id';

/**
 * Simple custom profile menu that displays the name of the logged in user and a logout link,
 * or an option to login if guest user.
 */
export default class ProfileMenu extends LightningElement {
    @track
    state = {
        loginLabel: 'Login',
        logoutLabel: 'Logout',
        isLoggedIn: false,
        loggedInUserName: '',
        networkId: communityId,
    };

    async setUserDetail() {
        const userName = await getUserDisplayName({});
        if (userName) {
            this.state.loggedInUserName = userName;
        }
    }

    async setNetworkId() {
        this.state.networkId = communityId;
    }

    async initAsync() {
        this.setNetworkId();
        if (isGuestUser === false) {
            this.state.isLoggedIn = true;
            this.setUserDetail();
        } else {
            this.state.isLoggedIn = false;
        }
    }

    connectedCallback() {
        this.initAsync();
    }

    async handleLogin() {
        if (!this.state.isLoggedIn) {
            const loginUrl = await getLoginUrl({ networkId: this.state.networkId });
            if (loginUrl) {
                window.location.replace(loginUrl);
            }
        }
    }

    async handleLogout() {
        if (this.state.isLoggedIn) {
            const logoutUrl = await getLogoutUrl({});
            let url = window.location.origin;
            if (logoutUrl) {
                url += logoutUrl;
            }
            window.location.replace(url);
        }
    }
}