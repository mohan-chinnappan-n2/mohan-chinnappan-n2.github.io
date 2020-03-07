## Data Access

- Following content provide running addition to our doc [Record-Level Access: Under the Hood](https://resources.docs.salesforce.com/sfdc/pdf/salesforce_record_access_under_the_hood.pdf) 

<iframe src="https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/model-sfdc.html" width='100%' height='800' frameborder="0"></iframe>

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

### Best Practice
- If many users have the same record access requirements, it’s efficient to place those users in a group and grant access to the group
instead of to the individuals. 
    - This practice saves time and results in fewer sharing rows, thus reducing your organization’s record access data volume.

- [AccountShare ERD](../../../mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=AccountShare)
```
Row Cause Picklist Values:

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
       
        "Survey Sharing Rule"
     ]

```

- Sharing Rule categories
- When you define a **sharing rule**, you can choose from the following categories in the owned by members of and Share with drop-down lists:

<table class="slds-table slds-table_bordered slds-max-medium-table_stacked slds-m-bottom_small">
        
        
        <thead class="slds-text-title_caps">
          <tr>
            <th class="slds-cell-wrap" scope="col" style="vertical-align:top;" width="28.57142857142857%">Category</th>

            <th class="slds-cell-wrap" scope="col" style="vertical-align:top;" width="71.42857142857143%">Description</th>

          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Managers Groups</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All direct and indirect managers of a user.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Manager Subordinates Groups</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">A manager and all direct and indirect reports who he or she manages.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Queues</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All records owned by the queue, excluding records owned by individual members of
              the queue. Available only in the <samp class="parmname">owned by members of</samp>
              list.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Public Groups</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p>All public groups defined by your administrator.</p><p style="margin-bottom:0;">If a partner portal or
                Customer Portal is enabled for your organization, the All Partner Users or All
                Customer Portal Users group displays. These groups includes all users allowed to
                access your partner portal or Customer Portal, except for high-volume portal
                users.</p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Roles</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All roles defined for your organization. This includes all of the users in the
              specified role.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Portal Roles</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p><span id="PortalRoles"><a name="PortalRoles"><!-- --></a>All roles defined for your organization’s partner
                portal or Customer Portal. This includes all users in the specified portal role,
                except high-volume portal users.</span></p><p style="margin-bottom:0;"><span id="PortalRoleName"><a name="PortalRoleName"><!-- --></a>A portal role name
                  includes the name of the account that it’s associated with, except for
                  person accounts, which include the user <a href="articleView?id=user_fields.htm&amp;type=5#UserAlias" ng-click="$event.preventDefault();clickHandler('articleView?id=user_fields.htm&amp;type=5#UserAlias', $event)"><samp class="parmname">Alias</samp></a>.</span></p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Roles and Subordinates</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p>All roles defined for your organization. This includes all of the users in the
              specified role plus all of the users in roles below that role, including partner
              portal and Customer Portal roles that contain users with a portal license
                type.</p><p>Portal roles are only included in this category if a partner portal or
                Customer Portal is enabled for your organization.</p><p style="margin-bottom:0;">The Roles, Internal and
                Portal Subordinates data set category is only available in your organization after
                you create at least one role in the role hierarchy.</p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Portal Roles and Subordinates</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p><span id="PortalRolesandSub"><a name="PortalRolesandSub"><!-- --></a>All roles defined for your organization’s
                partner portal or Customer Portal. This includes all of the users in the specified
                portal role plus all of the users below that role in the portal role hierarchy,
                except for high-volume portal users.</span></p><p style="margin-bottom:0;">A portal role name
                  includes the name of the account that it’s associated with, except for
                  person accounts, which include the user <a href="articleView?id=user_fields.htm&amp;type=5#UserAlias" ng-click="$event.preventDefault();clickHandler('articleView?id=user_fields.htm&amp;type=5#UserAlias', $event)"><samp class="parmname">Alias</samp></a>.</p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Roles and Internal Subordinates</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p>All roles defined for your organization. This includes all of the users in the
              specified role plus all of the users in roles below that role, excluding partner
              portal and Customer Portal roles.</p><p><span id="InternalCatDisplay"><a name="InternalCatDisplay"><!-- --></a>This category only
                  displays if a partner portal or Salesforce Customer Portal is enabled for your
                  organization.</span></p><p style="margin-bottom:0;">The Roles and Internal Subordinates data set category is
                only available in your organization after you create at least one role in the role
                hierarchy <em>and</em> enable a portal.</p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Roles, Internal and Portal Subordinates</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%"><p>All roles defined for your organization. This includes all of the users in the
              specified role plus all of the users in roles below that role, including partner
              portal and Customer Portal roles.</p><p>This category only
                  displays if a partner portal or Salesforce Customer Portal is enabled for your
                  organization.</p><p style="margin-bottom:0;">The Roles and Internal Subordinates data set category is
                only available in your organization after you create at least one role in the role
                hierarchy <em>and</em> enable a portal.</p></td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Territories</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All territories defined for your organization.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Territories and Subordinates</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All territories defined for your organization. This includes the specified
              territory plus all territories below it.</td>

          </tr>
          <tr>
            <td class="slds-cell-wrap" data-label="Category" width="28.57142857142857%">Guest User</td>

            <td class="slds-cell-wrap" data-label="Description" width="71.42857142857143%">All unauthenticated users in a community or site.</td>

          </tr>
        </tbody>
      </table>
- [Group ERD](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=Group)
- [GroupMember ERD](https://mohan-chinnappan-n.github.io/sfdc/fs-cloud/csv-viewer_fsc.html?f=GroupMember)



###  Group Maintenance Tables
- **Sharing rows** grant access to users and groups, but the data that specifies who belongs to **each group** resides in the Group Maintenance
tables. 
- These tables store membership data for every Salesforce group, including **system-defined groups**. 
    - System-defined groups are groups of users that Salesforce creates and manages internally to support various features and behaviors, such as queues. 
- This type of management lets the data that supports queues and personal or public groups coexist in the same database tables
    - unifies how - Salesforce manages the data. 
- For example, Salesforce can grant record access to a queue the same way it grants record access to a public group.

- Salesforce also uses **system-defined groups** to implement **hierarchies**. 
- During recalculation, Salesforce creates two types of system-defined groups:
    - **Role groups**
    - **RoleAndSubordinates groups**
 for every node in the **role hierarchy(RH)**. 

- If the organization has external organization-wide (OWD) defaults enabled, a third type of system-defined group, **RoleAndInternalSubordinates groups**, is created

![System Defined Groups](img/sysem-defined-groups-1.png)


- All three group types have:
    - Direct members, who are defined according to their group type
        - In **Role groups**, direct members are those members assigned to the role the group represents.
        - In **RoleAndSubordinates groups**, direct members are those members assigned to the role the group represents or one of its **subordinate roles**
        - In **RoleAndInternalSubordinates groups**, direct members are those members assigned to the role the group represents, or one of its **non-portal subordinate** roles.

    - Indirect members, who inherit record access from the group’s direct members and are assigned to **manager** roles

### Sample Role Hierarchy 
![RH](img/rh-1.png) 
![RH2](img/rh-2.png) 
- To support the **record access inheritance** this hierarchy establishes
    -  Salesforce defines the following Role and RoleAndSubordinates groups, resulting in **eight** total groups.

- Role Groups
    - By scanning the Role Groups, Salesforce can quickly identify the **indirect members** who **inherit** record access from users at that role. 
        -  For example: to see which users inherit record access from Bob in the role hierarchy 
            - Salesforce simply searches for Role groups that have Bob as a direct member (the East Sales Rep Role group), and finds all the indirect members in those groups (Marc and Maria).
- RoleAndSubordinates Groups
    - By scanning the RoleAndSubordinates groups, Salesforce can quickly see which users receive access through **role and subordinate** sharing rules. 
        - For example:  if a rule shares a set of records with users in the **Sales Executive role and their subordinates** 
            - Salesforce can identify those users by scanning the **Sales Executive RoleAndSubordinates group**.  ### Territory Management
- System-defined groups support Territory Management in a similar way.
- For each territory, Salesforce creates a:
    -  Territory group, in which users who are assigned to the territory are direct members, while users assigned to territories higher in the hierarchy are indirect members
    -  TerritoryAndSubordinates group, in which users who are assigned to that territory or territories lower in the hierarchy are direct members, while users assigned to territories higher in that branch are indirect members

### What happens if we do not have system-defined groups?

- Without system-defined groups, every record access attempt would have to send Salesforce traversing every branch in its hierarchies
- Jumping back and forth between tables of user data and tables of hierarchical data. 
- Salesforce would also have to **use disparate processes** to handle what are all essentially collections of users


### Sample Scenarios

-  Explains how Salesforce recalculates the Object Sharing and Group Maintenance tables according to various record access changes,
    - uses those calculations to determine record access. 
- Yellow highlights indicate data that grants access to the sample account record.
- The organization-wide default (OWD) settings are **Private for all objects**, and the role hierarchy and users are as follows.

- ![RH-e](img/rh-eg-1.png)
- Salesforce generates the following groups to support the record access inheritance the role hierarchy establishes.
- ![RH-e](img/rh-eg-2.png)

### Scenario 1 
- Maria creates an account record (A1) for Acme. Under the hood, Salesforce creates a new account record for Acme and an owner sharing
row for Maria in the Account Sharing table
- ![RH-e3](img/rh-eg-3.png)

### Scenario 2 
- Maria **manually shares** the Acme account record with Bob. Under the hood, Salesforce creates a sharing row in the Account Sharing table for Bob.
- For manual record sharing, programmatic record sharing, and team sharing, the Object Sharing table creates rows the same way but with different row causes.
- ![RH-e4](img/rh-eg-4.png)

### Scenario 3  
- Administrator creates a **sharing rule** that shares the Sales Executive’s records with the users in the Services Executive role and their subordinates. 
- Under the hood, Salesforce creates **a sharing row in the Account Sharing table** for the Services Exec RoleAndSubordinates group, giving Frank and Sam access to the Acme record.
- ![RH-e5](img/rh-eg-5.png)

### Scenario 4  
- Maria changes the **owner** of the Acme record to Wendy. 
- When a record owner changes, Salesforce deletes its associated sharing rows with Manual row causes, 
  - Bob loses access to the record. 
  - Also, because Maria, the Sales Executive, no longer owns the record, the rule from Scenario 3 no longer applies. 
   - Under the hood, Salesforce deletes the sharing row for the Services Exec RoleAndSubordinates group from Scenario 3
        -  causing Frank and Sam to lose access to the Acme record. 
    - Salesforce also replaces Maria’s name with Wendy’s in the Account Sharing table
- The red ovals in this diagram indicate the many field changes for this seemingly minor change.

- ![RH-e6](img/rh-eg-6.png)

### Scenario 6   - to show lot goes under the hood when an administrator takes what looks like a simple action, such as changing a user’s role. 
-  A new role has been created for the Small and Medium Business Partner Sales organization.
- Instead of a broad sharing rule providing access to all Sales data to the Services branch, 
    - there is a more focused sharing rule providing access only to data from the West Sales Rep Role.  
        - The SMB Partner Sales data is not shared to Services.
-  Wendy moves from the West Sales Rep role to the new SMB Partner Sales role, which is located in a separate branch of
the role hierarchy.
- ![RH-e7](img/rh-eg-7.png)

- the underlying sharing system performs the following maintenance under the hood.
    - If Wendy is the first member in her new role to own any data
        -  Salesforce arranges access to her data for all users in roles above her in the hierarchy. 
        - This arrangement is performed by making those users indirect members of Wendy’s new role. 
        - Note the inclusion of Maria and Marc in the new SMB Partner Sales role
- ![RH-e8](img/rh-eg-8.png)

- If Wendy’s new role has different settings than her old role for access to child records of Account : Contacts, Cases, and Opportunities
    - Salesforce removes some of Wendy’s shares to those records  
    - Adds new shares to reflect the change in setting
- ![RH-e9](img/rh-eg-9.png)


-  If Wendy owns any accounts that have been enabled for either the **Customer or Partner** portals
    -  Salesforce makes changes to group membership
        – Adjusts shares that provide access in the hierarchy to records owned by or shared to portal users
        - For each portal-enabled account, 1–3 roles are appended to the main hierarchy below the account owner’s role. 
        - When Wendy moves, Salesforce removes these portal roles from her old role and appends them to her new role for every portal-enabled account she owns.


### Sharing Settings
- Sharing Rule
    - Use sharing rules to make automatic exceptions to your organization-wide sharing settings for defined sets of users.
    - **Roles and subordinates** includes all users in a role, and the roles below that role.
    - You can use sharing rules only to **grant wider access** to data, not to restrict access.
![sharing setting owner](img/sharing-setting-owner-1.png)
![sharing setting crit](img/sharing-settings-crit-1.png)


