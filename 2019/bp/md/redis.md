## Redis

- In-memory data structure store
    - can be used as database/cache and message broker
- Key/Value Store
- Built in replication (master - slave)
- Supports Data types 
    - Strings
    - Lists
    - Sets
    - Sorted Sets
    - Hashes
    - Bit Maps
    - Hyperlogs
    - Geospatial Indexes


### Session with Redis

- Server
```
$ redis-server 
                _._                                                  
           _.-``__ ''-._                                             
      _.-``    `.  `_.  ''-._           Redis 3.2.0 (00000000/0) 64 bit
  .-`` .-```.  ```\/    _.,_ ''-._                                   
 (    '      ,       .-`  | `,    )     Running in standalone mode
 |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
 |    `-._   `._    /     _.-'    |     PID: 4996
  `-._    `-._  `-./  _.-'    _.-'                                   
 |`-._`-._    `-.__.-'    _.-'_.-'|                                  
 |    `-._`-._        _.-'_.-'    |           http://redis.io        
  `-._    `-._`-.__.-'_.-'    _.-'                                   
 |`-._`-._    `-.__.-'    _.-'_.-'|                                  
 |    `-._`-._        _.-'_.-'    |                                  
  `-._    `-._`-.__.-'_.-'    _.-'                                   
      `-._    `-.__.-'    _.-'                                       
          `-._        _.-'                                           
              `-.__.-'                                               

4996:M 04 Jan 05:47:13.210 # Server started, Redis version 3.2.0
4996:M 04 Jan 05:47:13.210 * The server is now ready to accept connections on port 6379

```
- Client

```
$ redis-cli 
127.0.0.1:6379> ping
PONG


127.0.0.1:6379> ECHO 'Hello Farmers'
"Hello Farmers"

## set and get
127.0.0.1:6379> set farmingType 'Organic'
OK
127.0.0.1:6379> get farmingType
"Organic

## increment and decrement
127.0.0.1:6379> set numTrees 200
OK
127.0.0.1:6379> incr numTrees
(integer) 201
127.0.0.1:6379> get numTrees
"201"

127.0.0.1:6379> decr numTrees
(integer) 200
127.0.0.1:6379> get numTrees
"200"

## Exists?
127.0.0.1:6379> EXISTS numTrees
(integer) 1
127.0.0.1:6379> EXISTS numFruitTrees
(integer) 0

## Delete
127.0.0.1:6379> del numTrees
(integer) 1
127.0.0.1:6379> get numTrees
(nil)

## FLUSHALL
127.0.0.1:6379> FLUSHALL 
OK

## EXPIRE (in secs)
127.0.0.1:6379> set numTrees 300
OK
127.0.0.1:6379> EXPIRE numTress 60
(integer) 0
127.0.0.1:6379> EXPIRE numTrees 60
(integer) 1

### TTL
127.0.0.1:6379> TTL numTrees
(integer) 4
127.0.0.1:6379> TTL numTrees
(integer) -2
127.0.0.1:6379> get numTrees
(nil)

127.0.0.1:6379> setEx numTrees 30 400
OK
127.0.0.1:6379> get numTrees
"400"
127.0.0.1:6379> ttl numTrees
(integer) 14
127.0.0.1:6379> ttl numTrees
(integer) 12

### PERSIST
127.0.0.1:6379> PERSIST numTrees
(integer) 1
127.0.0.1:6379> ttl numTrees
(integer) -1
127.0.0.1:6379> get numTrees
"500"

### Multiple set
127.0.0.1:6379> MSET fruitTrees 77 nutTrees 88
OK
127.0.0.1:6379> get fruitTrees
"77"
127.0.0.1:6379> get NutTrees
(nil)
127.0.0.1:6379> get nutTrees
"88"

### LIST
127.0.0.1:6379> lpush fruits 'Mango'
(integer) 1
127.0.0.1:6379> lpush fruits 'Jackfruit'
(integer) 2

127.0.0.1:6379> LRANGE fruits 0 1
1) "Jackfruit"
2) "Mango"
127.0.0.1:6379> lpush fruits 'Apple'
(integer) 3

127.0.0.1:6379> LRANGE fruits 0 2
1) "Apple"
2) "Jackfruit"
3) "Mango"

127.0.0.1:6379> LLEN fruits
(integer) 3

127.0.0.1:6379> LPOP fruits
"Apple"
127.0.0.1:6379> LRANGE fruits 0 -1
1) "Jackfruit"
2) "Mango"

### Sets
127.0.0.1:6379> SADD states 'NH' 'MA' 'TX' 'CA'
(integer) 4
127.0.0.1:6379> SMEMBERS states
1) "CA"
2) "NH"
3) "TX"
4) "MA"

27.0.0.1:6379> SCARD states
(integer) 4

```



### Links

- [github redis](https://github.com/antirez/redis)
