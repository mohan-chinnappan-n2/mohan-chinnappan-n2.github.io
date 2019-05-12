## Marketing Cloud Content API

### SOAP

#### Content Area

- The **ContentArea** object represents a defined section of reusable content. 
- One or many **ContentAreas** can be defined for an Email object. 
- A **ContentArea** is always acted upon in the context of an Email object.

[Ref SOAP API](https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/contentarea.htm)


### REST Content Builder API

[Ref REST API](https://developer.salesforce.com/docs/atlas.en-us.mc-apis.meta/mc-apis/content-api.htm)

#### Content Builder

 - Single cross-channel repository for marketing content, such as emails, images, text, and other documents.
 - You can create and manipulate marketing content using the Content Builder REST API.
 - The term **Asset** to refer to all types of marketing content
    - Assets are hierarchical:
        -  An asset can be a message that contains a template, which is itself an asset. 
        -  The template can contain slots, which are also assets.
    - Assets are stored in both ElasticSearch and in MS SQL Server;
    - ElasticSearch provides a fast document retrieval engine
    - SQL Server provides the reliability. 
    - You can use the asset model to :
        - create
        - update
        - delete
        - query 
        - publish 
     
       assets.


### Marketing Cloud Connect

