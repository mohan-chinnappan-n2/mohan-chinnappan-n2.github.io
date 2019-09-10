## Microsoft Add-In Development

### What is Office Add-ins 
- Office Add-ins run inside an Office application and can interact with the contents of the Office document using the rich JavaScript API.

- Office Add-in is just a web app that you can host anywhere
- Using a manifest.xml file, you tell the Office application where your web app is located and how you want it to appear
- Office.js provides interoperability - add in and client (office web app)
- Hosted centrally - on any web server 
- Discoverable from Add-in [Market Place](https://appsource.microsoft.com/en-us/marketplace/apps?product=add-ins)


### Demo - Ramanujan Office Add-In app for Outlook
![Ramanujan app](img/ramanujan-add-in-outlook-1.gif)

### Demo - Ramanujan Office Add-In app for Excel
![Ramanujan app](img/ramanujan-add-in-1.gif)

![Office add-ins](img/office-addins-1.png)

#### Add-in Types Examples
![Contextual](img/addin-in-contextual.png)
![taskpane](img/addin-taskpane.png)
![taskpane](img/addin-taskpane-2.png)
![taskpane](img/addin-taskpane-3.png)

![content](img/addin-content.png)
![content](img/addin-content-2.png)

![Command](img/addin-command.png)


#### Manifest file runs everything
![Manifestfile](img/office-addin-manifest.png )




```

yo office
? Choose a project type: Office Add-in project using React framework
? What do you want to name your add-in? office-sf2
? Which Office client application would you like to support? Excel

Creating office-sf2 add-in for Excel using Typescript and React at ./office-sf2

...

Congratulations! Your add-in has been created! Your next steps:

1. Launch your local web server via  npm start  (you may also need to
    trust the Self-Signed Certificate for the site if you haven't done that)
2. Sideload the add-in into your Office application.

Please refer to resource.html in your project for more information.
Or visit our repo at: https://github.com/officeDev/generator-office



```

### OAuth
A fundamental idea of OAuth is that an application can be a security principal unto itself, just like a user or a group, with its own identity and set of permissions. In the most typical scenarios, when the user takes an action in the Office Add-in that requires the online service, the add-in sends the service a request for a specific set of permissions to the user's account. The service then prompts the user to grant the add-in those permissions. After the permissions are granted, the service sends the add-in a small encoded access token. The add-in can use the service by including the token in all its requests to the service's APIs. But the add-in can act only within the permissions that the user granted it. The token also expires after a specified time

#### Flows
The purpose of an OAuth flow is to secure the identity and authorization of the application. 

- **Implicit flow**: Communication between the add-in and the online service is implemented with client-side JavaScript. This flow is commonly used in single-page applications (SPAs).

- **Authorization Code flow**: Communication is server-to-server between your add-in's web application and the online service. So, it is implemented with server-side code.

- Which one to use:
    - In the **Authorization Code flow**, you're provided a client secret that needs to be kept hidden. 
    - An application that has no server-side backend, such as an SPA, has no way to protect the secret, so we recommend that you use the **Implicit flow** in SPAs.

### Middleman services
- A middleman service may either provide access tokens for popular online services or simplify the process of enabling social login for your add-in, or both. 
    - [oauth.io](https://oauth.io/)

 ```javascript
OAuth.popup('facebook').then((facebook) => {
    return facebook.me()
}).then((me) => {
    console.log('Your name is ' + me.name)
}).catch((error) => {
    console.error(error)
})
```
    - [auth0](https://manage.auth0.com/welcome/#)
        - [github auth0 samples](https://github.com/auth0-samples/auth0-javascript-samples/tree/master/01-Login)

- With very little code, your add-in can use either client-side script or server-side code to connect to the middleman service and it will send your add-in any required tokens for the online service. All of the authorization implementation code is in the middleman service.
- User [Dialog API](https://docs.microsoft.com/en-us/office/dev/add-ins/develop/dialog-api-in-office-add-ins#use-the-dialog-apis-in-an-authentication-flow)

#### Refer
[Authorize external services in your Office Add-in](https://docs.microsoft.com/en-us/office/dev/add-ins/develop/auth-external-add-ins)
- [Authorization code](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2) 
- [Connect Salesforce and Microsoft® Exchange Using OAuth 2.0](https://help.salesforce.com/articleView?id=lightning_sync_admin_exch_connect_w_oauth.htm&type=5)
- [Salesforce for Outlook' OAuth re-authentication](https://help.salesforce.com/articleView?id=000336422&language=en_US&type=1&mode=1)

### Demos
 - ![Demo - Excel Office Add-in](img/excel-add-in-1.gif)
 - ![Demo2 - Excel Office Add-in](img/excel-add-in-3.gif)



### Signup
- [Signup of Account in MS](https://signup.live.com/signup)
- [outlook](https://outlook.live.com/mail/inbox)
### Links

- [Office Add-ins documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/)
- [Office on web](https://www.office.com/?auth=1)
- Sideloading
    - [Sideload Office Add-ins in Office on the web for testing](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing#sideload-an-office-add-in-in-office-on-the-web)
    - [Sideloading Office Add-ins into Office Desktop or Office Online](https://www.youtube.com/watch?time_continue=16&v=XXsAw2UUiQo)
    - [Github for A Word JavaScript add-in that redacts texts. Also searches and highlights texts.](https://github.com/OfficeDev/Word-Add-in-JS-redact)

-  UI framework
    - [UI Fabric](https://developer.microsoft.com/en-us/fabric#/)
    - [Office UI Fabric](https://www.youtube.com/watch?v=YsNhK6EmTxo)
    - [Add in UX guidelines](https://docs.microsoft.com/en-us/office/dev/add-ins/design/add-in-design)

- [Build an Excel task pane add-in](https://docs.microsoft.com/en-us/office/dev/add-ins/quickstarts/excel-quickstart-jquery?tabs=yeomangenerator)
- [Github Excel-Add-in-Tutorial](https://github.com/OfficeDev/Excel-Add-in-Tutorial)
- [Salesforce-Addin-Workshop](https://github.com/OfficeDev/Salesforce-Addin-Workshop)
- [Salesforce Office Add-in Workshop - Exercise 1](https://www.youtube.com/watch?v=skvou346HOo)
- [Salesforce Office Add-in Workshop - Exercise 2](https://www.youtube.com/watch?v=1vHNsCDy3wQ)
- [Salesforce Office Add-in Workshop - Exercise 3](https://www.youtube.com/watch?v=_lXp3ML0W3k)
- [Asp.net](https://dotnet.microsoft.com/apps/aspnet)
- [Office Add-ins with Visual Studio Code](https://code.visualstudio.com/docs/other/office)  
- [Installing the Office Generator](https://developer.microsoft.com/en-us/office/blogs/creating-office-add-ins-with-any-editor-introducing-yo-office/)
- [Build an Office add-in using React](https://www.youtube.com/watch?v=Aszwh_h5MtM)

-[Integrating Salesforce with Microsoft Office through Add-ins](https://www.youtube.com/watch?v=33qzO54dKvQ)

#### Salesforce Add-ins
- [Salesforce Wave Connector for Excel](https://appsource.microsoft.com/en-us/product/office/WA104379394?src=office&corrid=09eba5e7-529c-432b-8b96-579361c37615&omexanonuid=51339668-c31b-420c-a7ee-900484382c80&referralurl=https%3a%2f%2fexcel.officeapps.live.com%2f)
- [Install the Einstein Analytics Connector for Excel](https://help.salesforce.com/articleView?id=bi_integrate_wave_connector.htm&type=5)
![Add-in Wave](img/office-addin-wave.gif)

- [Salesforce Outlook Integration](https://appsource.microsoft.com/en-us/product/office/WA104379334)
- [Outlook Integration with Salesforce for Outlook](http://sfdc.co/cckKXJ)

#### Best Office Add-Ins
- [22 Best Free Add-ins](https://zapier.com/blog/best-word-excel-powerpoint-addins/)
- [Boomerang](https://appsource.microsoft.com/en-us/product/office/WA104379606?tab=Overview&utm_source=zapier.com&utm_medium=referral&utm_campaign=zapier)

#### Stackoverflow
- [Office Add-in SO](https://stackoverflow.com/search?q=office+add-in)

#### Outlook Office Add-in
- [Tutorial: Build a message compose Outlook add-in](https://docs.microsoft.com/en-us/outlook/add-ins/addin-tutorial?context=office/dev/add-ins/context)
- [Outlook add-in APIs](https://docs.microsoft.com/en-us/outlook/add-ins/apis)
- [Outlook add-in manifests](https://docs.microsoft.com/en-us/outlook/add-ins/manifests)

- [Using add-ins in Outlook on the web](https://support.office.com/en-us/article/using-add-ins-in-outlook-on-the-web-8f2ce816-5df4-44a5-958c-f7f9d6dabdce#targetText=Microsoft%20has%20partnered%20with%20leading,you%20view%20or%20create%20messages.)

#### Outlook add-ins
- ![Addin Howto](img/outlook-addin-howto.png)
- [Location](https://outlook.live.com/owa/?path=/options/manageapps/action/installFromURL.slab&assetid=WA104379334&lc=en-US&pm=US&scope=3&licensetype=Free&corr=ee593bc8-c607-41d5-81fc-0f37486a099e&upt=Consumer)
- [Settings](https://outlook.live.com/mail/options/mail/layout)
- ![Boomerang](img/outlook-addin.png)
- ![Salesforce](img/outlook-addin-sf.png)

```

Signup Servlet:
https://mohansun-60-dev-ed.my.salesforce.com/clients/mailapp/signupservlet?_host_Info=outlook%7Cweb%7C16.01%7Cen-us%7C6be62e51-d616-49e5-45f7-e15509984d24%7CisDialog%7C

decodeURI('outlook%7Cweb%7C16.01%7Cen-us%7C6be62e51-d616-49e5-45f7-e15509984d24%7CisDialog%7C')

"outlook|web|16.01|en-us|6be62e51-d616-49e5-45f7-e15509984d24|isDialog|"

//  sourceMappingURL=/javascript/1567849500000/clients-mailapp/source/Mailapp.SignUp.js.map

```

![MailAppSignup](img/lfo-mailAppSignup.png )

- Inbox Integration 
![LFO0](https://az158878.vo.msecnd.net/marketing/Partner_21474843361/Product_42949677285/Asset_a7fc333c-a458-4578-be9a-047f2d67163f/4WithInbox.png)

- Log Emails
![LFO2](https://az158878.vo.msecnd.net/marketing/Partner_21474843361/Product_42949677285/Asset_e2e9465a-d190-4e37-a71c-73a6cb937e09/3Related.png)

- Create Records
![LFO3](https://az158878.vo.msecnd.net/marketing/Partner_21474843361/Product_42949677285/Asset_576eab74-3ff9-4100-8e50-f3100941a654/5CreateRecords.png)

- Tasks
![LFO4](https://az158878.vo.msecnd.net/marketing/Partner_21474843361/Product_42949677285/Asset_a71ce1f1-a240-4b96-a2c2-ea9cc6cbb43a/6Tasks.png)

-  Comparing Microsoft Office VSTO ( Visual Studio Tools for Office add-in) and Web add-ins
    - [Video: Comparing Microsoft Office VSTO and Web add-ins](https://www.youtube.com/watch?v=Z0kBiHR2ZJU)


### Outlook Add-in

- [Outlook add-ins overview](https://docs.microsoft.com/en-us/outlook/add-ins/)

- Supports
    - email messages
    - meeting requests
    - responses and cancellations
    - appointments 
- Extension points are the ways that add-ins integrate with Outlook
    - Command buttons on the ribbon
        - ![cmd btn on ribbon](https://docs.microsoft.com/en-us/outlook/add-ins/images/uiless-command-shape.png)
    - A contextual add-in for a highlighted entity (an address)
        -  Link off regular expression matches or detected entities in messages and appointments
        - ![contextual add-in](https://docs.microsoft.com/en-us/outlook/add-ins/images/outlook-detected-entity-card.png)
        
