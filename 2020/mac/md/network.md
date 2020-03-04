## Network tools

### Finding which ports are LISTENING

```
sudo lsof -i -n -P | grep LISTEN


launchd       1           root    7u  IPv6 0x84770fd006dd6d93      0t0    TCP *:22 (LISTEN)
launchd       1           root    9u  IPv4 0x84770fd006ddcafb      0t0    TCP *:22 (LISTEN)
launchd       1           root   10u  IPv6 0x84770fd006dd6d93      0t0    TCP *:22 (LISTEN)
launchd       1           root   11u  IPv4 0x84770fd006ddcafb      0t0    TCP *:22 (LISTEN)
launchd       1           root   13u  IPv6 0x84770fd006dd7353      0t0    TCP *:5900 (LISTEN)
launchd       1           root   15u  IPv4 0x84770fd006ddc193      0t0    TCP *:5900 (LISTEN)
launchd       1           root   22u  IPv6 0x84770fd006dd7353      0t0    TCP *:5900 (LISTEN)
launchd       1           root   24u  IPv4 0x84770fd006ddc193      0t0    TCP *:5900 (LISTEN)
...

```

### Finding a PID of the process listening on a port

```
lsof -ti tcp:5000 | xargs ps

 PID   TT  STAT      TIME COMMAND
24644   ??  S      0:00.05 com.docker.vpnkit --db /Users/mchinnappan/Library/Containers/com.docker.docker/Data/s40 --branch state --ethernet fd:3 --port fd:4 --in

```

### Finding a PID of the process listening on a port and killing it

```
lsof -ti tcp:5000 | xargs kill 

```





