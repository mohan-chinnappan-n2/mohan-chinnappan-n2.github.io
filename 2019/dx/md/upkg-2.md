## Unlocked packages

### Create unmanaged package

![upkg-1](img/upkg/upkg-1.png)
![upkg-1](img/upkg/upkg-2.png)

```
$ sfdx force:mdapi:retrieve -p 'farming' -s -r ./farming_unmanaged -u  mohan.chinnappan.n_ea@gmail.com
Retrieving source...

=== Status
Status:  Pending
jobid:  09S3m000008r4ADEAY


=== Result
Status:  Succeeded
jobid:  09S3m000008r4ADEAY

Wrote retrieve zip to /Users/mchinnappan/dx-2019/farming_unmanaged/unpackaged.zip.


$ jar tvf farming_unmanaged/unpackaged.zip 
  5558 Tue Dec 17 11:34:18 EST 2019 objects/crops__c.object
  1947 Tue Dec 17 11:34:18 EST 2019 layouts/crops__c-crop Layout.layout
   191 Tue Dec 17 11:34:18 EST 2019 tabs/crops__c.tab
   708 Tue Dec 17 11:34:18 EST 2019 package.xml


# unzip
~/dx-2019/farming_unmanaged:

$ unzip unpackaged.zip 
Archive:  unpackaged.zip
  inflating: objects/crops__c.object  
  inflating: layouts/crops__c-crop Layout.layout  
  inflating: tabs/crops__c.tab       
  inflating: package.xml             


```


### Convert this extracted source into a format that was compatible with Salesforce DX and the CLI

- Create a sfdx project

```
$ sfdx force:project:create -n farming
target dir = /Users/mchinnappan/dx-2019
   create farming/config/project-scratch-def.json
   create farming/README.md
   create farming/sfdx-project.json
   create farming/.vscode/extensions.json
   create farming/.vscode/launch.json
   create farming/.vscode/settings.json
   create farming/force-app/main/default/lwc/.eslintrc.json
   create farming/scripts/soql/account.soql
   create farming/scripts/apex/hello.apex
   create farming/.forceignore
   create farming/.gitignore
   create farming/.prettierignore
   create farming/.prettierrc

$ cat config/project-scratch-def.json 
{
  "orgName": "mchinnappan company",
  "edition": "Developer",
  "features": []
}

```
- Create farming_sorg1 scratch org

```
$ sfdx force:org:create -s -f config/project-scratch-def.json -a farming_sorg1 -d 30
Successfully created scratch org: 00D550000007YhYEAU, username: test-ok9hexdafnqi@example.com

$ sfdx force:org:list 
=== Orgs
     ALIAS     USERNAME                             ORG ID              CONNECTED STATUS
───  ────────  ───────────────────────────────────  ──────────────────  ────────────────
               mohan.chinnappan.n33@gmail.com       00Df4000002db0kEAA  Connected
               mohan.chinnappan.n_ea@gmail.com      00D1N000001Tjk2UAC  Connected
(D)  DevHub    mohan.chinnappan.dh26@gmail.com      00D6g000000uyu4EAA  Connected
     lwc1_org  mohan.chinnappan.n-hhet@force.com    00DB0000000K3yVMAS  Connected

     ALIAS          SCRATCH ORG NAME     USERNAME                       ORG ID              EXPIRATION DATE
───  ─────────────  ───────────────────  ─────────────────────────────  ──────────────────  ───────────────
(U)  farming_sorg1  mchinnappan company  test-ok9hexdafnqi@example.com  00D550000007YhYEAU  2020-01-16


```

### Use force:mdapi:convert to convert this  unmanaged  from Metadata API format into the source (dx) format 

```

$ sfdx force:mdapi:convert  -r ../farming_unmanaged
=== Converted Source
STATE  FULL NAME             TYPE            PROJECT PATH
─────  ────────────────────  ──────────────  ───────────────────────────────────────────────────────────────────────────────────────────
Add    crops__c-crop Layout  Layout          force-app/main/default/layouts/crops__c-crop Layout.layout-meta.xml
Add    crops__c              CustomObject    force-app/main/default/objects/crops__c/crops__c.object-meta.xml
Add    crops__c.All          ListView        force-app/main/default/objects/crops__c/listViews/All.listView-meta.xml
Add    crops__c.it_it_apple  ValidationRule  force-app/main/default/objects/crops__c/validationRules/it_it_apple.validationRule-meta.xml
Add    crops__c              CustomTab       force-app/main/default/tabs/crops__c.tab-meta.xml
```
<pre>
$ tree
.
├── README.md
├── config
│   └── project-scratch-def.json
├── force-app
│   └── main
│       └── default
│           ├── layouts
│           │   └── crops__c-crop\ Layout.layout-meta.xml
│           ├── lwc
│           ├── objects
│           │   └── crops__c
│           │       ├── crops__c.object-meta.xml
│           │       ├── listViews
│           │       │   └── All.listView-meta.xml
│           │       └── validationRules
│           │           └── it_it_apple.validationRule-meta.xml
│           └── tabs
│               └── crops__c.tab-meta.xml
├── layouts
│   └── crops__c-crop\ Layout.layout
├── objects
│   └── crops__c.object
├── package.xml
├── scripts
│   ├── apex
│   │   └── hello.apex
│   └── soql
│       └── account.soql
├── sfdx-project.json
└── tabs
    └── crops__c.tab

</pre>


### Create a Unlocked package myfarmingPkg using force:package:create 
```
$ sfdx force:package:create -n myfarmingPkg -t Unlocked -r force-app
sfdx-project.json has been updated.
Successfully created a package. 0Ho6g000000KyvcCAC
=== Ids
NAME        VALUE
──────────  ──────────────────
Package Id  0Ho6g000000KyvcCAC


$ sfdx force:package:list
=== Packages [2]
Namespace Prefix  Name          Id                  Alias         Description  Type
────────────────  ────────────  ──────────────────  ────────────  ───────────  ────────
                  dreamhouse    0Ho6g000000KyrkCAC                My Package   Unlocked
                  myfarmingPkg  0Ho6g000000KyvcCAC  myfarmingPkg               Unlocked



$ cat sfdx-project.json 
{
    "packageDirectories": [
        {
            "path": "force-app",
            "default": true,
            "package": "myfarmingPkg",
            "versionName": "ver 0.1",
            "versionNumber": "0.1.0.NEXT"
        }
    ],
    "namespace": "",
    "sfdcLoginUrl": "https://login.salesforce.com",
    "sourceApiVersion": "47.0",
    "packageAliases": {
        "myfarmingPkg": "0Ho6g000000KyvcCAC"
    }
}

```

### Create package version using force:package:version 

```


$ sfdx force:package:version:create -p myfarmingPkg -x
Package version creation request status is 'Initializing'. Run "sfdx force:package:version:create:report -i 08c6g000000Kz4pAAC" to query for status.


$ sfdx force:package:version:create:report -i 08c6g000000Kz4pAAC
=== Package Version Create Request
NAME                           VALUE
─────────────────────────────  ──────────────────
ID                             08c6g000000Kz4pAAC
Status                         Initializing
Package Id                     0Ho6g000000KyvcCAC
Package Version Id
Subscriber Package Version Id
Tag
Branch
Created Date                   2019-12-17 07:09
Installation URL


$ sfdx force:package:version:create:report -i 08c6g000000Kz4pAAC
=== Package Version Create Request
NAME                           VALUE
─────────────────────────────  ─────────────────────────────────────────────────────────────────────────────────
ID                             08c6g000000Kz4pAAC
Status                         Success
Package Id                     0Ho6g000000KyvcCAC
Package Version Id             05i6g000000GmjzAAC
Subscriber Package Version Id  04t6g000003YmJnAAK
Tag
Branch
Created Date                   2019-12-17 07:09
Installation URL               https://login.salesforce.com/packaging/installPackage.apexp?p0=04t6g000003YmJnAAK

```

### Install this package

```

sfdx force:package:install -p 04t6g000003YmJnAAK
ERROR running force:package:install:  The package version is not fully available. If this is a recently created package version, try again in a few minutes or contact the package publisher.

$ sfdx force:package:install -b 10 -p 04t6g000003YmJnAAK
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
Waiting for the Subscriber Package Version ID to be published to the target org.
PackageInstallRequest is currently InProgress. You can continue to query the status using
sfdx force:package:install:report -i 0Hf550000008WFlCAM -u test-ok9hexdafnqi@example.com

$ sfdx force:package:install:report -i 0Hf550000008WFlCAM -u test-ok9hexdafnqi@example.com
Successfully installed package [04t6g000003YmJnAAK]

# List the installed packages
$ sfdx force:package:installed:list 
=== Installed Package Versions [1]
ID                  Package ID          Package Name  Namespace  Package Version ID  Version Name  Version
──────────────────  ──────────────────  ────────────  ─────────  ──────────────────  ────────────  ───────
0A3550000000mZMCAY  0336g000000DhaSAAS  myfarmingPkg             04t6g000003YmJnAAK  ver 0.1       0.1.0.1

```

![installed pkgs](img/upkg/installted-pkg-1.png)
![installed pkgs](img/upkg/installed-pkg-2.png)
![installed pkgs](img/upkg/installed-pkg-3.png)

### Using plugins

![mohanc plugins](https://mohan-chinnappan-n.github.io/dx/img/sfdx-mohanc-2.gif)

### References
[sfdx plugins](https://mohan-chinnappan-n.github.io/dx/plugins.html#/1)



