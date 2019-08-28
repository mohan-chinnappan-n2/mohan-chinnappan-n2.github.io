## Flatten  Transformation

- The flatten transformation flattens hierarchical data.
-  For example, you can flatten the Salesforce role hierarchy to implement **row-level security** on a dataset based on the role hierarchy.

-  We specify the field that contains every node in the hierarchy 

![org chart](img/df/flatten-org-chart.svg)
<table border='1'>
<tr>
 <th>Role Id(Self Id)</th>
 <th>Role Name</th>
 <th>Parent Role Id</th>
</tr>

<tr>
<td>1 </td>
 <td>Sales Rep 1</td>
 <td>10</td>
</tr>

<tr>
<td>2</td>
 <td>Sales Rep 2</td>
 <td>11</td>
</tr>

<tr>
<td>10</td>
 <td>Manager 1</td>
 <td>20</td>
</tr>

<tr>
<td>11</td>
 <td>Manager 2</td>
 <td>21</td>
</tr>

<tr>
<td>20</td>
 <td>VP 1</td>
 <td>30</td>
</tr>

<tr>
<td>21</td>
 <td>VP 2</td>
 <td>30</td>
</tr>

<tr>
<td>30</td>
 <td>CEO</td>
 <td></td>
</tr>





</table>

- The flatten transformation generates one record for each hierarchy node

- generates two hierarchy  columns for each generated record:
    - Roles (multi_field)
    - Role  Path (path_field)

<table border='1'>
<tr>
 <th>Role Id(Self Id)</th>
 <th>Role Name</th>
 <th>Parent Role Id</th>
 <th>Roles</th>
 <th>RolePath</th>
</tr>

<tr>
<td>1 </td>
 <td>Sales Rep 1</td>
 <td>10</td>
 <td>10,20,30</td>
 <td>\10\20\30</td>
</tr>

<tr>
<td>2</td>
 <td>Sales Rep 2</td>
 <td>11</td>
  <td>11,21,30</td>
 <td>\11\21\30</td>
</tr>

<tr>
<td>10</td>
 <td>Manager 1</td>
 <td>20</td>
 <td>20,30</td>
 <td>\20\30</td>
</tr>

<tr>
<td>11</td>
 <td>Manager 2</td>
 <td>21</td>
  <td>21,30</td>
 <td>\22\30</td>
</tr>

<tr>
<td>20</td>
 <td>VP 1</td>
 <td>30</td>
 <td>30</td>
 <td>\30</td>

</tr>

<tr>
<td>21</td>
 <td>VP 2</td>
 <td>30</td>
  <td>30</td>
 <td>\30</td>
</tr>

<tr>
<td>30</td>
 <td>CEO</td>
 <td></td>
 <td></td>
 <td></td>
 
</tr>





</table>

- You can also configure the flatten transformation to include the self ID node in the generated hierarchy columns (``` include_self_id = true ```).


<table border='1'>
<tr>
 <th>Role Id(Self Id)</th>
 <th>Role Name</th>
 <th>Parent Role Id</th>
 <th>Roles</th>
 <th>RolePath</th>
</tr>

<tr>
<td>1 </td>
 <td>Sales Rep 1</td>
 <td>10</td>
 <td>1,10,20,30</td>
 <td>\1\10\20\30</td>
</tr>

<tr>
<td>2</td>
 <td>Sales Rep 2</td>
 <td>11</td>
  <td>2,11,21,30</td>
 <td>\2\11\21\30</td>
</tr>

<tr>
<td>10</td>
 <td>Manager 1</td>
 <td>20</td>
 <td>10,20,30</td>
 <td>\10\20\30</td>
</tr>

<tr>
<td>11</td>
 <td>Manager 2</td>
 <td>21</td>
  <td>11,21,30</td>
 <td>\11\22\30</td>
</tr>

<tr>
<td>20</td>
 <td>VP 1</td>
 <td>30</td>
 <td>20,30</td>
 <td>\20\30</td>

</tr>

<tr>
<td>21</td>
 <td>VP 2</td>
 <td>30</td>
  <td>21,30</td>
 <td>\21\30</td>
</tr>

<tr>
<td>30</td>
 <td>CEO</td>
 <td></td>
 <td>30</td>
 <td>30</td>
 
</tr>





</table>


```

"Extract_UserRole": {
   "action": "sfdcDigest",
   "parameters": {
      "object": "UserRole",
      "fields": [
         { "name": "Id" },
         { "name": "Name" },
         { "name": "ParentRoleId" }
      ]
   }
},
"Flatten_UserRole": {
   "action": "flatten",
   "parameters": {
      "source": "Extract_UserRole",
      "self_field": "Id",
      "parent_field": "ParentRoleId",
      "multi_field": "Roles",
      "path_field": "RolePath",
      "include_self_id":false
   }
},


"Augment_User_FlattenUserRole": {
   "action": "augment",
   "parameters": {
      "left": "Extract_User",
      "left_key": [ "UserRoleId" ],
      "relationship": "Role",
      "right": "Flatten_UserRole",
      "right_key": [ "Id" ],
      "right_select": [ 
         "Id",
         "Name",
         "Roles",
         "RolePath"
      ]
   }
},

```

### Links

- [flatten Transformation
](https://help.salesforce.com/articleView?id=bi_integrate_flatten_transformation.htm&type=5)
