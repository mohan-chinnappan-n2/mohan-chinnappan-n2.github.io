## Coalesce

- Use to get the first non-null value from a list of parameters, or to replace nulls with a different value.


![img/tree_not_in-1.gif]

### Binding example

```
"query": "q = load \"trees\";\nq = foreach q generate q.name as 'name';\n\n\nq = filter q by name not in {{coalesce(column(typer_1.selection,['value']), \"[]\").asString() }};",

```

