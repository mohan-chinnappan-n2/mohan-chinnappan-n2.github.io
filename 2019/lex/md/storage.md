## Browser Storage Options 


### localStorage (webStorage) - [w3spec](https://www.w3.org/TR/webstorage/)
- window.localStorage
- strings only key - value storage
- sync API (Blocks the main thread)
- 5 MB limit
- store app's session data

### indexedDB

- Key point: Make sure the leveldb files of the indexedDB are stored locally not on a network drive

- Chrome's indexedDB is based on LevelDB (work of Sanjay Ghemawat and Jeff Dean: [leveldb](https://github.com/google/leveldb) )
- How to find the levelDB files related to Lightning in Chrome's indexedDB 
- In browser [indexeddb-internals](chrome://indexeddb-internals/)
- in Mac
```
$ tree  ~/Library/Application\ Support/Google/Chrome/ | grep indexed | grep  -i lightning
https_mohansun-59-dev-ed.lightning.force.com_0.indexeddb.leveldb
https_mohansun-60-dev-ed.lightning.force.com_0.indexeddb.leveldb
https_mohansun-fsc-20.lightning.force.com_0.indexeddb.leveldb
https_mohansun-fsc-70.lightning.force.com_0.indexeddb.leveldb
https_mohansun-fsc10.lightning.force.com_0.indexeddb.leveldb
...

```
- In Windows
```
dir C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default\IndexedDB

You will see the folders like:
  https_mohansun-fsc-20.lightning.force.com_0.indexeddb.leveldb
if you cd into that folder: like https_mohansun-fsc-20.lightning.force.com_0.indexeddb.leveldb

you will see:

files with extenion ldb (levelDB)  like:
000001.ldb
000002.ldb

You can note down the file sizes
...

```
- In Linux
```
run at root folder: sudo find . -name '*leveldb' -print | grep -i lightning
to get something like this:

 ~/.config/google-chrome/Default/IndexedDB/https_mohansun-fsc-20.lightning.force.com_0.indexeddb.leveldb

```

- For Edge (Chromium based)
- [View And Change IndexedDB Data With Microsoft Edge DevTools](https://docs.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/storage/indexeddb)

#### specs and sample code for indexedDB

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

### Sample Storage status

![storage status](img/indexedDB-Storage.png)

![storage check](img/lex-idb-1.png )


### Storage References
- [Overview & State of Storage APIs](https://docs.google.com/presentation/d/11CJnf77N45qPFAhASwnfRNeEMJfR-E_x05v1Z6Rh5HA/edit#slide=id.g146417e51d_0_103)
 
