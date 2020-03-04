## FSC - Rollup by Lookup Rules

- When
    - the user edits [Financial Account](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__FinancialAccount__c)
    - the user edits [Primary Group Membership](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=AccountContactRelation)

- What
    - the [rollup by lookup (RBL) configuration](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__RollupByLookupConfig__c) 
updates the corresponding RBL summaries at the client and group levels

![rbl](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/img/FinServ__RollupByLookupConfig__c.svg)      

-  RBL rules
    -  include the RBL configuration
        - provides 
            - Rollup definition 
            - Filter Criteria


- Rollup operations
    - <code>["Sum","Max","Min","Avg","Count"]</code>

- Rollup ProcessType
    - <code>["Realtime","Async","Batch"]</code>

- WhereClause
    - A Sample Expression For The Where Clause Is: <code>(1 OR 2) AND 3</code>. 
        - Here The Numbers Correspond To The Filter Criterias Defined In The Child Object [RollUpByLookupFilterCriteria](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__RollUpByLookupFilterCriteria__c)

![rbl](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/img/FinServ__RollupByLookupFilterCriteria__c.svg)

- Operator
```
["Greater Than","Equals","Greater Than Or Equal To","Contains","Not Equal To",
 "Less Than","Less Than Or Equal To","Not Contains","Not Like","Starts With","Ends With","IN"]
``` 

- RBL summaries are available for:
    - [Financial Account](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__FinancialAccount__c)
    - [Financial Account Role](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__Revenue__c)
    - [Assets & Liabilities](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__AssetsAndLiabilities__c)
    - [Revenue](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=FinServ__Revenue__c) 

- Changes to a single Financial Account or Account Contact Relationship membership record 
    - update RBL summaries in **real time**. 
- Changes made via bulk operations or the Group Builder **queue** the updates.

### Rollup Operation Example

![fsc-rollup1](img/fsc-rollup-1.png)
![fsc-rollup2](img/fsc-rollup-2.png)

- Rachel Adams is the primary owner of an investment account
- Adams Household is her primary group. 
- When you activate rollups for Financial Accounts
    -   <code>Household__c</code> lookup field on Rachel’s investment account is stamped with the Adams Household. 
- The active RBL rules for Total **Financial Accounts Client Primary Owner** and **Total Financial Accounts Household** are invoked. 
- As a result, her investment account balance rolls up to the **Total Financial Account balance** for Rachel Adams and the Adams Household. 
- Rachel’s investment account is displayed on the Investment Account component

![rbl po](img/rbl-po.png)
![rbl po](img/rbl-2.png)



### About RBL Configurations

- Active :  indicates a rule is active or inactive.
- From Object: indicates the object to perform rollups from.
- Field to Rollup From:  indicates the field to aggregate.

- From Record Type (optional): indicates a specific record type to roll up from.
- Lookup Field: (most important) indicates the record (client, group) to roll up to.

- Rollup Operation:  indicates the type of operation, such as Sum.

- To Object: indicates the object to summarize into.
- Field to Roll Up To : indicates the field to summarize into.

- Fields Triggering Update (Optional): fields on the source object that might trigger the update. When left blank, any edit will invoke rollup recalculation.
- Where Clause (Optional): filter criteria clause.

![rbl po](img/rbl-po.png)

- All financial account (FA) type rules have corresponding financial account role (FAR) type rules to support rollup summaries for multiple joint owners. 
- You can enable either the FA or FAR version of the RBL rule, but not both. 
    - For example, you can enable RBLForFARForFinAcctsClientPrimaryOwner instead of RBLForFinAcctsClientPrimaryOwner.

- All group or household (HH) type rules support RBL summary calculations for the Primary Owner's Primary Group only.
- A group gives insight into a customer’s financial circles, such as a household with its family members and professional connections. A group provides an overall view of its members by rolling up their information. You can extend a group with custom fields and more.


