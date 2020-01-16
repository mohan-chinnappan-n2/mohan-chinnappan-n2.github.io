## Using Data Loader CLI

### Windows only

1.Download Dataloader for Windows
![dl-windows](img/dl-windows-download-1.png)

2. Unzip the dataloader_win.zip

![dl-zip-content](img/dl-zip-content.png)

3. cd to dataloder_win\bin folder

``` 
cd dataloader_win\bin
```

4. create the encryption file

- Encrypt command will run this command using java (make sure that you have Java installed and JAVA_HOME env is set correctly)

``` 
encrypt.bat -k dl.key

# this will be become
# java -cp ..\dataloader-47.0.0-uber.jar com.salesforce.dataloader.security.EncryptionUtil -k

```

5.  Create Encrypted password

```
encrypt.bat –e <salesforce_org_password> dl.key

# this will be become
# java -cp ..\dataloader-47.0.0-uber.jar com.salesforce.dataloader.security.EncryptionUtil -e dl.key

# this command will emit encrypted password
 
```

6. Create a File Mapping file (sdl file)

- This maps what is in the CSV column field header value to SObject field name
- For complex mappings, you can use the Data Loader user interface to map source and destination fields and then save those mappings to an .sdl file.
```
#Mapping values
Name=Name
NumberOfEmployees=NumberOfEmployees
Industry=Industry


```

- Out input csv file looks like this

```
Name,Industry,NumberOfEmployees
Dickenson plc,Consulting,120
GenePoint,Biotechnology,265
Express Logistics and Transport,Transportation,12300
Grand Hotels & Resorts Ltd,Hospitality,5600
```


7. Create the Configuration File

- Make a copy of this  process-conf.xml file
- The process-conf.xml file contains the information that Data Loader needs to process the data
- Each <bean> in the process-conf.xml file refers to a single process such as an insert, upsert, or export. Therefore, this file can contain multiple processes. 
![process file](img/dl-process.xml.png)

- Sample file
``` xml
<!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN" "http://www.springframework.org/dtd/spring-beans.dtd">
<beans>
    <bean id="accountMasterProcess"
          class="com.salesforce.dataloader.process.ProcessRunner"
          singleton="false">
        <description>AccountMaster job gets the Customer record updates from ERP (Oracle financials) and uploads them to salesforce using 'upsert'.</description>
        <property name="name" value="accountMasterProcess"/>
        <property name="configOverrideMap">
            <map>
                <entry key="sfdc.debugMessages" value="true"/>
                <entry key="sfdc.debugMessagesFile" value="c:\dataloader\samples\status\accountMasterSoapTrace.log"/>
                <entry key="sfdc.endpoint" value="https://login.salesforce.com"/>
                <entry key="sfdc.username" value="user@mycompany.com"/>
                <!-- password below has been encrypted using key file, therefore it will not work without the key setting: process.encryptionKeyFile
                the password is not a valid encrypted value, please generate the real value using encrypt.bat utility -->
                <entry key="sfdc.password" value="5555555555555555"/>
                <entry key="process.encryptionKeyFile" value="c:\users\username\sample.key"/>
                <entry key="sfdc.timeoutSecs" value="600"/>
                <entry key="sfdc.loadBatchSize" value="200"/>
                <entry key="sfdc.externalIdField" value="Oracle_Id__c"/>
                <entry key="sfdc.entity" value="Account"/>
                <entry key="process.operation" value="upsert"/>
                <entry key="process.mappingFile" value="c:\dataloader\samples\conf\accountMasterMap.sdl"/>
                <entry key="dataAccess.name" value="queryAccount"/>
                <entry key="dataAccess.type" value="databaseRead"/>
                <entry key="process.initialLastRunDate" value="2005-12-01T00:00:00.000-0800"/>
            </map>
        </property>
    </bean>
    <bean id="opportunityUpsertProcess"
          class="com.salesforce.dataloader.process.ProcessRunner"
          singleton="false">
        <description>Opportunity Upsert job gets the Customer record updates from a CSV file and uploads them to salesforce using 'upsert'.</description>
        <property name="name" value="opportunityUpsertProcess"/>
        <property name="configOverrideMap">
            <map>
                <entry key="sfdc.endpoint" value="https://login.salesforce.com"/>
                <entry key="sfdc.username" value="user@mycompany.com"/>
                <!-- password below has been encrypted using key file, therefore it will not work without the key setting: process.encryptionKeyFile
                the password is not a valid encrypted value, please generate the real value using encrypt.bat utility -->
                <entry key="sfdc.password" value="5555555555555555"/>
                <entry key="process.encryptionKeyFile" value="c:\users\username\sample.key"/>
                <entry key="sfdc.timeoutSecs" value="600"/>
                <entry key="sfdc.loadBatchSize" value="200"/>
                <entry key="sfdc.externalIdField" value="Oracle_Id__c"/>
                <entry key="sfdc.entity" value="Opportunity"/>
                <entry key="process.operation" value="upsert"/>
                <entry key="process.mappingFile" value="c:\dataloader\samples\conf\opportunityUpsertMap.sdl"/>
                <entry key="dataAccess.name" value="c:\dataloader\samples\data\opportunityData.csv"/>
                <entry key="dataAccess.type" value="csvRead"/>
                <entry key="process.initialLastRunDate" value="2006-12-01T00:00:00.000-0800"/>
            </map>
        </property>
    </bean>
    <bean id="databaseAccountExtractProcess"
          class="com.salesforce.dataloader.process.ProcessRunner"
          singleton="false">
        <description>DatabaseAccountExtract job gets account info from salesforce and updates or inserts info into database."</description>
        <property name="name" value="databaseAccountExtract"/>
        <property name="configOverrideMap">
            <map>
                <entry key="sfdc.debugMessages" value="false"/>
                <entry key="sfdc.debugMessagesFile" value="c:\dataloader\samples\status\sfdcSoapTrace.log"/>
                <entry key="sfdc.endpoint" value="https://login.salesforce.com"/>
                <entry key="sfdc.username" value="user@mycompany.com"/>
                <!-- password specified below is invalid, please generate one using the encrypt.bat utility -->
                <entry key="sfdc.password" value="1111111111111111"/>
                <entry key="process.encryptionKeyFile" value="c:\users\username\sample.key"/>
                <entry key="sfdc.timeoutSecs" value="600"/>
                <entry key="sfdc.loadBatchSize" value="200"/>
                <entry key="sfdc.entity" value="Account"/>
                <entry key="sfdc.extractionRequestSize" value="500"/>
                <entry key="sfdc.extractionSOQL" value="Select Id, Name, Type, ParentId, Phone, AccountNumber, Website, Sic, AnnualRevenue, NumberOfEmployees, TickerSymbol, Oracle_Id__c FROM Account"/>
                <entry key="process.operation" value="extract"/>
                <entry key="process.mappingFile" value="c:\dataloader\samples\conf\accountExtractToDbMap.sdl"/>
                <entry key="dataAccess.type" value="databaseWrite"/>
                <entry key="dataAccess.name" value="updateAccount"/>
            </map>
        </property>
    </bean>
    <bean id="csvAccountExtractProcess"
          class="com.salesforce.dataloader.process.ProcessRunner"
          singleton="false">
      <description>csvAccountExtract job gets account info from salesforce and saves info into a CSV file."</description>
        <property name="name" value="csvAccountExtract"/>
        <property name="configOverrideMap">
            <map>
                <entry key="sfdc.debugMessages" value="false"/>
                <entry key="sfdc.debugMessagesFile" value="c:\dataloader\samples\status\sfdcSoapTrace.log"/>
                <entry key="sfdc.endpoint" value="https://login.salesforce.com"/>
                <entry key="sfdc.username" value="user@mycompany.com"/>
                <!-- password specified below is invalid, please generate one using the encrypt.bat utility -->
                <entry key="sfdc.password" value="1111111111111111"/>
                <entry key="process.encryptionKeyFile" value="c:\users\username\sample.key"/>
                <entry key="sfdc.timeoutSecs" value="600"/>
                <entry key="sfdc.loadBatchSize" value="200"/>
                <entry key="sfdc.entity" value="Account"/>
                <entry key="sfdc.extractionRequestSize" value="500"/>
                <entry key="sfdc.extractionSOQL" value="Select Id, Name, Type, ParentId, Phone, AccountNumber, Website, Sic, AnnualRevenue, NumberOfEmployees, TickerSymbol, Oracle_Id__c FROM Account"/>
                <entry key="process.operation" value="extract"/>
                <entry key="process.mappingFile" value="c:\dataloader\samples\conf\accountExtractMap.sdl"/>
                <entry key="dataAccess.type" value="csvWrite"/>
                <entry key="dataAccess.name" value="c:\dataloader\samples\data\extract.csv"/>
            </map>
        </property>
    </bean>
</beans>
```

- Edit the sample file content as follows

```xml
<!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN" "http://www.springframework.org/dtd/spring-beans.dtd">
<beans>
    <bean id="accountInsert" class="com.salesforce.dataloader.process.ProcessRunner" singleton="false">
        <description>
            accountInsert job gets the account record from the CSV file 
            and inserts it into Salesforce.
        </description>
       
        <property name="name" value="accountInsert"/>
        <property name="configOverrideMap">
            <map>
                <!--
                  NOTE: Modify the folder locations as need to meet your folder values
                      : sfdc.endpoint modify it to match your org
                -->
                <entry key="sfdc.debugMessages" value="true"/>
                <entry key="sfdc.debugMessagesFile" 
                    value="C:\dl\Log\accountInsertSoapTrace.log"/>
                <entry key="sfdc.endpoint" value="https://servername.salesforce.com"/>
                <entry key="sfdc.username" value="yourusername@Org.com"/>
                <!--Password below has been encrypted using key file, 
                    therefore, it will not work without the key setting: 
                    process.encryptionKeyFile.
                    The password is not a valid encrypted value, 
                    please generate the real value using the encrypt.bat utility -->
                <entry key="sfdc.password" value="e8a68b73992a7a54"/>
                <entry key="process.encryptionKeyFile" 
                    value="c:\Users\{user}\dl.key"/>
                <entry key="sfdc.timeoutSecs" value="600"/>
                <entry key="sfdc.loadBatchSize" value="200"/>
                <entry key="sfdc.entity" value="Account"/>

                <entry key="process.operation" value="insert"/>

               <!-- field mapping sdl file -->
                <entry key="process.mappingFile" 
                    value="C:\dl\Command Line\Config\accountInsertMap.sdl"/>
 
              <!-- data input csv file -->
                <entry key="dataAccess.name" 
                    value="C:\dl\In\insertAccounts.csv"/>

                <!-- log files for success ad error -->
                <entry key="process.outputSuccess" 
                    value="c:\dl\Log\accountInsert_success.csv"/>

                <entry key="process.outputError" 
                    value="c:\dl\Log\accountInsert_error.csv"/>
                <entry key="dataAccess.type" value="csvRead"/>
                <!--
                <entry key="process.initialLastRunDate" 
                    value="2005-12-01T00:00:00.000-0800"/>
                -->
            </map>
        </property>
    </bean>
</beans>
```
8. Import Data

```
 process.bat "<file path to process-conf.xml>" <process name>

# process name is same as the bean id as in process-conf.xml file (which accountInsert in our case)
# so our command will be
# process.bat "C:\dl\Command Line\Config" accountInsert

# this will get expanded to:
java -cp ..\dataloader-47.0.0-uber.jar -Dsalesforce.config.dir=C:\dl\Command Line\Config com.salesforce.dataloader.process.ProcessRunner  accountInsert


```

9. Check the status

- Check the log files: insertAccounts_success.csv and insertAccounts_error.csv


