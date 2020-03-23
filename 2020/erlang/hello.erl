-module(hello).
-export([hello_world/0]).

hello_world() -> io:fwrite("hello, world from Erlang in the memory of Joe Armstrong!\n").
