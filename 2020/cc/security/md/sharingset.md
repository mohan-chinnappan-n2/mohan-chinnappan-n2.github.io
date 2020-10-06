## External OWD
- ![e owd](img/cc-eowd-1.png) 
- ![e owd 2](img/c-eowd-2.png) 


## Sharing Set (CC, CC+, PC, Profile Based)

- External users are created in association with Accounts (for internal users, roles are associated with User)
- A sharing set grants community or portal users access to any record associated with **an account or contact that matches the user’s account or contact**. 
- You can also grant access to records **via access mapping** in a sharing set. 
![direct lookup](img/cc-ss-case-1.png)
- Access mappings support **indirect lookups** from the user and target record to the account or contact. 
![indirect lookup](img/cc-ss-case-2.png)
- For example, grant community or portal users **access to all cases related to an account that’s identified on the users’ contact records**.
![cc accounts](img/cc-accounts-1.png)
- ![role in cc](img/cc-role-1.png)
- Can have up to 3 roles (less is better here for performance reasons)
- ![role in cc 2](img/cc-role-2.png)
- ![role in cc 3](img/cc-role-3.png)
- Only one sharing set per object per profile
### Key points about Account Roles (in CC+ and PC only) for Business Accounts only
- Account Roles are created with your first community user
- Default: One Role per Account
- Specific to Accounts
- Default: 50K roles
- Max: 500K roles 

### References
- [Set Up Sharing Sets](https://help.salesforce.com/articleView?id=networks_setting_light_users.htm&type=5)
- [Create Community Users and a Sharing Set](https://trailhead.salesforce.com/content/learn/modules/community_rollout_impl/community_rollout_impl_sharing)


## Sharing Using Customer Community Licenses
- do not have roles within Salesforce
- can’t take advantage of role-based sharing (sharing via role hierarchies)
- can see only their own records, such as the cases they file with support. They can’t see anyone else’s cases in the community.
- Customer Community License holders can access records associated with their accounts or contacts by using **sharing sets**.

## Share Group
![Share Group](img/cc-share-group.png)
- Associated to a Sharing Set
- Allows you to share records owned by Customer Community License holders with **internal and external users** in your community.
- Record access via a role hierarchy, criteria-based sharing rules, manual sharing, team sharing) are **not available** for the Customer Community License because they require a role within the Salesforce hierarchy. 
- Share groups fill in the gap by letting you open up record access of records owned by Customer Community License holders.


### Videos
- [Who Sees What in Communities Series](https://salesforce.vidyard.com/watch/bLE3QNRSej2iasw9vvc6Tk)
