

## Update sfdx
```
sfdx update
```

```
sfdx-cli: Updating CLI from 7.122.1-5e1c7e6 to 7.123.0-ebc9b0f... done
sfdx-cli: Updating CLI... done
sfdx-cli: Installing sf... failed
Failed to install sf. Try one of the following:
- npm: npm install @salesforce/cli --global
- installer: https://developer.salesforce.com/media/salesforce-cli/sf/channels/stable/sf.pkg

```

## Install sf

```
- Install using installer: https://developer.salesforce.com/media/salesforce-cli/sf/channels/stable/sf.pkg
```

##  Testing sf

```
 sf
```

```
The Salesforce CLI

VERSION
  @salesforce/cli/1.1.0 darwin-x64 node-v14.17.1

USAGE
  $ sf [COMMAND]

TOPICS
  config    Commands to configure Salesforce CLI.
  deploy    Commands to deploy artifacts to an environment.
  env       Commands to manage your environments, such as orgs.
  generate  Commands to generate things from templates.
  login     Commands to log in to an environment.
  logout    Commands to log out of an environment.
  plugins   List installed plugins.
  retrieve  Commands to retrieve artifacts from an environment.
  run       Commands to run a function.
  whoami    Commands to show information about yourself or your account.

COMMANDS
  deploy   Deploy a project interactively to any Salesforce environment.
  help     Display help for sf.
  login    Log interactively into an environment, such as a Salesforce org.
  logout   Log out interactively from environments, such as Salesforce orgs and compute environments.
  plugins  List installed plugins.
```

```
 sf plugins
```
```
You acknowledge and agree that the CLI tool may collect usage information, user environment, and crash reports for the purposes of providing services or functions that are relevant to use of the CLI tool and product improvements.

No plugins installed.
```

```
sf plugins --core
```
```
@oclif/plugin-help 5.1.1 (core)
@oclif/plugin-not-found 2.2.0 (core)
@oclif/plugin-plugins 2.0.1 (core)
@salesforce/cli 1.1.0 (core)
config 2.2.9 (core)
deploy-retrieve 1.0.5 (core)
deploy-retrieve-metadata 1.0.7 (core)
env 1.0.3 (core)
functions 1.1.5 (core)
generate 1.0.5 (core)
login 1.0.4 (core)
telemetry 1.2.8 (core)

```

```
 sfdx plugins
```
```
sfdx-mohanc-plugins 0.0.161 (link) /Users/mchinnappan/sfdx-mohanc-plugins

```


## Install Docker Desktop

- [Desktop Docker](https://www.docker.com/products/docker-desktop)


## Check nodejs version
```
node --version
```
```
v14.17.5
```

## Install the Salesforce SDK for Node.js Functions

```
npm install @salesforce/salesforce-sdk
```

```
 npm install @salesforce/salesforce-sdk
npm WARN deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142
npm WARN deprecated har-validator@5.1.5: this library is no longer supported

> dtrace-provider@0.6.0 install /Users/mchinnappan/github/githubpages/mohan-chinnappan-n2.github.io/2021/sf/node_modules/dtrace-provider
> node scripts/install.js

---------------
Building dtrace-provider failed with exit code 1 and signal 0
re-run install with environment variable V set to see the build output
---------------
npm WARN saveError ENOENT: no such file or directory, open '/Users/mchinnappan/github/githubpages/mohan-chinnappan-n2.github.io/2021/sf/package.json'
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN enoent ENOENT: no such file or directory, open '/Users/mchinnappan/github/githubpages/mohan-chinnappan-n2.github.io/2021/sf/package.json'
npm WARN sf No description
npm WARN sf No repository field.
npm WARN sf No README data
npm WARN sf No license field.

+ @salesforce/salesforce-sdk@1.4.1
added 147 packages from 228 contributors and audited 147 packages in 27.499s

8 packages are looking for funding
  run `npm fund` for details

```

## Install Salesforce Extension Pack for VS Code

- [Salesforce Extension Pack ](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)

