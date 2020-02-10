## Browser Storage Options 

- localStorage (webStorage) - [w3spec](https://www.w3.org/TR/webstorage/)
    - window.localStorage
    - strings only key - value storage
    - sync API (Blocks the main thread)
    - 5 MB limit
    - store app's session data

- indexedDB
    - [w3spec](https://www.w3.org/TR/IndexedDB/)
    - [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
    - JavaScript-based object-oriented database 
```
    open = indexedDB.openDatabase('db', 1);
    open.onupgradeneeded = e => {
      open.result.createObjectStore('s');
    };
    open.onsuccess = e => {
      let db = open.result;
      let tx = db.transaction('s');
      let s = tx.objectStore('s');
      let rq = s.put('value', 'key');
      rq.onsuccess = e => alert('succeeded');
      rq.onerror = e => alert(e.message);
      tx.oncomplete = e => alert('committed');
      tx.onabort = e => alert(e.message);
    };


```

   - window.indexedDB
    - support for larger amounts of data 
    - sync and async support (async is mostly used)
    - provide indexes
    - store data of any JavaScript type, such as an object or array, without having to serialize it
    - supports transactions (window.IDBTransaction)
    - service workers can use this
    - use case: store all data so that the app can run offline  


### Storage References
- [Overview & State of Storage APIs](https://docs.google.com/presentation/d/11CJnf77N45qPFAhASwnfRNeEMJfR-E_x05v1Z6Rh5HA/edit#slide=id.g146417e51d_0_103)
 
