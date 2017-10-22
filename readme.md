node-tcp-hole-punching improved
===============================

Node.js script to demonstrate TCP hole punching through NAT.  The original
code was based on [this article][].  The idea is well described in
the [Wikipedia article][].

Improved compared with the [original code][] with the following fixes:
* Code refactored to comply with DRY principle. It became twice smaller.
* Comply to AirBnb JavaScript style guide with [minor exceptions][] so I can
  work with it :).
* Added _package.json_ is only for code linting. No need to install it if you
  want to just run the example.
* Added more code comments.

[original code]: https://github.com/denisglotov/node-tcp-hole-punching
[minor exceptions]: ./.eslintrc
[Wikipedia article]: https://en.wikipedia.org/wiki/TCP_hole_punching
[this article]: http://www.bford.info/pub/net/p2pnat/index.html


How to
------

Run publicserver.js on a public server, accessible to all peers.

    node publicserver.js 3000

Run client.js on your either host behind a NAT.

    node client.js my-public-server.example.com 3000 peerA
    node client.js my-public-server.example.com 3000 peerB

Optionally you may omit last parameter, your username will be used
instead. But make sure that usernames of peers are different!

Good Luck 😹


Lint
----

Linting is important to keep the code accurate. To install the eslint tool,
run `npm i`. Then use `npm run lint -- *.js` to lint the project manually.
