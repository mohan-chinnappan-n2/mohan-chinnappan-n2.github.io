## SFO Customization

### How to setup up the Task Type for the SFO created Tasks

![Tasktype1](img/tasktype-1.png)
![Tasktype2](img/tasktype-2.png)

- Demo

![SFO default Task](img/task-type-setting.gif)


### How to 

- Change the Task Type for the Email Reply
- Create Task for the Oppty if the email has clue about Oppty
- Upsert on the existing Tasks

![SFO flow](img/sfo-seq-1.png)

#### Flow file for the seq editor [Editor](https://mohan-chinnappan-n2.github.io/2019/viz/seq/seq.html) 

```
Title: SFO 
User->Outlook:Send Email
Outlook->SFO:Provide the event
SFO->SF:Create a Task with\n default Task Type
SF->TaskTrigger@before_insert:Process
Note right of TaskTrigger@before_insert: - If Oppty Clue found\n insert Task for Oppty as well\n - Upsert if Task already created
User->Outlook:Reply Email
Outlook->SFO:Provide the event
SFO->SF:Create a Task with\n default Task Type
SF->TaskTrigger@before_insert:Process 
Note right of TaskTrigger@before_insert: - Parse the\n email subject for RE:\n- Change the Task Type\n and insert



```
