## Enable SSO Authentication Via SAML 2.0

### Requirements
- Enabled IdP 
    - IdP should trust the MC product as a service provider (SP)
- SAML Key [Refer](https://help.salesforce.com/articleView?id=mc_overview_create_a_key.htm&type=5)
    - Create an encryption key for MC activities.
        - Setup > Data Management > Key Management > [Create]
        - Choose the key to create (encryption type)
        - Enter the name of your key in the **Name** field. 
        - Leave the external key field blank. After the first handshake, this field auto-populates with the key from the external provider
        - Upload the key 
        - Save
        - After you create the SAML key, click the key to view the **SAML SP metadata**. 
            - The metadata gives you the **appropriate URLs** to use to enable SSO authentication for your own system.

![MC SSO Key](img/mc-sso-key-1.gif)


- MC Service Provider Configuration [Ref](https://help.salesforce.com/articleView?id=mc_overview_administration_configure_marketing_cloud_as_service_provider.htm&type=5)
    - Setup > Security > Security Settings > [Edit]
        - Single Sign-On Settings > (check on: Single Sign-On) > Save
![SP setup](img/mc-sso-sp-1.png)
- SAML configuration test [Ref](https://help.salesforce.com/articleView?id=mc_overview_administration_test_saml_configuration.htm&type=5)
    - Setup > Users > [Select User to enable SSO] > Edit > (Single Sign-On Enabled - select)
        - Enter the shared identifier in **Federation ID**
            -  Federation ID uniquely identifies the user for SSO authentication
            - This unique value is the value passed in the <NameID> tag in the SAML assertions sent to MC, 
                - This identifies the user for SSO authentication. 
    - Once you complete this procedure
        -  This user can sign into your MC account via the IdP. 
        - If the individual only has **one Marketing Cloud user account, that individual enters the application directly**. 
        - Individuals mapped to **more than one user account** must choose the user account to use from a **pop-up dialog** box before proceeding.



![SAML config test](img/mc-sso-test-1.png)



