## DevOps

DevOps is a set of practices that combines:
- software development (Dev) 
- information-technology operations (Ops)

with a goal:
 -  to shorten the **systems development life cycle** 
 -  provide continuous delivery (CD) with high software quality.



### Goals (5 Pillars)
![devops goals](img/devops-goals-1.png)

### 1. Reduce Organization Silos
- Reduce the Silos between 
    - Dev  - who writes code 
    - Ops  - operators who make sure that code continues to run
- Involvement of cross-functional teams
    - Security and Privacy Review - Involving them in daily stand ups
    - Legal Review
    - PR
    - Marketing Review




### 2. Accept Failure as Normal 
- Any system build by humans is inherently  unreliable
- This fact should be built into the core of our business
- Plan for how to recover from a failure in advance
    - plan for a rollback if failure happens
    

### 3. Implement Gradual Change 
- Deploy smaller changes at a time 
    - smaller the changes, easier to identify the problem
- Gradual change w.r.t your business and your industry
- Deployment frequency depends on the industry you are in (e.g. Financial Services...) to meet regulatory requirements

### 4. Leverage Tooling and Automation
- Automate as much as possible
    - Create Users
    - Install right packages

- Tools like Chef, Puppet, Terraform supports DevOps
- Make things repeatable 
- Make patterns out the work


### 5. Measure Everything
- Set clear metrics for success
- Measurable 
- Numbers to support the efforts we are driving
- Key for the success


### DevOps Vs. SRE (by Google's Seth Vargo)
<iframe width="800" height="500" src="https://www.youtube.com/embed/0UyrVqBoCAU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>



## SRE (Site Reliability Engineering)
```
class SRE implements DevOps {

// DevOps is abstract, not prescriptive
// SRE is concrete implementation of DevOps interface

}

```

- Make the production system up and running all the time at scale
- Prescriptive way to do DevOps
- Pioneered by Google
    - what happens when a software engineer is tasked with what used to be called operations (Ben Treynor)
- Doing "ops" related work such as issues, on-call, and manual intervention as well as scaling or automation.
- Satisfies 5 pillars of DevOps
    1. Share ownership with Developers using shared set of tooling
    2. Service Level Objectives - how much fault the system can have
        - when an outage occurs, it is nobody is fault. Instead find ways to improve the system to move forward
        - stats say: most of the outages are due to config changes/error
        - collect outage info in a database and run analytics to improve the system 
    3. Move fast to reduce the cost of failure
        - Small iterative deployments
    4.  TOIL 
        - Invest in time and resources to work bring value to the system in long run
        - Manual tasks done in this year should be automated away so that **no manual tasks** in next year
    5. Measure everything (SL*)
        - TOIL (manual, repetitive, automatable, short time value)
            - e.g. SSHing to the system - short time value and manual - but automatable (toilable - up to 10% time)
            - a task which is needed once in a year takes 10 min. to do automate takes: 20 hrs
            - good for new comers to learn the system
            -  on large scale, eliminate toils
        - Reliability
        - SLI - Service Level Indictor - A metric about the system (point in time) - UP or DOWN
            - Request Latency
            - Requests per sec
            - Failures per request
        -  ``` success = successful_requests / failed_requests; // say: 99% of the requests are successful ```
        - SLO - Binding target for a collection of SLIs (say a over 6 months)
            - How much UPs or DOWN we have have for a period of time (say 6 months)
        - SLA - Service Level Agreement
            - Business agreement between the customer and service provider - based on SLOs
        
        ``` SLIs drive SLO which inform SLAs ```
        - ![SL*](img/sls-1.png)




 

### References

- [Google Cloud DevOps: Speed With Reliability and Security (Cloud Next '19)](https://www.youtube.com/watch?v=cXXZ-AOCALU) 



