## create-lwc-app tool

```
$ npx create-lwc-app my-app
$ cd my-app
$ npm run watch

```

### Recipes

```
$ git clone https://github.com/trailheadapps/lwc-recipes-oss.git
Cloning into 'lwc-recipes-oss'...
remote: Enumerating objects: 69, done.
remote: Counting objects: 100% (69/69), done.
remote: Compressing objects: 100% (68/68), done.
remote: Total 709 (delta 11), reused 10 (delta 0), pack-reused 640
Receiving objects: 100% (709/709), 1.77 MiB | 8.50 MiB/s, done.
Resolving deltas: 100% (265/265), done.
~/lex-perf/lwc:
$ cd lwc-recipes-oss/
~/lex-perf/lwc/lwc-recipes-oss:
$ ls
CODE_OF_CONDUCT.md	LICENSE.md		README.md		heroku.yml		lwc-services.config.js	src
CONTRIBUTION.md		Procfile		app.json		jest.config.js		package.json		yarn.lock
~/lex-perf/lwc/lwc-recipes-oss:
$ ls -l
total 1040
-rw-r--r--  1 mchinnappan  wheel    5180 Nov  7 06:13 CODE_OF_CONDUCT.md
-rw-r--r--  1 mchinnappan  wheel    1852 Nov  7 06:13 CONTRIBUTION.md
-rw-r--r--  1 mchinnappan  wheel    7016 Nov  7 06:13 LICENSE.md
-rw-r--r--  1 mchinnappan  wheel      15 Nov  7 06:13 Procfile
-rw-r--r--  1 mchinnappan  wheel    1758 Nov  7 06:13 README.md
-rw-r--r--  1 mchinnappan  wheel     475 Nov  7 06:13 app.json
-rw-r--r--  1 mchinnappan  wheel      68 Nov  7 06:13 heroku.yml
-rw-r--r--  1 mchinnappan  wheel     355 Nov  7 06:13 jest.config.js
-rw-r--r--  1 mchinnappan  wheel      87 Nov  7 06:13 lwc-services.config.js
-rw-r--r--  1 mchinnappan  wheel    1904 Nov  7 06:13 package.json
drwxr-xr-x  6 mchinnappan  wheel     192 Nov  7 06:13 src
-rw-r--r--  1 mchinnappan  wheel  481794 Nov  7 06:13 yarn.lock
~/lex-perf/lwc/lwc-recipes-oss:
$ yarn
yarn install v1.13.0
[1/5] 🔍  Validating package.json...
[2/5] 🔍  Resolving packages...
[3/5] 🚚  Fetching packages...
info fibers_node_v8@3.1.5: The engine "node" is incompatible with this module. Expected version ">=8.0.0 <10.0.0". Got "10.15.1"
info "fibers_node_v8@3.1.5" is an optional dependency and failed compatibility check. Excluding it from installation.
[4/5] 🔗  Linking dependencies...
warning "lwc-services > @lwc/jest-resolver@2.2.0" has unmet peer dependency "@lwc/module-resolver@*".
warning "lwc-services > @lwc/jest-transformer@1.1.0-alpha1" has unmet peer dependency "@lwc/compiler@*".
warning "lwc-services > @salesforce/eslint-config-lwc@0.4.0" has incorrect peer dependency "eslint@^5.0.0".
warning "lwc-services > wdio-lwc-service@0.1.3" has unmet peer dependency "@lwc/compiler@>= 1.0.0".
warning "lwc-services > wdio-lwc-service@0.1.3" has unmet peer dependency "@lwc/engine@>= 1.0.0".
warning "lwc-services > @lwc/jest-preset > @lwc/jest-resolver@1.1.0-alpha1" has unmet peer dependency "@lwc/module-resolver@*".
[5/5] 🔨  Building fresh packages...
✨  Done in 23.75s.
~/lex-perf/lwc/lwc-recipes-oss:


yarn build

⚡⚡⚡⚡⚡  Lightning Web Components ⚡⚡⚡⚡⚡


⌛  Creating build configuration
📦  Starting build process.
       Build duration: 11.286
🎉  Build successfully created.
✨  Done in 14.14s.
~/lex-perf/lwc/lwc-recipes-oss

yarn serve

⚡⚡⚡⚡⚡  Lightning Web Components ⚡⚡⚡⚡⚡


🌎  Local server listening: http://0.0.0.0:3002



```


### References

- [lwc.dev](https://lwc.dev/guide/introduction)
- [lwc recipes](https://recipes.lwc.dev/)