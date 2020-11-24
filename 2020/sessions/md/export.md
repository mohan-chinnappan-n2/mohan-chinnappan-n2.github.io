## Dataset export

```
$ sfdx mohanc:ea:dataset:export -h
Dataset Exporter  

USAGE
  $ sfdx mohanc:ea:dataset:export

OPTIONS
  -e, --exportid=exportid                         Export Id to be exported or LATEST
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE

              exports the latest run (or given exportId) datasetExport into a csv file

              sfdx mohanc:ea:dataset:export  -u <username> -e [exportId]

              if -e flag is not provided, latest exportId will be used for the export

```
- [Export Documentation](https://www.salesforceblogger.com/2020/08/19/export-your-einstein-analytics-datasets/)


