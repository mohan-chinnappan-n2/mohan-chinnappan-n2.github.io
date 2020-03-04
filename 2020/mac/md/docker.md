## Docker 

### PS

- What Docker process are running (List containers)
```
docker ps

CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                    NAMES
b9fa4e836edc        afourmy/flask-gentelella   "gunicorn --config..."   5 weeks ago         Up 2 minutes        0.0.0.0:5000->5000/tcp   gentelella

```

- Kill a running container
```
docker kill b9fa4e836edc 

docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES


```

### Doc Links
- [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/)


