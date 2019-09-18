## Dataloader Data Access Object 

- When running Data Loader in batch mode from the command line, several data access objects are supported. 
- A data access object **allows access** to an external data source outside of Salesforce. 
    - They can implement a read interface (DataReader), a write interface (DataWriter), or both. 
        - databaseRead :     Allows the reading of a database. Use database-conf.xml to configure database access.
        - databaseWrite:      Allows writing to a database. Use database-conf.xml to configure database access.


###  SQL Configuration ( SqlConfig class)
- Run Data Loader in batch mode from the command line (Windows only)
- Bean must be of the type  ```com.salesforce.dataloader.dao.database.SqlConfig```  and have these properties
    -  sqlString  : The SQL code to be used by the data access object. 

- [Configure Database Access](https://developer.salesforce.com/docs/atlas.en-us.dataLoader.meta/dataLoader/loader_dbaccess.htm)
- [Configure Database Access](https://help.salesforce.com/articleView?id=loader_dbaccess.htm&type=5)
- [SQL Configuration](https://help.salesforce.com/articleView?id=loader_sql.htm&type=5)
- [Data Access Objects](https://help.salesforce.com/articleView?id=loader_accessobjects.htm&type=5)
