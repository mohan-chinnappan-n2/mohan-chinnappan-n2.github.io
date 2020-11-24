## Dataset Field Usage

```
$ sfdx mohanc:ea:dataset:fieldUsage -h
Get Field Usage Info for the given dataset

USAGE
  $ sfdx mohanc:ea:dataset:fieldUsage

OPTIONS
  -d, --datasetname=datasetname                   Dataset name to analyzed
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE

              Get Field Usage data for the given dataflow
              sfdx mohanc:ea:dataset:fieldUsage  -u <username> -d <datasetname> 

              Note: You can use this command to see the list of datasets in the org:
              sfdx mohanc:ea:dataset:list  -u <username> 



```
