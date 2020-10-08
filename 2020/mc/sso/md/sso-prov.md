## SSO Provisioning Documentation 
### When Salesforce Identity is not the  IdP (e.g. PingIdentity)

- 1. Request Support by creating a ticket to turn on the Business Rule SAML_SSO
    - With this is turned on you will see:
![sso metadata](img/mc-sso-metadata.png)
- 2. Download the SAML metadata
![SAML metadata](img/md-saml-metadata-1.png)
    - Key parts of this file SFMCMetadata
        - SP Entity Id
        - SP Signing Cert
        - ACS URL
![saml metadata keyparts](img/mc-saml-metadta-keys-1.png )
- 3. Get the Metadata file from your IdP 
    - Similar to like this:
    ![idp metadata](img/idp-metadata-1.png)
    - Note down the entityID as shown above. This is required in next step
    - Also get the IdP Cert file from IdP team
- 4 Create Key based on SSO Metadta as shown below
![SSO metadata key](img/mc-sso-key-setup.png)
    - Save 
    - You will see the **Single Sign-On Settings** turned for the users
    ![sso on](img/sso-on-1.png)
- 5. Enable SSO for the users
    - To enable users, each user will need to be provided SSO Login access for each user :
![SSO User setup](img/sso-user-setup-1.png)
- 6. Now you can use the IDP for signing into the MC.
- 7. Happy SSO with SAML2.0!

### Note
- If the individual only has **one Marketing Cloud user account, that individual enters the application directly**. 
- Individuals mapped to **more than one user account** must choose the user account to use from a **pop-up dialog** box before proceeding.


