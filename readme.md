node-tcp-hole-punching improved
===============================

Node.js script to demonstrate TCP hole punching through NAT.

Improved compared with the [original code][] with the following fixes:
* Single _client.js_ code instead of clientA and clientB copies. To comply
  with DRY principle.
* Comply to AirBnb JavaScript style guide with [minor exceptions][] so I can
  work with it :).
* Added `package.json` is _only_ for linting. No need to install it if you
  want to just run the example.

[original code]: https://github.com/denisglotov/node-tcp-hole-punching
[minor exceptions]: ./.eslintrc


How to
------

Run publicserver.js on a public server (not behind a NAT).

Run clientA.js on your first computer behind a NAT.

Run clientB.js on your second computer behind a (different) NAT.

Important: Run clientA.js first, run clientB.js second. (The only reason for
this is that publicserver.js will show the correct debug messages).


Good Luck!


Output
------

Output should be something like this:

```
> (B->S) connecting to S
> (B->S) connected to S via 192.168.204.147 56504
> (B->S) response from S: {"name":"B","localAddress":"192.168.204.147","localPort":56504,"remoteAddress":"b.b.b.b","remotePort":56504}

> (B) 192.168.204.147:56504 ===> (NAT of B) b.b.b.b:56504 ===> (S) s.s.s.s:9999

> (B->S) response from S: {"name":"A","localAddress":"10.125.152.30","localPort":49468,"remoteAddress":"a.a.a.a","remotePort":33990}
> (B) time to listen on port used to connect to S (56504)
> (B->A) connecting to A: ===> (A) a.a.a.a:33990
> (B) listening on  192.168.204.147:56504
> (B->A) connection closed with err: ECONNREFUSED
> (B->A) connecting to A: ===> (A) a.a.a.a:33990
> (B->A) Connected to A via a.a.a.a:33990
> (B->A) data from A: Hello there NAT traversal man, you are connected to A!
```


Lint
----

Linting is important to keep the code accurate. To install the eslint tool,
run `npm i`. Then use `npm run lint -- *.js` to lint the project manually.
