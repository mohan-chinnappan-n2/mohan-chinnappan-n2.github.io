## Actions need to enable Edge for your org 
### End Users
- Move is seamless for your end users and no actions are required from them. They keep using the same URLs to access your org, Salesforce Sites, or Communities. 
### Administrators of Salesforce orgs
- Ensure your org is using a **My Domain**
- When setting a **My Domain name**, please use the same My Domain name between your production org and its sandbox orgs. Salesforce does not enforce this naming consistency today, but it may in a future release.
- If your corporate network settings or email security filters restrict access to IP ranges or addresses, please ensure that you include our current ranges. All of our current IP ranges are available in the article [What are the Salesforce IP Addresses & Domains to whitelist?](https://help.salesforce.com/articleView?id=000321501&type=1)
- Activate these critical updates **if needed**:
    1. [Stabilize URLs for Visualforce, Experience Builder, Site.com Studio, and Content Files (Update, Postponed)](https://releasenotes.docs.salesforce.com/en-us/summer20/release-notes/rn_security_domains_stabilize_vf_urls.htm)
    2. [Stabilize the Hostname for My Domain URLs in Sandboxes (Update, Enforced)](https://releasenotes.docs.salesforce.com/en-us/summer20/release-notes/rn_security_domains_stabilize_mydomain_cruc.htm) 

### Open a support case
- Open a support case to request Edge migration
    
