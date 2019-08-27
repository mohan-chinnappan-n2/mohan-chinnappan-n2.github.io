## What is Microsoft Intune?

![Intune 1](img/intune-2.png)

Microsoft Intune is a cloud-based service in the **enterprise mobility management (EMM)** space that helps enable your **workforce to be productive** while keeping your **corporate data protected**. 

- Intune simplifies BYOD (employees use of personal devices to access corporate data) and mobile device management
- Manages personal devices in a corporate environment giving employees access to corporate resources on their own (BYOD)  mobile devices
-  Ensures devices and apps are compliant with **company security requirements**
- IT administrator can create a corporate security compliance policy from the **Intune management console**
    - Apply that corporate security compliance policy to the enrolled devices
- Integrates closely with other MS EMS (Enterprise Mobility + Security) components like Azure Active Directory  (Azure AD) for **identity and access control**  and Azure Information Protection for **data protection**.


## Intune Architecture

![Intune Arch](img/intunearchitecture_wh.svg)


## How Intune  device management works?

- Uses the protocols or APIs that are available in the **mobile operating systems** (like iOS, Android) to accomplish:
    - **Enrolling** devices into management so your IT department has an inventory of devices that are accessing corporate service
    - Configuring devices to ensure they meet **company security and health standards**
    - Providing **certificates and Wi-Fi/VPN profiles** to access corporate services
    - **Reporting** on and measuring device compliance to corporate standards
    - Removing corporate data from managed devices ( for example when the employees leaves the enterprise)
    - Integrates with Azure AD (Identity Provider) to enable a broad set of access control scenario


### Example
 You can require a mobile device to be compliant with corporate standards that you define in Intune before the device can access a corporate service like Exchange. 

 Likewise, you can lock down the corporate service to a specific set of mobile apps. 
    - You can lock down Exchange Online to only be accessed by Outlook or Outlook Mobile.


## Intune App Management

- Assign
    - Assigning mobile apps to employees

- Configure
    - Configuring apps with standard settings that are used when the app runs

- Control
    - Controlling how corporate data is used and shared in mobile apps

- Report 
    - Reporting on mobile app inventory
 
- Update
    - Updating the configured apps

- Remove
   - Removing corporate data from mobile apps

- Track
    - Tracking mobile app usage

## Intune app security via app protection policy 

- Keeping personal information isolated from corporate IT awareness - so end user maintains control and privacy over their personal data.


- Restricting the actions users can take with corporate information such as copy, cut/paste, save, and view
- Removing corporate data from mobile apps, also known as selective wipe or **corporate wipe**
- App protection policy uses Azure AD identity to isolate corporate data from personal data
- Data that is accessed using corporate credentials will be given additional corporate protections.

### Example
 When a user logs on to their device with their corporate credentials, their corporate identity allows them to access data that is denied to their personal identity. As that corporate data is used, app protection policies control how it is saved and shared.

 Those same protections are not applied to data that is accessed when the user logs on to their device with their personal identity.

  In this way, IT has control of corporate data while the end user maintains control and privacy over their personal data.


  ## Enterprise mobility management (EMM) with and without device enrollment

  ### Example
  A device enrolled in MDM may have "open-in" protections provided by the mobile operating system. "Open-in" protection is a feature of Apple's iOS that restricts you from opening a document from one app, like Outlook, into another app, like Word, unless both apps are managed by the same MDM provider. 


  ## Key features
- An integrated console for all your Enterprise Mobility + Security (EMS) components
- An HTML-based console built on web standards
- Microsoft Graph API support to automate many actions
- Azure Active Directory (AD) groups to provide compatibility across all your Azure applications
- Support for most modern web browsers


