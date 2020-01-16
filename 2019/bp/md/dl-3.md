## Data loader automation

### Use case

- We need to insert 1000 Account records around 11:45 pm every night. How this can be done on a Windows machine using Data Loader? Also we like notify an enterprise system about the data load completion.

### Steps

1. User Data Loader command line
2. Create a batch batch run the data import  (say: run_dl.bat)

```
# content of example run_dl.bat:

java -cp ..\dataloader-47.0.0-uber.jar -Dsalesforce.config.dir=C:\dl\Command Line\Config com.salesforce.dataloader.process.ProcessRunner  accountInsert

```
3. Automate this task (running the run_dl.bat at 11:45 pm every night) using Windows 10 Task Scheduler 
![Win task scheduler](img/win-task-scheduler-1.png)


4. If you need to notify other systems in the enterprise  about data load completion:
    - Use [Platform Events](https://mohan-chinnappan-n.github.io/sfdc/pevents.html#/home)
    - Other enterprise system  can be a subscriber to the Salesforce Event Bus  
    - ![Event bus](https://mohan-chinnappan-n.github.io/sfdc/img/pe/pe-1.png)
    - Publish the data load completion like this:
    - ![ publish event](https://mohan-chinnappan-n.github.io/sfdc/img/pe/publish-event.png)
    - On the receiving end of the enterprise system, event handler can do the required processing


  
