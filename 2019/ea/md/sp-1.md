## Security Predicates for Datasets

![security predicate](img/sp/sp-1.png)

- 2 ways to provide data row level security:
    - Sharing Inheritance
        - Allows EA to use the same sharing rules for your datasets as Salesforce uses for your objects. 
        - Via Setup > Analytics > Settings 
        ![Sharing inheritance](img/sp/sp-inherit-1.png)
        - You can inherit sharing settings only from **one object - sharing source for the dataflow**, regardless of how many source objects are used in creating a dataset.
        -  The computeRelative and delta dataflow transformations could merge information from records with different security, which can result in **leaking information** when using sharing inheritance.

        - A dataset using sharing must also have a security predicate defined.
        - If an opportunity has more than 150 sharing rules, you can’t use the Opportunity object as a sharing source for a dataflow.
            - Sharing inheritance might not be used when many sharing settings or rules control access to an opportunity. In this situation, the backup security predicate takes effect.
                - A user has membership in many public groups, each of which grants access to the opportunity.
                - A user is near (or at) the top of role or territory hierarchies in an org that has a complex role or territory configuration.


        - 


    - Security Predicate
        -  A security predicate is a filter condition that defines row-level access to records in a dataset.
        - When a user submits a query against a dataset that has a predicate, Analytics **checks the predicate to determine which records the user has access to**. If the user doesn’t have access to a record, Analytics does not return that record.
        - When sharing inheritance is enabled, you can set the security predicate to ‘false’ to block all users not covered by sharing.
            - predicate is the default when sharing is enabled on existing datasets.
        - The predicate is flexible and can model different types of security policies
            - Record ownership. Enables each user to view only records that they own.
            - Management visibility. Enables each user to view records owned or shared by their subordinates based on a **role hierarchy**.
            - Team or account collaboration. Enables all members of a **team**, like an **opportunity team**, to view records shared with the team.
            -  Combination of different security requirements. For example, you might need to define a predicate based on the Salesforce **role hierarchy, teams, and record ownership**.
                - Example: 
                    - To enable each user to view only dataset records that **they own**, you can create a predicate based on a dataset column that contains the **owner** for each record. If needed, you can load additional data into a dataset required by the predicate.
                    - ![Example of Security Predicate](img/sp/sp-about.png)
            - Location
                - To apply a predicate on a **dataset created from a dataflow**, add the predicate in the ```rowLevelSecurityFilter``` field of the **Register**     transformation. The next time the dataflow runs, Analytics will apply the predicate.
                  - ![Example of rowLevelSecurityFilter ](img/sp/sp-register-1.png)
 ```
   "WriteflatPivot": {
    "action": "sfdcRegister",
    "parameters": {
      "name": "FlatPivot",
      "alias": "FlatPivot",
      "source": "FlatPivot",
      "rowLevelSecurityFilter": "test"
    }
  }
  ```
- To apply a predicate on a dataset created from an **external data file**, define the predicate in the rowLevelSecurityFilter field in the metadata file associated with the external data file.
- ![Example of rowLevelSecurityFilter Ext file](img/sp/sp-ext-file-1.png)







<iframe width="900" height="500" src="https://www.youtube.com/embed/PeBpKHkAqjk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

###  Security Metadata Drift

The data you use in Analytics can come from Salesforce objects and fields. A dataflow job runs, and then you can analyze the resulting dataset. In an ideal world, each object in your dataset would stay in perfect sync with its source object. In the real world, the correctness of an object is only as good as the **last update**. The longer the time between updates, the greater the likelihood of **drift**. The security metadata (predicates and descriptors) of a Salesforce object is subject to the same risk of drift.

- Example:
    -  if you replicate an **Opportunity record in Analytics** and then **remove a sharing permission for a user on that record** in Salesforce, your change doesn’t affect the copy in Analytics until the next full sync.
    - However, if you remove the same user from **a group** that controls the same sharing permission, your change is effective immediately

- Effect of drift depends on :
    - how often security permissions change
    - how often your dataflow runs
    - how sharing is configured
    - whether your users have a range of security permissions
- The only way to be certain that security metadata is up to date is to **run full extracts** as often as possible. Consider enabling periodic full sync.



### Links
- [Security Predicates for Datasets](https://help.salesforce.com/articleView?id=bi_security_datasets_predicate_considerations.htm&type=5)
- [Salesforce Sharing Inheritance for Datasets](https://help.salesforce.com/articleView?id=bi_security_datasets_sharing_about.htm)
- [Security Metadata Drift](https://help.salesforce.com/articleView?id=bi_security_datasets_sharing_drift.htm&type=5)
- [Determine Which Data to Include in the Dataset](https://help.salesforce.com/articleView?id=bi_security_rowlevel_example_recordownership_determinedata.htm&type=5)

- [Row-Level Security Example based on Opportunity Teams](https://help.salesforce.com/articleView?id=bi_security_rowlevel_example_teammembership.htm&type=5)

- [Row-Level Security Example based on Role Hierarchy and Record Ownership](https://help.salesforce.com/articleView?id=bi_security_rowlevel_example_rolehierarchy.htm&type=5)
