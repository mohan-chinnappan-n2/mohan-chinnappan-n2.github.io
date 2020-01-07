## Introduction

- Rather than recalculating or re-retrieving the information, data can be stored in an easy-to-access place—cached—and reused in later transactions.
- Distributed Cache (Redis)
- Other options
    -  Visualforce view state
        -  When amount of data gets large, view state becomes a bad way to share information between transactions. 
    - Custom Settings can be used like a cache  
        - Limited amounts of data
    -  Database as a poor-man’s cache
        - Once data is calculated, it can be saved off into an sObject, and retrieved again in a subsequent transaction. 
        - Requires that you do a lot of construction work.

- Internally, our application utilizes caching for a variety of use cases.
    - We are giving a slice of that cache space to you and your applications in the name of Platform Cache 
