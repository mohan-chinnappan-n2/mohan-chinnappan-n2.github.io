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

## The Intune App SDK

-  Available for both iOS and Android, enables your app to support **Intune app protection policies**.

-  When your mobile app has app protection policies applied to it, it can be managed by Intune and is recognized by Intune as a **managed app**

- After your app becomes Intune-managed app, IT administrators can deploy these policies to protect their corporate data within the mobile app.

- Can be used to customize your mobile app behavior to support features that require your app participation



### App protection features

- Control users’ ability to move corporate files
    - IT administrators can control where work **data** in the app can be moved. For instance, they can deploy a policy that disables the app from backing up corporate data to the cloud.

- Configure clipboard restrictions
    - IT administrators can configure the clipboard behavior in Intune-managed apps. For instance, they can deploy a policy to prevent end users from cutting or copying data from the app and pasting into an unmanaged, personal app.

- Enforce encryption on saved data
    - IT administrators can enforce a policy that ensures that data saved to the device by the app is encrypted.

- Remotely wipe corporate data
    - IT administrators can remotely wipe corporate data from an Intune-managed app. This feature is identity-based and will only delete the files associated with the corporate identity of the end user.

- Enforce the use of a managed browser
    - IT administrators can force web links in the app to be opened with the Intune Managed Browser app. This functionality ensures that links that appear in a corporate environment are kept within the domain of Intune-managed apps.

- Enforce a PIN policy
    - IT administrators can require users to sign in with their work account to access the app. 
    - The Intune App SDK uses Azure Active Directory (Identity Provider) to provide a single sign-on (SSO)experience, where the credentials, once entered, are reused for subsequent logins.
- Check device health and compliance
    - IT administrators can a check the health of the device and its compliance with Intune policies before end-users access the app.
    - On iOS, this policy checks if the device has been jailbroken. On Android, this policy checks if the device has been rooted.

- Support multi-identity
    -  Enables coexistence of policy-managed (corporate) and unmanaged (personal) accounts in a single app.
    - The multi-identity feature helps solve the data protection problem that organizations face with store apps that support **both personal and work accounts**.
    - For example, many users configure both corporate and personal email accounts in the Office mobile apps for iOS and Android. When a user accesses data with their corporate account, the IT administrator must be confident that app protection policy will be applied. However, when a user is accessing a personal email account, that data should be outside of the IT administrator's control. The Intune App SDK achieves this by targeting the app protection policy to only the corporate identity in the app.

## Intune App Wrapping Tool for iOS

- Use the  Intune App Wrapping Tool for iOS to enable Intune app protection policies for **in-house iOS apps** without changing the code of the app itself.

- Creates a wrapper around an app
- Once an app is processed, you can change the app's functionality by deploying app protection policies to it.


## For Apps to be released in public app store

- If your app will be released to a public app store, like the Apple App Store or Google Play:
    - You must first register your app with Microsoft Intune and agree to the registration terms. IT administrators can then apply an app protection policy to the managed app, which will be listed as an Intune protected partner app.
