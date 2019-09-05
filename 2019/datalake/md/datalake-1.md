## Data Lake

### What is Data Lake?
 - A data storage strategy
- Pool of unstructured semi-structured and structured data, stored as-is over extended periods of time, without a specific purpose in mind.
- Allows multiple points of collection and multiple points of access (batch, interactive, online, search, in-memory,... ) for large volumes of data.
- Allows collection of data for future needs before it’s possible to know what those needs are, 
- Data stored is raw, Data Lake shouldn’t be accessed directly 
 
### Comparing with Data Mart  ( Quoting: James Dixon - who coined the term 'Data Lake')
 -  If you think of a Data Mart as a store of bottled water – cleansed and packaged and structured for easy consumption 
 -  Data Lake is a large body of water in a more natural state. 
    - The contents of the Data Lake stream in from a source to fill the lake, and various users of the lake can come to examine, dive in, or take samples.” 
 - The cost of storing data is relatively low as compared to the Data Warehouse

### Comparing Data Warehouse and Data Lake

![dw-vs-dl](img/datalake-vs-dw.png)



### Comparing RDBMS, Data Warehouse, Data Mart and Data Lake
![rdbms-dw-vs-dm-dl](img/dw-vs-dm-vs-dl.png)


### Heroku Connect for Data Lake

 - Provides bi-directional synchronization between Salesforce and Heroku Postgres
 - Allows mapping between Salesforce Objects this  Postgres database. After the service is configured, it will mirror the Salesforce data on a periodic schedule
 - Unifies the data in your Postgres database
 - Data from the this Postgres database becomes source for the Data Lake as shown in this example architecture here:

 ![Data lake Heroku connect](https://d2908q01vomqb2.cloudfront.net/77de68daecd823babbb58edb1c8e14d7106e83bb/2019/04/03/FinancialForce-1.png) 