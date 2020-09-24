## How to Check my org has Edge Enabled?

### Dig way
- My org url: mohansun-ea-02-dev-ed.my.salesforce.com
![my domain](img/mydomain-1.png)

```
$ dig  mohansun-ea-02-dev-ed.my.salesforce.com

; <<>> DiG 9.10.6 <<>> mohansun-ea-02-dev-ed.my.salesforce.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 31450
;; flags: qr rd ra; QUERY: 1, ANSWER: 6, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;mohansun-ea-02-dev-ed.my.salesforce.com. IN A

;; ANSWER SECTION:
mohansun-ea-02-dev-ed.my.salesforce.com. 10 IN CNAME na111.my.salesforce.com.
;; If Edge is enables you will see a line similar to the following line
;; na111.my.salesforce.com. 298 IN	CNAME	n.edge2.salesforce.com. <----------------------

na111.my.salesforce.com. 10	IN	CNAME	na111-ia2.my.salesforce.com.
na111-ia2.my.salesforce.com. 10	IN	CNAME	na111-ia2.ia2.r.my.salesforce.com.
na111-ia2.ia2.r.my.salesforce.com. 8 IN	A	13.110.35.199
na111-ia2.ia2.r.my.salesforce.com. 8 IN	A	13.110.34.71
na111-ia2.ia2.r.my.salesforce.com. 8 IN	A	13.110.34.199

;; Query time: 45 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: Thu Sep 24 15:35:06 EDT 2020
;; MSG SIZE  rcvd: 190

```


### URL way
- url to check: **instance_url**/smth.jsp
![smth](img/edgeEnabled-check.png) 
