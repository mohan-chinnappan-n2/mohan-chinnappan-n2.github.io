import { LightningElement } from 'lwc';

/*
This component contains Bootstrap-styled elements.

To replace SLDS with bootstrap styling in your community:
    1. Go to the Experience Builder settings > Advanced > Edit Head Markup
    2. Remove or comment out the existing stylesheets
    3. Add <link> and <script> tags for bootstrap: https://getbootstrap.com/docs/4.4/getting-started/introduction/#quick-start
    4. Save
    5. Go to settings > Security > Content Security Policy, and set to "Allow inline scripts and access to whitelisted hosts"
    6. Add the domains as trusted sites in settings > Security > Trusted Sites for Scripts, and in CSP Trusted Sites in Salesforce Setup.
    7. If there are any errors under Security > CSP Errors, add them to the whitelist
*/
export default class BootstrapDemoPricing extends LightningElement {}