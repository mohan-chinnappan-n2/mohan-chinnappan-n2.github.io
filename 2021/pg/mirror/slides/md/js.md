## Javascript - Everywhere!

### Browser side
- Created in 1995 by [Brendan Eich](https://en.wikipedia.org/wiki/Brendan_Eich)
- Supports following  programming styles
    - event-driven
    - functional
    - imperative 
- "JavaScript" is a trademark of Oracle Corporation in the United States.
- Conforms to [ECMAScript](https://en.wikipedia.org/wiki/ECMAScript) specification 
    - [ES2015/ES6](https://262.ecma-international.org/6.0/)
### Server side
- node.js created by [Ryan Dahl](https://en.wikipedia.org/wiki/Ryan_Dahl) in 2009


## Pipeline
![js pipeline](https://mathiasbynens.be/_img/js-engines/js-engine-pipeline.svg)

## Runtime
![JS Runtime](https://miro.medium.com/max/1400/1*4lHHyfEhVB0LnQ3HlhSs8g.png)
- JavaScript engine parses the source code 
- Turns it into an Abstract Syntax Tree (AST). 
    - Based on that AST, the interpreter(ignition in V8) can start to do its thing and produce bytecode.
- The bytecode can be sent to the optimizing compiler (TurboFan in V8) along with profiling data
    - Optimizing compiler makes certain assumptions based on the profiling data it has, and then produces highly-optimized machine code.

- Engines
    - V8 
        - Google Chrome
        - Electron
        - VS Code
        - MS Edge
        - Created by [Lars Bak](https://en.wikipedia.org/wiki/Lars_Bak_(computer_programmer)) in 2008
    - SpiderMonkey
        - Firefox
    - JavaScriptCore
        - Safari
        - React Native Apps 
![js engines](img/js-engines-1.png)
## V8
- Google’s open source high-performance JavaScript and WebAssembly engine, written in C++. 
- It is used in:
    - Chrome and in Node.js, among others. 
    - It implements ECMAScript and WebAssembly, 
    - Runs on :
        - Windows 7 or later, 
        - macOS 10.12+
        -  Linux systems that use x64, IA-32, ARM, or MIPS processors. 
        - V8 can run standalone, or can be embedded into any C++ application (example: node.js)
    - ![v8](https://mathiasbynens.be/_img/js-engines/interpreter-optimizing-compiler-v8.svg)

### References
- [JavaScript engine fundamentals: Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics)
- [About V8](https://v8.dev/)
- [https://webassembly.github.io/spec/core/](https://webassembly.github.io/spec/core/)
