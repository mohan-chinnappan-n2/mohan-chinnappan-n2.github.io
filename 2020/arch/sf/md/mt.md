# Salesforce Multi Tenant

## Where the data lives?
- ![Instance](img/sf-mt-1.png)
 Data Lives at Instances (say NA61) in 2 data centers
    - Primary Data Center
    - Fail-over Data Center
- Data Center (say DFW)
    - Instance Groups
        - Core 
            - Primiary Instances (Group of 4)
            - DR Instances  (Secondary of some others)
        - Sandboxes
            - Primary 
            - Fail-over  
    - Shared Services for the instance groups
        - Search engines
        - Fil FFX
        - Einstein
    - Data Center wide Shared Services
        - HSM (hardware security module) for Encryption

## 4 Online copies of Data
- ![4 Copies of data0](img/sf-mt-2.png)
- Every 6 months, Site Switch is performed

## What Makes an instance

- ![Instance](img/sf-mt-3.png)

