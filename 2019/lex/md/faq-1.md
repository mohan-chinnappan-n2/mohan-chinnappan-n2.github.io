## Performance related FAQ

### Does ```console.log(...)``` has performance impact?
 - Yes. How much:  Depends on the number of objects and depth of the objects that you are logging into console. 
 - ```console.log(...)``` in Production can create security and compliance issue as well.
- It is a source of memory leak in the browser
  - If the developer puts say Object using ```console.log(...)```, browser will  **not** put this object for GC (Garbage Collection) since developer may like to expand that log line to see the object structure.
  - Golden rule: A DOM node can only be garbage collected when **there are no references to it** from either the page's DOM tree or JavaScript code

![console.log](img/consolelog-1.png)
This is the reason the webpack minimizer (via contrib) does this for Production Build:

```
     minimizer: [
      new TerserPlugin({
        extractComments: true,
        cache: true,
        parallel: true,
        sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
           extractComments: 'all',
           compress: {
               drop_console: true,
           },
	}
      }),
    ]

```

### Does Lightning code scanner warn about this ```console.log(...)``` ?

- Yes. Here is the demo
![Lightning Code Scanner](img/lightning-code-scanner-1.gif)

- URL for this service [here](https://mohansun-slds-lint.herokuapp.com/)

### Example using a Utility Bar component

![console.log.nop](img/lex-console-log-nop.png)

- [Sample Code](https://github.com/mohan-chinnappan-n/FSCConfigUI/blob/master/force-app/main/default/aura/FSCConfig/FSCConfigUtilityController.js)


#### See also

- [Be careful with console.log](https://cherniavskii.com/be-careful-with-console-logs/)

### What are the signs for Memory leak?

- Symptom: A page's performance gets progressively worse over time.A memory leak is when a bug in the page causes the page to progressively use more and more memory over time.  

- Sign of frequent GC  - A page's performance is delayed or appears to pause frequently.
  - During GC, all script execution is paused

Use  Chrome Task Manager to find the memory footprint of the tabs:
![Chrome Task Manager](img/chrome-task-mgr-1.png)

- Signs of too many GCs: Frequently rising and falling Memory or JavaScript Memory values represent frequent garbage collections


#### See also
 - [Memory Terminology](https://developers.google.com/web/tools/chrome-devtools/memory-problems/memory-101)
 - [Fix Memory Problems](https://developers.google.com/web/tools/chrome-devtools/memory-problems)


## Caching
- When I make changes in a component, I need to refresh the page a few times in the browser for my changes to take effect. Why do I have to do that, and how can I avoid it?”

- If you enble **Component caching**  the component definitions are cached at the client-side. As a result, when you make a change to a component, and then reload the page hosting the component, you can still get the previous version of the component served from the client cache
- You can usually get the new version of the component by refreshing the page a couple of times, but that isn’t a suitable developer experience.
- The solution is to disable client-side caching during development.

### Recommended settings:

- PROD
    - Debug Mode: Off
    - Component Caching: On 
- DEV
    - Debug Mode: On 
    - Component Caching: Off

- [Lightning Components Performance Best Practices](https://developer.salesforce.com/blogs/developer-relations/2017/04/lightning-components-performance-best-practices.html)







