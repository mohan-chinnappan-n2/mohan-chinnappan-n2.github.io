## Enable Single Sign-On Authentication Via SAML 2.0

![SSO flow](img/mc-sso-saml-1.png)

- Marketing Cloud supports **identity providers(idP)** that utilize the SAML 2.0 specification, such as 
    - Salesforce Identity, 
    - Shibboleth, 
    - PingFederate, 
    - Active Directory Federation Services (ADFS). 

- The configuration for the identity provider must trust the Marketing Cloud product as a **service provider(sp)**, sometimes called a relying party.

### Metadata
- Find the metadata document for the Marketing Cloud in the **Single Sign-On Settings** heading under **Security Settings** in the Administration section of your Marketing Cloud account. 
- Click **Download Metadata** to retrieve the information. 
- The downloaded XML file provides the necessary metadata.
- Metadata contains
    - The endpoint addresses for communication
    - The X.509 certificates used to encrypt and sign SAML assertions
    - The SAML bindings supported by the service provider

### SAML Bindings
- The Marketing Cloud supports the HTTP POST and HTTP Artifact bindings.

### Name Identifier
- To define an **unique identifier** for the users accessing the Marketing Cloud, configure the identity provider. 
    - The **NameID** tag in the **Response** SAML assertions sent to the Marketing Cloud must include this unique identifier
    - This unique identifier represents the shared identifier between the identity provider and the Marketing Cloud. 
    - This identifier can include any string value. 
        - Common values include the email address or the login name at the identity provider. 
        - You must specify the format of the **NameID** tag in the metadata of the identity provider (through the use of a **NameIDFormat** tag) and in the **Response** requests sent on login. 
- The Marketing Cloud supports these name ID formats:
    - [urn:oasis:names:tc:SAML:2.0:nameid-format:persistent](https://support.pingidentity.com/s/article/SAML-Name-ID-urn-oasis-names-tc-SAML-2-0-nameid-format-persistent)
    - urn:oasis:names:tc:SAML:2.0:nameid-format:entity
    - urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified
    - urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress

### Key Descriptors
 - Key descriptors define keys used for encryption and signing of SAML assertions. 
    - The Marketing Cloud requires that all SAML assertions are signed by an X.509 certificate. In metadata documents, this is defined with the **KeyDescriptor** tag.
 
                                                     



