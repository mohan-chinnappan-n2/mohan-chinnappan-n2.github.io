# Salesforce App

- Uses the Lightning Platform
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
- For iOS and Android: Admins can restrict Salesforce app access through the admin console by blocking the Salesforce Connected App 
- Mobile Web: Admins can enable/disable.  If the mobile web experience is disabled, the user is taken to the
full Salesforce site from the mobile browser.



## Storage Security

### Local Data Protection


## Mobile Device Management (MDM)

![2 options for security and compliance](https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/salesforce1_security/salesforce1_security_compliance/images/f537d2ce3cf3a37f806e97aac1531d49_salesforce1_security_options.png)

- Some customers have security and compliance requirements that can’t be met using the Salesforce app alone. Those customers typically use a mobile device management (MDM) solution to add extra layers of security and compliance safeguards.

- Both Salesforce for Android and Salesforce for iOS provide an extra level of security compliance through interoperation with the most popular MDM (mobile device management) suites.

- 

### Certificate-Based Authentication
### Automatic Custom Host Provisioning
### Additional Security Enhancements

### Sample Property List Configuration


## Salesforce Connected App Security Attributes


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
