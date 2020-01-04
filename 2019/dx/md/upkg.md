## Unlocked packages

![package benefits](https://d259t2jj6zp7qm.cloudfront.net/images/v1526340195-SFDX_2FSDLC_-_Before_wejhmu.png)

- Unlocked Packages (GA in Winter '19) 
- Package-based Release Management solution for our customers and SIs to manage change in their environments
- Repeatable, Scriptable, Trackable

- Well suited for internal business apps
- Unless you plan to distribute an app on AppExchange, an unlocked package is the right package type for most use cases.

- Use to:
    - to organize your existing metadata
    - package an app
    - extend an app that you’ve purchased from AppExchange
    - package new metadata.

- The source of truth of the metadata contained in the package is your version control system, not what’s in an org. 


- Designed for Enterprise Customers and System Integrators to **organize, distribute and manage** Apps and Metadata on Salesforce Platform.

- Immutable, versionable artifact 

- With DX and Lightning Platform, we are bringing the benefits of 
    - modular
    -  modern
    -  package-based metadata deployment 
    -  organization capabilities 
to our enterprise customers and anyone that works closely with them - SIs, consultants


### Benefits

- Make app development **easier**: Unlocked packages provide a Salesforce DX-compatible technology for **packaging, deploying, organizing and managing your apps and metadata** in any Salesforce environment – scratch orgs, sandbox orgs, trial orgs, and production orgs

- With package versions, you have an immutable, versionable artifact that can be used in CI, UAT, etc. Unlocked packages are designed to serve as that **stable artifact**.

- Unlocked packages have full support for **versioning**
    - modifications to your package can be managed as versions
    - We can track which production instance is running which version of an unlocked package and seamlessly upgrade any environment to the appropriate version of your package. 
    - change management and compliance become much simpler with packaging.

- Keep the customizations more organized
    -  Unlocked packages show up as **installed packages** and their contents appear as a set of associated metadata
    -  you can quickly see which metadata belongs to which package and how your metadata is organized between different packages. 
    - support modular development allows you to organize your customizations into logical, interdependent units


### Notes
- You don’t have to put every single piece of your org into a package. If you decide to explore packages, **you could (and should) start small**

- you’ll have to look at how to organize the pieces of metadata that make up your org into distinct modules and figure out a sensible plan to store those modules in source control. 


-  If you choose to create a package to manage some pieces of your org, it doesn’t mean you can’t still manage other parts of your org with change sets or other deployment strategies. YOU get to decide what makes sense for your org.

-  understanding the difference between metadata in managed packages, metadata in unlocked packages, and metadata that isn’t packaged at all will matter.
- When metadata is part of a managed package, you have limited ability to change it. In fact, depending on the kind of metadata and how the developer of the managed package built their package, you may not be able to make any changes.
- With unlocked packages, as the name indicates, you can still make changes to metadata that’s part of that package, even once it’s installed into production.
- For example, if an object is in an unlocked package and a system administrator needs to update the help text or label of a field, they can do so. In a managed package, that update may not be allowed.

- Dependencies
    - When different pieces of metadata refer to one another, you’ve got a dependency.
    - For example, think about a page layout. It’s a piece of metadata by itself, but it’s made up of references to other things (other pieces of metadata) in an org.
    - Even simple page layouts reference an object’s fields, related lists, and object-specific actions. All of these references are dependencies. In the case of a simple layout, these dependencies could be fairly straightforward to identify.

    -  more complex layouts might include references to Visualforce pages, etc.
    -  So now you’ve got a page layout that has dependencies on a Visualforce page—which has it’s own set of dependencies, like controller classes in Apex, and any metadata referenced by that code.
    - reality right now is that identifying dependencies takes work.
    - The nature of your org and your own skill sets will ultimately be huge factors in determining what a practical workflow may look like.
   ```
    SELECT MetadataComponentName, MetadataComponentType
    FROM MetadataComponentDependency
    WHERE RefMetadataComponentType = 'ApexClass'
   ```
    - identify a piece to start with — such as a single app 
    - 

### CLI

```
sfdx force:package:create -n  Orchard -d "Orchard Package" -t Unlocked -r force-app

```

### Package designer tool

![Package Designer tool](https://mohan-chinnappan-n.github.io/dx/dx-kanban-2.gif)

### 2GP 
- Second-generation managed packaging (2GP) ushers in a new way for AppExchange partners to develop, distribute, and manage their apps and metadata.

### References

- [SFDX Dev guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_intro.htm)
- [Announcing Unlocked Packages Beta](https://developer.salesforce.com/blogs/2018/02/announcing-unlocked-packages-beta.html)
- [Working with Modular Development and Unlocked Packages: Part 1](https://developer.salesforce.com/blogs/2018/06/working-with-modular-development-and-unlocked-packages-part-1.html)
- [TB Community Unlocked Packages](https://success.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F93A000000Lg5USAS)

- [5 Session Videos at TrailheaDX’18](https://developer.salesforce.com/blogs/2018/05/icymi-trailheadx18-5-session-videos-to-help-you-build-in-salesforce-dx.html)

- [Getting Started with Salesforce DX](https://developer.salesforce.com/blogs/2018/02/getting-started-salesforce-dx-part-1-5.html)
- [sfdx-dh-decompose](https://github.com/wadewegner/sfdx-dh-decompose)
