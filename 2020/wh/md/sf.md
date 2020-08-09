## Snowflake

- Cloud data warehouse

- Need for the properly analyzed data on timely basis provides insights necessary to make well-informed decisions 
- Orgs have diverse range of sources
    - internal 
    - external
    - data marts
    - cloud based systems
    - machine generated data
        - Internet of Things (IoT) — an endless collection of devices that communi- cate data via the Internet, including smartphones, thermostats, refrigerators, oil rigs, home security systems, smart meters, and much more. D
        - It contains valuable data but also a lot of noise.
- Analysts often wait 24 hours or more for data flow into the data warehouse before they can do the analysis 


### Data warehouse as  a service (DWaaS)
- Alternate to the on-prem data warehousing

### Data warehouse
- dedicated to storing and analyzing data to reveal 
    - trends
    - patterns
    - correlations
- provide info and insights
- analyzing data directly from those transactional databases slowed  the process
- data was duplicated in a data warehouse for analysis, leaving the database to focus on transactions.

### Current advantages
- The cloud: A key factor driving the evolution of the modern data warehouse is the cloud. This creates access to near- infinite, low-cost storage; improved scalability; the outsourcing of data warehousing management and security to the cloud vendor; and the potential to pay for only the storage and computing resources actually used.

- Massively parallel processing (MPP)

- With columnar storage, each data element of a record is stored in a column. With this approach, a user can query just one data element, such as gym members who have paid their dues, without having to read everything else in that entire record, which may include each member’s ID number, name, age, address, city, state, payment information, and so on. This approach can provide a much faster response to these kinds of analytic queries.

- Vectorized processing: This form of data processing for data analytics (the science of examining data to draw conclusions) takes advantage of the recent and revolution- ary computer chip designs. This approach delivers much faster performance versus older data warehouse solutions built decades ago for older, slower hardware technology.

- Solid state drives (SSDs): Unlike hard disk drives (HDDs), SSDs store data on flash memory chips, which accelerates data storage, retrieval, and analysis. A solution that takes advantage of SSDs can deliver significantly better performance.

### DWaaS

- A true SaaS data warehouse: With this option, often referred to as DWaaS, the vendor delivers a complete cloud data warehouse solution that includes all hardware and software, and nearly eliminates all of the tasks related to establishing and managing the performance, governance, and security required with a data warehouse. Clients typically pay only for the storage and computing resources they use, when they use them. This option should also scale up and down on demand by adding unlimited amounts of computing power dedicated to each workload, while an unlimited number of workloads operate concurrently without impacting performance.

- Data size:
    - petabytes. One petabyte is equal to 1 million gigabytes.

![Cloud DW](img/cloud-dw-1.png) 


### Data Lakes

- The growing need to have massive amounts of raw data in different formats all in a single location, spawned what’s now considered the legacy data lake. 
- goal: wanted to store all of their data in one location at a reasonable cost. 
    - By adding a modern cloud data warehouse to your existing data lake, or building your data lake within the data warehouse, you can easily achieve that original vision for the data lake: cost-effectively loading, transforming, and analyzing unlimited amounts of structured and semi-structured data — with near- unlimited storage and compute resources.


- Using elasticity to enable analytics
    - Ad hoc data analysis, which emerges all the time, answers a single, specific, business question. Dynamic elasticity and dedicated resources for each workload enables these queries without slowing down other workloads.
    - Event-driven analytics demand constant data. They incorpo- rate new data to update reports and dashboards on a continual basis, so senior managers can monitor the business in real time or near-real time. Ingesting and processing streaming data requires an elastic data ware- house to handle variations and spikes in data flow.

### Links
- [book on Snowflake](img/SnowflakeDataeBook.pdf)
