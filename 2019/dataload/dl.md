## Loading Large Data

## Bulk API

- [Use Bulk API](https://trailhead.salesforce.com/en/content/learn/modules/api_basics/api_basics_bulk)

- Steps
    - Create a job with  resource for creating Bulk API jobs: (/services/data/v45.0/jobs/ingest)
        - POST
        - payload
            - job properties
                ```json
                { "operation" : "insert", "object" : "Account", "contentType" : "CSV", "lineEnding" : "CRLF" } 
                ```



