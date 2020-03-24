% load the file hello.erl
-module(hello).
% export function hello_world, which takes no args
-export([hello_world/0]).
% export function double, which takes one arg
-export([double/1]).

-export([fac/1]).
-export([convert/2]).


hello_world() -> io:fwrite("hello, world from Erlang in the memory of Joe Armstrong!\n").

double(X) -> 2 * X.


fac(1) -> 1; 
fac(N) -> N * fac(N - 1).


convert(M, inch) -> M / 2.54;
convert(N, centimeter) -> N * 2.54.

