# How PMD works

- Starts with the main class
    - [main class: net.sourceforge.pmd.PMD](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L63)

```
/**
 * This is the main class for interacting with PMD. The primary flow of all Rule
 * process is controlled via interactions with this class. A command line
 * interface is supported, as well as a programmatic API for integrating PMD
 * with other software such as IDEs and Ant.
 */

public class PMD {

}

```
- [Parse command line parameters](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L502)
    - ``` runPmd(args); ```

- [Load rulesets/rules](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L227)

- [Determine languages (rules of different languages might be mixed in rulesets)](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L227)

- Determine files (uses the given source directory, filter by the language’s file extensions)

- [Prepare the renderer](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L239)

- [Prepare the SourceCodeProcessor based on the configuration](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L81)


- [Analyze the files. Either single threaded or multi-threaded parallel](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/processor/PmdRunnable.java#L31)
    - Create input stream (https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/processor/PmdRunnable.java#L83)
    - Call SourcCodeProcessor
        - Determine the language
        - Check whether the file is already analyzed and a result is available from the analysis cache
        - Parse the source code. Result is the root AST node.
        - Always run the SymbolFacade visitor. It builds scopes, finds declarations and usages.
        - Run DFA (data flow analysis) visitor (if at least one rule requires it) for building control flow graphs and data flow nodes.
        - Run TypeResolution visitor (if at least one rule requires it)
        - Execute the rules
            - First run the rules that opted-in for the [rule chain](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/RuleChain.java) mechanism
            - Run all the other rules and let them **traverse the AST**. The rules can use the symbol table, type resolution information and DFA nodes.
            - the rules will report found problems as [RuleViolations](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/RuleViolation.java#L19).

        - [Render the found violations into the wanted format (XML, text, HTML, …)](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/renderers/HTMLRenderer.java)
        - Store the incremental analysis cache
        - [Depending on the number of violations found, exit with code 0 or 4.](https://github.com/pmd/pmd/blob/master/pmd-core/src/main/java/net/sourceforge/pmd/PMD.java#L504)










# Resources
- [How PMD Works](https://pmd.github.io/latest/pmd_devdocs_how_pmd_works.html)
