# Community Cloud Security


## Best Practices
- Determine What Access Your Users Should Have
    - users should only have access to the **minimum amount of data** that they need to interact with your organization.
    - creating a security matrix (granular as possible) that lists out:
        -  all of the internal and external **personas** your organization needs to interact with, 
            - what **data** they need to access 
            -  what they **need to do** with that data. 
- Secure Your Objects and Fields
    - Create profiles for each persona and use Object Level Security and Field Level Security to restrict access to anything that **doesn’t have a Yes** in that matrix.

## Anonymous or Guest Profiles
- Give unauthenticated users access to a community
- Used for the first time someone interacts with your organization## References
    - Be careful to provide the absolute minimum amount of access needed for that initial contact
    - If someone wants to interact with your organization **further**, encourage them to create a profile so their access can be **tracked**.

## Authenticated Profiles
- Community users who have a username and password, and can access additional content in your community after **logging in**.
- These users can be granted additional access, but you should still keep the objects and fields that they have access to as **restrictive** as possible. 
- Should only have access to whatever data is **absolutely required** to engage with your organization.

![Access for Users](https://www.salesforce.org/wp-content/uploads/2019/05/Access-for-users.jpg)

## Secure your Records
- Object and Field Level Security can be used to restrict access to the objects themselves
- You’ll most likely also want to restrict access to certain records
    - Your Community users may be allowed to update their **own contact information** without allowing them to view or update any of your organization’s **other contact records**
- Org wide sharing defaults (OWD)
    - OWDs should never be used to grant Public Access to records associated with an object that contains sensitive data
-  Sharing Rules 
    - make exceptions to them by giving users in specific groups, roles, and territories additional access to certain records.
    - in a partner community when you restrict access to accounts, but still allow each individual partner to access the account records that **they’re responsible** for maintaining.
    - double check any Sharing Rules you create against your security matrix to make sure that you’re only opening records up to the intended groups
- A lot of Child objects are set up to inherit sharing settings from their Parent objects
    -  granting access to records where the contact ID of the logged in community user matches the contact ID referenced on a custom object. 


## Restrict Community Cloud Access via API
- Users who have the API Enabled or APEX REST Services permissions can access your org’s data from outside of the Salesforce UI.
    - This is very useful for integrations and connected applications, but you should assign these permissions sparingly because they can also inadvertently create vulnerabilities
- Enable these permissions via the User Profile, but remember to disable them for Anonymous or Guest Profiles.
- Users with API Access can access any Salesforce API, so consider whitelisting the IP Addresses of the users you give it to in order to prevent access by unauthorized applications.
- In Connected App setting 
    - set the OAuth Policy to “Admin approved users are pre-authorized,”
    - this will limit access to ensure that only people with the profiles or permission sets you specify can access the app.

## Understand the Security Implications of Your Salesforce Account Model
- Bucket Account Model
    - contacts without an account are all assigned to an overall “bucket” account.
    - Since all contacts belong to the same account, they’ll be able to access each other’s data unless you explicitly restrict it by setting **organization-wide defaults to Private** 
        -  creating a **sharing set** that grants access to Community Users with a custom profile based on their Contact record.
- Household Account Model
    -  The contacts from the same household belong to the same account and can access to each others’ data in a community

## Use the Right Community License Type
![License Type](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/community_rollout_impl/community_rollout_impl_sharing/images/8bebef459caf9be2a38e32a1f85ab5ed_community_licenses.png)
- Community License types, like Customer Community Plus Licenses, automatically grant access to certain records
    - For example, with Customer Community Plus Licenses, Case Sharing is turned on by default. 
    - If your organization was using cases prior to enabling Communities and you’re using this license type, then your users will be able to see all of the cases that they’re a contact on in Community Cloud. 
    - This can have privacy implications if a case has multiple contacts.

## Verify Your Community Cloud Security Settings 
- Evaluating the security of your Community Cloud implementation is essential to ensuring your previous work was successful
![Validate UX](https://miro.medium.com/max/652/0*mF7FCqAmhSDfLD0a.png)
### Validate UX
- After configuring Organization-Wide Defaults, Object and Field Level Security, and Sharing Rules and Sets, check the access of each profile and ensure it aligns with your expectations.
- Apex classes can be written using the **without sharing keyword**, which will essentially render all the checks and settings we’ve covered so far **useless**.   

## Portal Health Check
- Run [Portal Health Check](https://help.salesforce.com/articleView?id=security_phc_overview.htm&type=5)
    - Portal health check reports show sensitive user permissions, object permissions, and field permissions granted through profiles, as well as organization-wide sharing settings and sharing rules. 

![phc-1](img/phc-1.png)
![phc-2](img/phc-2.png)
![phc-3](img/phc-3.png)
![phc-4](img/phc-4.png)
![phc-5](img/phc-5.png)

## Health Score
- Run [Health Score](https://help.salesforce.com/articleView?id=security_health_check.htm&type=5)
```
90% and above = Excellent
80%–89% = Very Good
70%–79% = Good
55%–69% = Poor
54% and below = Very Poor
```
- Based on your org health score please take action as shown [here](https://help.salesforce.com/articleView?id=security_health_check_score.htm&type=5)

## Optimizer report
- Run [Salesforce Optimizer App](https://help.salesforce.com/articleView?id=optimizer_kick_off.htm&type=5) 
- Consider running Salesforce Optimizer as part of your monthly maintenance, before installing a new app, before each Salesforce release, or at least once a quarter. 

