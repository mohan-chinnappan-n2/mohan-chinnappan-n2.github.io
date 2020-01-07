## Introduction

- Caching of data is primarily a performance-optimization technique
- Rather than recalculating or re-retrieving the information, data can be stored in an easy-to-access place—cached—and reused in later transactions.
- Platform Cache can allow  to make complicated applications more performant

- Other options
    - Visualforce view state as a cache 
        -  passes information from the server to the client and back to the server
    - Custom Settings can be used like a cache
        - only for limited amounts of data
    - Database as a poor-man’s cache
        - Once information is calculated, it can be saved off into an sObject, and retrieved again in a subsequent transaction. 
        - Requires lot of construction work.

- Internally, our application utilizes caching for a variety of use cases. We are offering a slice of that cache space to you and your application
- Provides a simple API in Apex to store and retrieve items in a key/value store. 
- Offers a built-in way to retrieve cached data (Map) in Visualforce and in declarative formulas
- Session Cache
    - Cache space for an individual user session
    - Implicitly tied to each user session
    - Help improve application performance when you have time-consuming calculations to do, or large data structures to access throughout a user’s interaction.
    - System keeps the different values connected to the correct user session
- Org Cache 
    - Cache items for use by any user across the application. 
    - Shared cache for your entire organization
    - Example: navigation bar for the profiles


## Cache Management
- Define multiple different caches in your org, each with a specific use.    
- Developers will be able to access any number of these in any part of your application code.
- Set aside some space for less entropy items
- Some space for high entropy items
