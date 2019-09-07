# Salesforce App

- Uses the Lightning Platform
-  Lightning platform considers the Salesforce mobile app to be a connected app.
    - Connected app is an external application that integrates with Salesforce through APIs.
    - Uses OAuth to verify both the Salesforce user and the external application.
    -  Salesforce app collects the user’s credentials, which are then sent to the Salesforce server. The server returns a token that is used by the mobile app to establish the user’s mobile session. 

- App logic and database storage provided by Salesforce’s hosted app servers and client apps
- Has
    - Salesforce app server
    - Client app or mobile web (browser) on the handheld mobile device
        -  communicates across the wireless network to display a subset of the user’s Salesforce data on the handheld device. 
        -  pulls feed data on demand to the mobile device
    -  Provides a very high quality of service and a productive working experience for the end user
- Supported operating systems are:
    - Apple iOS 
    - Google Android
- Provides sandboxed environment for a user to access Salesforce data from a mobile device
![sanboxed](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_compliance/images/f5a3eef0704b7482b373fddfda779523_salesforce1_security_sandbox.png)
    - Sandboxing is a security technique the mobile OS employs to restrict and isolate apps so they can’t share data with each other.
    - Mobile apps also have to explicitly ask for permission to get access to device features, like the calendar, camera, or microphone.
    - When the Salesforce app is installed on a device, the OS prompts the user to grant a handful of permissions. 
    - Org Admin can manage user access, even if the mobile device belongs to the user.
    - Org Admin can edit profile and permission sets to revoke access to any user through the admin console
    - The app provides access to data and functions based on the core permissions and rights defined for each user by their Org admin
    - Mobile users are never able to view or access more than their permissions allow.
-  The permissions requested vary for each OS

    - **Salesforce for iOS** : OS requests permission when the app needs access to each these items. **The user can approve or deny the request**:
        - Contacts
        - Location
        - Photo Library
        - Camera
        - Microphone
        - Speech Recognition
        - Calendars

    - **Salesforce for Android**:
        - Read-Only Contacts
        - Access Network State (WiFi or Cellular)
        - Read Phone State
        - Vibrate, Wake, and Lock
        - GPS Location (Coarse and Fine)
        - Authentication of Accounts
        - Internet
        - Write External Storage
        - Push Messaging


## Communication Security

- Uses SSL/TLS v1.2 for Over-The-Air (OTA) communication encryption
-  All Salesforce OAuth authorization endpoints are HTTPS only

## Authentication
- All components of Salesforce require user authentication at the point and time of access.
- Salesforce utilizes OAuth2.0 for authentication through username/password or SSO (single sign-on) credentials
### OAuth Pairing
- During initial login, the device is **uniquely identified and paired** with the mobile user’s account using the OAuth 2.0 protocol
-  All requests to the Salesforce service are made using the **OAuth token established through the pairing**
created during activation
- Password not stored in the mobile device
    - After initial login, there is no exchange of a password in the communication between the mobile client and the Salesforce server
    - For this reason, the Salesforce password is not stored on the device and is not required even when the password is changed or has expired
    - A user obtains an **access token and refresh token** after successfully completing the OAuth User-Agent authentication
        -  A user can use the refresh token to get a new access token (session ID)
- Logout
    - Upon logout, the OAuth access and refresh tokens are **revoked**, and the user set **passcode is wiped** (if passcode is enabled by org admin)
    - The user is re-prompted to enter the username/password and reset the passcode.

-  Refresh token expiration policies
    - never expires
    - expires immediately 
    - expires if it isn’t used for an amount of defined time (hours/days/months)
    - expires in defined amount of time (hours/days/months), regardless of use
- Access token expiration
    - Default access token expiration schedule is set at 2 hours
    - Can be as short as 15 minutes or as long as 24 hours
- Access Token Storage
<table>
    <tr>
        <th>App</th>
        <th>Encryption and storage location</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td> AES-256-bit key and 128-bit Initialization Vector.
            Encryption keys are secure random-generated 256-bit key and 128-bit Initialization Vector.
            The access token is stored in a <b>secured keychain</b>.
        </td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td>
            PBKDF2 produced AES-256 encrypted key derived from device unique Android ID and 
            randomly generated string. 
            The access token is stored in Android’s <b> encrypted AccountManager</b>.
        </td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>
            Never stored on the mobile device. The mobile browser app requires a user to re-enter
the username/password to obtain a new access token.
        </td>
    </tr>
</table>

- Refresh Access Token Storage
<table>
    <tr>
        <th>App</th>
        <th>Encryption and storage location</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td> AES-256-bit key and 128-bit Initialization Vector.
            Encryption keys are secure random-generated 256-bit key and 128-bit Initialization Vector.
            The refresh  token is stored in a <b>secured keychain</b>.
        </td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td>
            PBKDF2 produced AES-256 encrypted key derived from device unique Android ID and 
            randomly generated string. 
            The refresh token is stored in Android’s <b> encrypted AccountManager</b>.
        </td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>
            Never stored on the mobile device. The mobile browser app requires a user to re-enter
the username/password to obtain a new access token.
        </td>
    </tr>
</table>

### Single Sign On (SSO)
-  Allows network users to access all authorized network resources without having to log in separately to
each resource. 
- Allows orgs to validate username/password against their user database or other client apps rather than
having separate username/password managed by Salesforce

#### Federated Authentication Support
- Salesforce doesn’t validate a user’s password. Instead, Salesforce verifies an assertion in the
HTTP POST request, and allows single sign-on if the **assertion is true**. 
- This is the **default** form of SSO

#### Delegated Authentication Support
-  Salesforce does not validate a user’s password. Instead, Salesforce **makes a Web services call**
to a **customer org**  to establish authentication credentials for the user. 
- Admins must request delegated authentication support to be enabled by Salesforce.

### Certificates and Keys
 -  Used for signatures that verify a request is coming from a customer org
 -  Used for authenticated SSL communications with an external web site, or when using a customer org as an Identity Provider
 - Needed to generate a Salesforce certificate and key pair if they’re working with an external website that wants verification that a request is coming from a Salesforce org 
 - 2 types of Certs
    - A self-signed certificate is signed by Salesforce. Not all external websites accept self-signed certificates.
    - A CA-signed certificate is signed by an external certificate authority (CA). 
        - Most external websites accept CA-signed certificates. 
        - Customers must first generate the **certificate signing request (CSR)** to send to a CA, and then import the signed version of the certificate before they can use it

### Identity Providers (IdP) and Service Providers
 - IdP 
    - trusted provider that enables a customer to use single sign-on to access other websites.
    -  Customers can enable Salesforce as an identity provider (IdP), then define one or more service providers, so their users can access other apps directly from Salesforce using SSO.
        -  This requires Salesforce certificate and key pair that is signed by an external certificate authority
        - Salesforce uses the SAML 2.0 standard for single sign-on and generates SAML assertions when configured as an identity provider.
    - Salesforce is automatically enabled as an identity provider when a domain is created. 
    -  After a domain is deployed, admins can add or change identity providers and increase security for their organization by customizing their **domain’s login policy**
    

### Inactivity (passcode) Lock
-  Upon initial activation, Salesforce prompts the user to create an arbitrary passcode (if required by the org admin)
-  Used to unlock the app after reboot, or an admin defined period of inactivity (1, 5, 10, or 30 minutes).
- Protects lost or stolen devices that may have their wireless connection disabled, and can’t have their OAuth token

- Passcode Strength and Storage
<table>
    <tr>
        <th>App</th>
        <th>Strength and Storage</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td> PBKDF2 hash of the passcode is stored in the secure keychain, for passcode validation. 
            The hashed passcode can be accessed only while the device is unlocked by the user (kSecAttrAccessibleWhenUnlockedThisDeviceOnly). 
             Admins can configure required passcode length through the Salesforce Connected App.
        </td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td>
            PBKDF2 produced AES-256 encrypted key derived from device unique Android ID and 
            randomly generated string. 
            The refresh token is stored in Android’s <b> encrypted AccountManager</b>.
        </td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>
             Users are prompted to re-enter username/password after 30 minutes of inactivity, or if they navigate to a different site or closed the mobile browser
        </td>
    </tr>
</table>
-  Locally stored data is erased after 10 failed attempts at entering the passcode. 

### Session Cookie
- Session cookie is only used for Visualforce pages. 
- It is derived from the OAuth Access Token and is scoped to the Visualforce page. The WKWebView/WebView stores it in the cache.

### Restrict Device Platforms
- For iOS and Android: Admins can restrict Salesforce app access through the admin console by blocking the **Salesforce Connected App**
- Mobile Web: Admins can enable/disable.  If the mobile web experience is disabled, the user is taken to the
full Salesforce site from the mobile browser.



## Storage Security - local data protection

- Provides methods to secure the device data if the mobile device passes out of control of the user or the user’s organization.
    - Device vendors provide the ability to enforce OS-level password access restrictions on any device apps or data
        -  Users must be required to use the device protection in accordance with the owning enterprise’s security policy.
        -  If the device is locked by a strong password, it is difficult for unauthorized persons to do anything with it 

- The data stored locally on the device is saved in the device’s **embedded memory** and never on an external memory card.
    - Mobile platforms don’t generally allow data extraction from a local database. 
    - To make the system more secure, Salesforce does provide encryption on the device database.
        - **Feed Database Encryption**
            -  A feed item is a piece of information posted by a user (for example, a poll) or by an automated process
(for example, when a tracked field is updated on a record).
  <table>
    <tr>
        <th>App</th>
        <th>Feed Database Storage Encryption</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td>  
            Encrypted via SQLCipher using 256-bit AES (CBC mode/PBKDF2 key derivation).
            Records pertaining to inactive feed item data are evicted from the database after 5 days have elapsed. Temporary files (such as
viewed image attachments) are stored only in memory while used.
        </td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td>
             Encrypted via SQLCipher using 256-bit AES (CBC mode/PBKDF2 key derivation).
            Records pertaining to inactive feed item data are evicted from the database after 5 days have elapsed. Temporary files (such as
viewed image attachments) are stored only in memory while used.
        </td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>No encryption required. No data is stored locally on the device when using the mobile web.</td>
    </tr>
</table>

  - **Files and Attachments**
            - Any file that a user uploads, shares, or attaches to posts, comments, or records. All file types are supported:
documents, presentations, spreadsheets, PDFs, images, audio files, and video files.
  <table>
    <tr>
        <th>App</th>
        <th>Files and Attachments  Storage Encryption</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td>Files and attachments are stored on the device’s file system in a double-encrypted format. We use the device’s
hardware encryption capability to encrypt the files while the device is locked and in addition we perform our own encryption using
AES algorithm (128-bit block size and 256-bit key size). When the file is being viewed, there's a temporary unencrypted copy kept
on the file system (removed when the 'viewing' operation is complete).</td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td> To store files offline, we require the user to enable device encryption and use the OS’s file encryption
system. If enabled, a passcode 5 or more alphanumeric characters adds an extra layer of file encryption. This allows the app to securely
store local files.</td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>No encryption required. No data is stored locally on the device when using the mobile web.</td>
    </tr>
</table>



  - **Offline Sync**
            - If Salesforce users lose their wireless connection, they can enable offline sync to navigate within the app and view most recent items.
  <table>
    <tr>
        <th>App</th>
        <th> Encryption</th>
    </tr>
    <tr>
        <td><i>Salesforce App for  iOS </i></td>
        <td> Database encrypted via SQLCipher using 256-bit AES (CBC mode/PBKDF2 key derivation)</td>
    </tr>
    <tr>
        <td><i>Salesforce app for Android</i></td>
        <td> Database encrypted via SQLCipher using 256-bit AES (CBC mode/PBKDF2 key derivation).</td>
    </tr>
    <tr>
        <td><i>Mobile Web</i></td>
        <td>Offline sync functionality isn’t available in mobile web.</td>
    </tr>
</table>


## Remote Wipe

- To minimize the risk of information loss when a device is compromised, an org admin can:
    - Disable a user completely (for example, termination of an employee) to remove access and wipe the data from the apps.
    - View the Connected Apps OAuth Usage report in the administration console to revoke the OAuth refresh token and associated
access tokens. This wipes the app, which forces the user to **reauthenticate** (e.g. employee loses a phone).


            

            


 


## Mobile Device Management (MDM)

![2 options for security and compliance](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_compliance/images/f537d2ce3cf3a37f806e97aac1531d49_salesforce1_security_options.png)

- Some customers have security and compliance requirements that can’t be met using the Salesforce app alone. Those customers typically use a mobile device management (MDM) solution to add extra layers of security and compliance safeguards.

- Both Salesforce for Android and Salesforce for iOS provide an extra level of security compliance through interoperation with the most popular MDM (mobile device management) suites.

-  With MDM we get enhanced functionality for distribution and control over the users’ devices.
-  The enhanced security functions when you combine Salesforce with an MDM include
    - certificate-based authentication 
    - automatic custom host provisioning
-  SAML 2.0 must be enabled and configured for your organization

###  Prerequisites to implement enhanced security for Salesforce for Android
-  Configure Android for Work (the program hat supports enterprise use of Android devices) for your org. 
-  Configure your Mobile Device Management (MDM) suite
-  Work with your MDM provider to complete the configuration for your org
-  After you have Android for Work and your MDM suite up and running in your org, you’re ready to implement the enhanced security features of Salesforce for Android.


#### References
- [Android for Work](https://www.android.com/enterprise/)
- [Android for work setup](https://support.google.com/work/android/topic/9415507?hl=en&ref_topic=6174026&visit_id=637034589467522851-3280669784&rd=1)

### Certificate-Based Authentication
- Using certificates to authenticate simplifies provisioning your mobile users, and your day-to-day mobile administration tasks by eliminating usernames and passwords. 
- Salesforce uses X.509 certificates to authenticate users more efficiently, or as a second factor in the login process.

#### MDM Settings for Certificate-Based Authentication
- To enable certificate-based authentication for your mobile users, you need to configure key-value pair assignments through your MDM suite.
- Minimum OS Versions required:
    - iOS 7.0
    - Android 5.0
- Once you save your key-value pair assignments, you can push the mobile app with the updated certificate-based authentication flow to your users via your MDM suite.
 
  <table>
    <tr>
        <th>Platform</th>
        <th> Key</th>
        <th>Data Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><i>Android, iOS</i></td>
        <td> RequireCertAuth</td>
        <td>Boolean</td>
        <td>
          Set this key to true to initiate Certificate-Based Authentication.<br/>
          <b>Android </b>: Uses the user cert on the device for the auth inside a WebView.<br/>
          <b>iOS</b>: Redirects the user to Safari for all authentication requests.
        </td>
        </td>
    </tr>
  <tr>
        <td><i>Android </i></td>
        <td>ManagedAppCertAlias</td>
        <td>String</td>
        <td>
        Alias of the certificate deployed on the device picked by the app for user authentication. </td>
        </td>
    </tr> 
</table>

### Automatic Custom Host Provisioning

- You can push custom login host settings to your mobile users.
- This spares your mobile users from having to manually type **long URLs for login hosts**  - typically a frustrating and error-prone activity.
- You can configure key-value pair assignments through your MDM to define multiple custom login hosts for your mobile user

#### MDM Settings for Automatic Custom Host Provisioning
- Configure these key-value pair assignments through your MDM suite:
  <table>
    <tr>
        <th>Platform</th>
        <th> Key</th>
        <th>Data Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><i>Android, iOS</i></td>
        <td> AppServiceHosts</td>
        <td>String Array</td>
        <td>
          Login hosts. First value in the array is the default host.<br/>
          <b>Android </b>:  Requires https:// in the host URL.<br/>
          <b>iOS</b>: Doesn't require https:// in the host URL. 
        </td>
    </tr>
    <tr>
        <td><i>Android, iOS</i></td>
        <td> AppServiceHostLabels</td>
        <td>String Array</td>
        <td>
          Labels for the hosts.<br/>
        </td>
    </tr> 
      <tr>
        <td><i>Android, iOS</i></td>
        <td> OnlyShowAuthorizedHosts</td>
        <td>Boolean</td>
        <td>
          If true, prevents users from modifying the list of hosts that Salesforce can connect to.<br/>
        </td>
    </tr>
</table>



### Additional Security Enhancements

- Clear the contents of their clipboard whenever the mobile app is in the background.
- Users may copy and paste sensitive data as a part of their day-to-day operations
- This enhancement ensures any data they copy onto their clipboards are cleared whenever they background the app

#### MDM Settings for More Security Enhancements
- Configure these key-value pair assignments through your MDM suite:
  <table>
    <tr>
        <th>Platform</th>
        <th> Key</th>
        <th>Data Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><i>iOS</i></td>
        <td> ClearClipboardOnBackground</td>
        <td>Boolean</td>
        <td>
       If true, the contents of the iOS clipboard are cleared when the mobile app is backgrounded.<br/>
        This prevents the user from accidentally copying and pasting sensitive data outside of the app.
        Similar feature is available in Android version 5.0+ 
        </td>
    </tr>
</table>


### Sample Property List (plist) Configuration for  iOS
- The plist contains the key-value pair assignments that an MDM provider sends to a mobile app to enforce security configurations
```xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>AppServiceHosts</key>
		<array> <string>host1</string>
			    <string>host2</string>
		</array>
		<key>AppServiceHostLabels</key>
		<array>
			<string>Production</string>
			<string>Sandbox</string>
		</array>
		<key>RequireCertAuth</key>
		<true />
		<key>ClearClipboardOnBackground</key>
		<false />
		<key>OnlyShowAuthorizedHosts</key>
		<false />
	</dict>
</plist>



```



## Salesforce Connected App Security Attributes
- Salesforce for Android and iOS provide an extra level of security compliance without the use of an MDM
-  Lets you configure security attributes, such as:
    - disabling copy and paste 
    -  disabling sharing files outside of your org
  
  for your users from **Setup** in the full Salesforce site.

- Salesforce for Android and iOS are connected apps:
    - You can control the users who have access to the apps, as well as other security policies.
    - By default, all users in your organization can log in to Salesforce for Android and iOS 
- When the Salesforce connected apps components are installed, they’re added to the Connected Apps
page
- ![connected app](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_connected_app/images/a1823c227a5ed18ee8d23e1273994b7a_salesforce1_security_connected_apps_list_empty.png)
- ![Connect app 2](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_connected_app/images/d35bf80ea8a105e6b1aa0197adb666c4_salesforce1_security_connected_apps_list.png)
- ![connected app ios](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_connected_app/images/1b2faf7d549b765055efa359b9f55da2_salesforce1_security_connected_app_details.png)


#### Custom attributes are available for Salesforce for Android and Salesforce for iOS
-  Connected app attribute changes take effect when users force quit the Salesforce app or
when they log in to a new session
- To ensure that new or modified settings take effect for all users, we recommend that you revoke access to the Salesforce app so everyone is required to log in again
- We also recommend that you warn users about the changes you intend to make, especially if you’re going to restrict activities that were previously available. The Salesforce app doesn’t display messages or indicators that connected app settings have changed.


  <table>
    <tr>
        <th> Key</th>
        <th>Value</th>
        <th>Description</th>
    </tr>
    <tr>
        <td> DISABLE_EXTERNAL_PASTE</td>
        <td>Boolean</td>
        <td>
        If set to TRUE , lets users copy and paste within the Salesforce app, but disables copying within and pasting outside of the Salesforce app.<br/>
        If set to FALSE (default if attribute value isn't defined), lets users copy and paste within and outside of the Salesforce app.
        </td>
    </tr>
      <tr>
        <td> FORCE_EMAIL_CLIENT_TO</td>
        <td>The email app’s URI scheme
     
        </td>
        <td>
        If the user taps on an email action in Salesforce app, the user is directed to the email app specified in the attribute value.
          <br/>
       Example:<br/>
       Android for bluemail: https://play.google.com/store/apps/details?id=me.bluemail.mail&hl
       iOS for gmail: googlegmail:///co?to=


        </td>
    </tr> 
    <tr>
        <td> SHOW_ONBOARDING_CAROUSEL</td>
        <td>Boolean</td>
        <td>
        If set to TRUE , onboarding screens appear when users log into the Salesforce app.<br/>
        If set to FALSE disables onboarding screens when users log into the Salesforce app 
        </td>
    </tr>

      <tr>
        <td> SHOW_OPEN_IN</td>
        <td>Boolean</td>
        <td>
        If set to TRUE users share a file from the Salesforce app via a link to the file, or open a Salesforce file in a third-party app.<br/>
        If set to FALSE  disables users from sharing a file from the Salesforce app or opening a Salesforce file in a third-party app
        </td>
    </tr>

          <tr>
        <td> SHOW_PRINT</td>
        <td>Boolean</td>
        <td>
        If set to TRUE  lets users print from the Salesforce app<br/>
         If set to FALSE  disables printing from the Salesforce app 
        </td>
    </tr


</table>
### Summary

<table class="featureTable sort_table" summary="">
        
        
        <thead class="thead sorted" align="left">
          <tr>
            <th class="featureTableHeader vertical-align-top " id="d623384e106">Feature</th>

            <th class="featureTableHeader vertical-align-top " id="d623384e109">Description</th>

          </tr>

        </thead>

        <tbody class="tbody">
          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Authorization</td>

            <td class="entry" headers="d623384e109" data-title="Description">Authorization is the right to use the app. By default, all Salesforce users have access
              to the Salesforce app. But you can use profiles and permission sets to grant mobile
              access to only a subset of employees.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Permission</td>

            <td class="entry" headers="d623384e109" data-title="Description">The Salesforce app provides access to data based on the permissions defined for
              each user by their Salesforce admin. Mobile users can’t view or access more than their permissions allow.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Authentication</td>

            <td class="entry" headers="d623384e109" data-title="Description">Just because someone has the Salesforce app installed on their device, they can’t
              necessarily access Salesforce. They have to authenticate using their Salesforce credentials or
              single sign-on (SSO). If your company uses SSO, the Salesforce app supports both
              federated and delegated authentication.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Communication</td>

            <td class="entry" headers="d623384e109" data-title="Description">Mobile data is encrypted during over-the-air communication.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Encryption</td>

            <td class="entry" headers="d623384e109" data-title="Description">Salesforce data is
              encrypted on the device, which is then double-encrypted by the mobile OS. Files and
              attachments are also encrypted on the device file system.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Data protection</td>

            <td class="entry" headers="d623384e109" data-title="Description">With the Salesforce app, you have additional security safeguards at your
              disposal, including the ability to remotely wipe the Salesforce data on a
              device.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">Compliance</td>

            <td class="entry" headers="d623384e109" data-title="Description">The Salesforce app provides settings that can help you meet industry
              requirements, such as disabling copy and paste from Salesforce to other apps and
              requiring the use of a specific email client.</td>

          </tr>

          <tr>
            <td class="entry" headers="d623384e106" data-title="Feature">MDM integration</td>

            <td class="entry" headers="d623384e109" data-title="Description">The Salesforce app can provide an extra level of security through integration
              with the most popular MDM solutions. Combined with an MDM, the Salesforce app gives
              you more control over your users’ devices, as well as additional app distribution
              options.</td>

          </tr>

        </tbody>

      </table>


### App available at:

- [Salesforce App for iOS at Apple App Store](https://apps.apple.com/us/app/salesforce/id404249815)

- [Salesforce App for Android at Google Play](https://play.google.com/store/apps/details?id=com.salesforce.chatter&hl=en_US) 
