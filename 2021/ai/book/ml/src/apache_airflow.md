# Apache Airflow

 
Apache Airflow is a platform to programmatically author, schedule and monitor workflows. 
TFX (TensorFlow Extended) uses **Airflow** to author workflows as directed acyclic graphs ([DAGs](https://en.wikipedia.org/wiki/Directed_acyclic_graph)) of tasks. 

The Airflow **scheduler executes tasks** on an array of workers while following the specified dependencies. 

Rich command line utilities (CLI) make performing complex surgeries on DAGs a snap. 
The rich user interface (UI) makes it easy to:
- **visualize pipelines** running in production, 
- **monitor progress**, 
- **troubleshoot issues** when needed. 

When workflows are **defined as code**, they become more maintainable, versionable, testable, and collaborative.

### DAG

DAG (directed acyclic graph) is a directed graph with no directed cycles. That is, it consists of vertices and edges, with each edge directed from one vertex to another, such that following those directions will **never form a closed loop**. 




