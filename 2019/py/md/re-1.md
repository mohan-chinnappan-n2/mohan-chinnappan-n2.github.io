## Regular Expression

```
import re

cleaner = lambda w: re.sub(r"\s+", "", w, flags=re.UNICODE)

in_data = "one two three"
cleaner(in_data)

'onetwothree'
```

- [In NBViewer](https://nbviewer.jupyter.org/urls/gist.githubusercontent.com/mohan-chinnappan-n/5c52b813b2fd46c3365b4bc8b5efb4da/raw/f16bb55e6f24d4647a0e49cbd691cf1f7b08f5aa/re-1.ipynb)
