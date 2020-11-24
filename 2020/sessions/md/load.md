## Dataset Loader
```
$ sfdx mohanc:ea:dataset:load -h
Dataset Loader for EA  

USAGE
  $ sfdx mohanc:ea:dataset:load

OPTIONS
  -a, --datasetname=datasetname                   Dataset Name
  -c, --chunksize=chunksize                       Chunk size in MB (example: 6)
  -d, --datafile=datafile                         Data file in csv format to load
  -f, --dimfields=dimfields                       Dimension Field Names in CSV
  -m, --mulvalfields=mulvalfields                 Multi Value Field Names in CSV
  -o, --operation=operation                       Operation to perform : Overwrite|Append|Upsert|Delete
  -s, --mulvalsep=mulvalsep                       multiValue separator: default ','
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE

              Loads the given csv file in EA as a dataset

              sfdx mohanc:ea:dataset:load  -u <username> -d <datafile.csv> -o Upsert
               -m <multiValueFields as CSV> -s <multiValue separator: default ','>
               -f <DimFields as CSV >
               -c <Chunk Size in MB: default: 9>
               -a <Dataset Name or datafile name will be used>

             NOTE: Provide shorter filenames for datafile 
             (only 8 characters for the name will be used)

             NOTE: If you are using proxy: set the environment variable like this:
             export HTTPS_PROXY=https://your.proxy:proxyPort




```
