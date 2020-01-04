## Apache Maven
- Created by Jason Van Zyl
- Began as an attempt to simplify the build processes in the Jakarta Turbine project
    - A servlet based framework that allows experienced Java developers to quickly build web applications.
    - Jakarta Turbine has several projects, each with their own Ant build files, that were all slightly different.
    - JARs were checked into CVS
    - Needed:  standard way to build the projects, a clear definition of what the project consisted of, an easy way to publish project information and a way to share JARs across several projects.
    - The result is a tool that can now be used for building and managing any Java-based project

### Goals
- Providing a uniform build system
    -  allows a project to build using its project object model (POM
    -  a set of plugins that are shared by all projects using Maven, providing a uniform build system.
    - Once you familiarize yourself with how one Maven project builds you automatically know how all Maven projects build saving you immense amounts of time when trying to navigate many projects.

- Providing quality project information
    - part taken from your POM and in part generated from your project’s sources
        - Change log document created directly from source control
        - Cross referenced sources
        - List of mailing lists managed by the project
        - Dependency list
        - Unit test reports including coverage
- Providing guidelines for best practices development
- Allowing transparent migration to new features


### POM
- Beyond a mere collection of files containing code
- It is a one-stop-shop for all things concerning the project
- Has configurations of plugins to be used during the build process
- Has declarative manifestation of the "who", "what", and "where", while the build lifecycle is the "when" and "how"
-  Whereas a build.xml tells Ant precisely what to do when it is run (procedural), a POM states its configuration (declarative).

- A project need not contain any code at all, merely a pom.xml
- Structure
    - project
        - Basics (The three elements given above point to a specific version of a project, letting Maven know who we are dealing with, and when in its software lifecycle we want them.)
            - **groupId** (unique amongst an organization or a project. e.g: org.greenworld.farming)
                - group acts much like the Java packaging structure does in an operating system.
                - lives at $M2_REPO/org/greenworld/farming 
            - **artifactId** (generally the name that the project is known by. e.g: orchard)
                - lives at: $M2_REPO/org/greenworld/farming/orchard
            - **version**
                - groupId:artifactId denotes a single project but they cannot delineate which incarnation of that project we are talking about.
                -  code changes, those changes should be versioned, and this element keeps those versions in line.
                - version 1.0 files lives at $M2_REPO/org/greenworld/farming/orchard/1.0 
            - **packaging** (standard label to give us a really complete what)
                - jar (default)
                - war
                - pom
                - maven-plugin
                - ejb
                - ear
                - rar
        
            - **dependencies**
                - Maven solves both problems (jarmageddon, jar hell, ) through a common local repository from which to link projects correctly, versions and all.
                - Most projects depend on others to build and run correctly
                    - Maven downloads and links the dependencies on compilation and other goals that require them
                    - Maven brings in the dependencies of those dependencies (transitive dependencies)
                    - Allowing your list to focus solely on the dependencies your project requires
                - Structure
                    - dependency
                        - groupId (org.create.carpentry)
                        - artifactId (furniture)
                        - version (3.14)
                        - scope (test)
                        - optional (true | false)


            - **parent**
            - **dependencyManagement**
            - **modules**
            - **properties**

        - Build Settings
            - build
            - reporting

        - More Project Information
            - name
            - description
            - url
            - inceptionYear
            - licenses
            - organization
            - developers
            - contributors

        - Environment Settings
            - issueManagement
            - ciManagement
            - mailingLists
            - scm
            - prerequisites
            - repositories
            - pluginRepositories
            - distributionManagement
            - profiles
