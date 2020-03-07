## Data Access

<img src='img/data-access-1.png' width='500'/>

- If the user has access to a field in the Account object, the user will have access to both
    - Account Field
    - Account Object
- Additional access controls via **sharing rules** and other tools may make a particular Account record (say Account B) not accessible by this user.

-  Grant users only the **appropriate level of access to the data** that they should be able to access. 

-  Two categories
    -  **Object-level access**, which includes field-level access
        -  Determines whether a user has access to a particular **object**
        -  Which **fields** they can see on that object 
        -  Which **actions** they can perform on any of the object's records to which user have access
            - Create, Read, Edit, Delete
            - Field-Level Security (FLS) allows you to prevent certain users from seeing sensitive or confidential information contained in records they can see
        -  You configure object level access on **user profiles**.

    -  **Record-level access**  (called **Sharing** in Salesforce)
        - Determines which records a user can see for a particular object, using the following tools:
            - Organization-wide defaults (OWD)
            - Role hierarchy (RH)
            - Territory hierarchy
            - Sharing rules
            - Teams
            - Manual sharing
            - Programmatic sharing

#### Restricting access
- The Read,Create, Edit and Delete object permissions determine which actions a user can perform on any of the object's records to which they have access. 
- Field-Level Security 

#### Opening up access
- The **View All** and **Modify All** object permissions give users access to **all of an object’s records**, **regardless of record-level** access settings.


###  How Salesforce calculates and grants access at the database level?
- **Record Access Calculation**
    - Every time a user attempts to open a record, run a report, access a list view, or search for data using the user interface or API, Salesforce
checks the configuration of its record access features to **determine which records the user can access**.

- These configurations can be elaborate, especially in large organizations with:
    - hundreds of hierarchy nodes, 
    - thousands of sharing rules 
    - millions of data rows, and portals for customers and business partners. 
- Processing such dissimilar data and complex relationships would require far more time than the 300-millisecond Salesforce benchmark for rendering pages
- Rather than applying every sharing rule, traversing all hierarchies, and analyzing record access inheritance in **real time**, Salesforce calculates
record access data **only when configuration changes occur**. Following message is displayed to the Admin :
```
All sharing rules will be recalculated based on the new defaults, which may require significant time. The original values will be displayed until the operation completes. An email notification will be sent upon completion. Do you want to continue?

--
One or more sharing operations has been initiated. See below for additional details. Certain operations may not be available.

```
 
- The calculated results persist in a way that facilitates rapid scanning and minimizes the number of database table joins necessary to determine record access at run time.

### Access Grants
- When an object has its organization-wide default set to **Private or Public Read Only**
- Salesforce uses access grants to define **how much access a user or group** has to that **object’s records**.
-  Each access grant gives a specific user or group access to a specific record.

- Account Share Table
 
![account share](img/AccounShare-Describe.png) 

- Account Share Table Content

![account share_content](img/Account-Share-Content.png) 

- It also records the type of sharing tool — sharing rule, team, etc. — used to provide that access. 

- Salesforce uses four types of access grants:
    - explicit grants, 
        -  when records are shared directly to users or groups.
            - A **user or a queue** becomes the owner of a record.
            - A **sharing rule** shares the record to a personal or public group, a queue, a role, or a territory
            - An **assignment rule** shares the record to a **user or a queue**.
            - A territory assignment rule shares the record to a territory. 
            - A user **manually shares** the record to a user, a personal or public group, a queue, a role, or a territory
            - A user becomes **part of a team** for an account, opportunity, or case.
            - A **programmatic customization shares** the record to a user, a personal or public group, a queue, a role, or a territory.

    - group membership grants, 
        - when a user, personal or public group, queue, role, or territory is a member of a group that has explicit access to the record. 
    - inherited grants, 
        - when a user, personal or public group, queue, role, or territory inherits access through a role or territory hierarchy, or is a member of a group that inherits access through a group hierarchy
    - implicit grants ( built-in sharing )
        - when non-configurable record-sharing behaviors built into Salesforce Sales, Service, and Portal applications grant access to certain parent and child records.
        - Example:  users can view a parent account record if they have access to its child opportunity, case, or contact record.  
            - If those users have access to a parent account record, they can also access its child opportunity, case, and contact records.

- NOTE:
-  If your organization doesn’t have an efficient sharing architecture, it might encounter performance problems when
you use automated processes that generate a very large number of explicit grants, such as major sales realignments.


## Database Architecture
- Object Record Tables (e.g. Account)
    - Tables that store the records of a specific object, and indicate which user, group, or queue owns each record.
- Object Sharing Tables (e.g AccountShare)
    - Tables that store the data that supports explicit and implicit grants
    - Most Objects get their own Object Sharing table unless
        -  The object is a detail in a **master-detail relationship**. In master-detail relationships, the Object Sharing table for the **master object controls** access to the detail object.
        -  Both organization-wide default (OWD) settings (internal and external) are **Public Read/Write**.
        -  The object is of a type that doesn’t support Object Sharing tables, such as **Activities or Files**. These objects have their own access control mechanism.
- Group Maintenance Tables
    - Tables that store the data supporting group membership and inherited access grants. 
    - Store the list of users or groups that belong to each group, indicating group membership.

- Group
![Group](img/Group-1.png)
- GroupMember
![group member](img//group-member-1.png) 

-  Object Sharing tables and  Group Maintenance tables  are used to determine a user’s access to data when they are searching, querying, or pulling up a report or list view
- When a user tries to retrieve one or more records, 
    - Salesforce generates a SQL statement that searches the Object Record table for records matching the user’s search string. 
    - If the record exists, Salesforce appends SQL to the statement that **joins**:
        - the Object Records table with the Object Sharing table (on Record ID), 
        - and the Object Sharing table with the Group Maintenance tables (on User ID or group ID) 
        - Salesforce queries the **joined tables** for access grants that give the querying user access to the record.

![sharing table joins](img/sharing-table-joins.png)

- Salesforce returns only records that satisfy the entire statement, including its appended SQL.
- To satisfy the statement, the record must exist, and either the Object Sharing table or the Group Maintenance tables must grant access to the querying user.
- Object Sharing tables simply store each access grant in separate rows called **sharing rows**, each of which grants a user or group access to a particular record.
- Group Maintenance tables are more complex because a single group membership or inherited access grant can give several users and groups multiple ways to access a record.


### Sharing Rows
 
![account share_content](img/Account-Share-Content.png) 
- ID of the record to which the row grants access
-  ID of the user or group to whom the row grants access
-  Level of access the row allows, such as Read Only or Full Access
-  Row cause, which indicates the reason Salesforce grants the user or group access to the record
- For example, when a record owner manually shares a record with a user or group, Salesforce creates a sharing row with a *Manual* row cause. 
    - When a sharing rule shares the record with a user or group, Salesforce creates a sharing row with a *Rule* row cause.


![acct-sharing](img/act-sharing-1.png)

![manual share](img/manual-share-1.png)
- Maria manually shares the Acme account record with Frank, the services executive. Under the hood, Salesforce adds a sharing row for
Frank
- While only one account record exists for Acme, the Account Sharing table now contains two entries for the Acme record. This update
happens because Salesforce grants access to the Acme account **record twice**: once to Maria as the owner and once to Frank.
 
![sharing rule](img/sharin-rule-1.png)
- An administrator creates a **sharing rule** that shares the Sales Executive’s records with the Strategy group, giving them Read Only access.
Under the hood, Salesforce adds a sharing row that gives the Strategy group access to Maria’s Acme account record.
- For users with **multiple access grants** to a record, Salesforce uses the most permissive grant when determining record access. For example,
if Frank joins the Strategy group, he still maintains the Read/Write access that Maria granted him earlier.
I
- [AccountShare ERD](../../../mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=AccountShare)
```
	["Owner",
     "Manual Sharing",
     "Sharing Rule",
      "Account Sharing",
      "Associated Record Owner Or Sharing",
      "Person Contact",
      "Sales Team",
       
        "Territory Assignment Rule",
        "Territory Manual",
        "Territory Manual",
        "Territory Sharing Rule",
        "Territory Assignment For Forecasting And Reporting",
       
         "Guest User Sharing Rule",
        
        "Associated Guest User Sharing",
        "Associated Guest User Sharing",
       
         "Survey Sharing Rule"]

```
- [Group ERD](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=Group)
- [GroupMember ERD](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=GroupMember)

<iframe src="https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/model-sfdc.html" width='100%' height='800' frameborder="0"></iframe>
