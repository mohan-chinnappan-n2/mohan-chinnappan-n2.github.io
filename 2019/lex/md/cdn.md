## Enable CDN to Load Applications Faster

### How to
- From Setup, enter Session in the Quick Find box, and then select Session Settings.
- Select the checkbox for “Enable Content Delivery Network (CDN) for Lightning Component framework”.
- Click Save.

![CDN Setting](img/lex-cdn-1.png) 


### Check it is loading static resources from CDN

![CDN result](img/lex-cdn-2.png)

![CDN result-content](img/lex-cdn-3.png)


### Dig the static url

- static.lightning.force.com is resolved into 23.192.68.79 via CNAME e14569.dsca.akamaiedge.net via CNAME static.lightning.force.com-v1.edgekey.net

```

$ dig static.lightning.force.com

; <<>> DiG 9.10.6 <<>> static.lightning.force.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 47533
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4000
;; QUESTION SECTION:
;static.lightning.force.com.	IN	A

;; ANSWER SECTION:
static.lightning.force.com. 103	IN	CNAME	static.lightning.force.com-v1.edgekey.net.
static.lightning.force.com-v1.edgekey.net. 13250 IN CNAME e14569.dsca.akamaiedge.net.
e14569.dsca.akamaiedge.net. 20	IN	A	23.192.68.79

;; Query time: 32 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: Wed Jan 08 18:44:41 EST 2020
;; MSG SIZE  rcvd: 163

```

### Links

- [Enable CDN to Load Applications Faster ](https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/perf_cdn.htm)
 - [About Akamai](https://en.wikipedia.org/wiki/Akamai_Technologies)

### 
