# LWC custom component

This branch is a simple 1-component LWC bundle for testing purposes. The component is called "Simple Test (LWC)".


## Deploy the components to your org
*If you are using SFDX:*
```bash
sfdx force:source:convert -d mdapioutput/ && sfdx force:mdapi:deploy -d mdapioutput/ -u my-org -w 100
```

*If you are using Workbench:*

Upload the `Archive.zip` file located in `mdapioutput/Archive.zip` of this repo.