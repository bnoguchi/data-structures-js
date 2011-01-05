## data-structures-js - Useful data structures for Javascript (for browser and commonjs compliant Javascript servers)
---

### Sets
Provided is a versatile Set implementation. It comes with a complete suite of tests (see test/test.js).

To create an empty set:
    var Set = require('data-structures-js/set');
    var set = new Set();

To create a non-empty set:
    var set = new Set(['hello', 'world']);

To add a single member to a set:
    set.add('foo');

To add multiple members to a set:
    set.madd(['foo', 'bar']);

To test membership:
    set.contains('foo');

To remove a single member:
    set.remove('hello');

To remove multiple members:
    set.mremove(['hello', 'world']);

To clear the set:
    set.clear();

To iterate through set members:
    set.forEach( function (member) {
      console.log(member);
    });

Internally, we store our members in a hash table for O(1) lookup. Therefore, to add anything beyond simple values (where simple values are numbers, strings, etc.) such as an Object instance, you need to tell the set how you want to hash the incoming member.

We can hash our incoming object by key:
    set.add({key: 'hello', value: 'world'}, {hashBy: 'key'});
    set.contains({key: 'hello', value: 'world'}, {hashBy: 'key'});
    set.remove({key: 'hello', value: 'world'}, {hashBy: 'key'});

We can also hash via a hashing function:
    set.add({key: 'hello', value: 'world'}, {hashBy: function (newMember) {
      md5(newMember);
    });
    set.contains({key: 'hello', value: 'world'}, {hashBy: function (newMember) {
      md5(newMember);
    });
    set.remove({key: 'hello', value: 'world'}, {hashBy: function (newMember) {
      md5(newMember);
    });

If we expect the set to consist of members that always respond to a specific hashing scheme, then we can set a default hashBy strategy in the Set constructor, so we do not have to pass in {hashby: ...} to every call to add, remove, or contains.
    var set = new Set({hashBy: 'key'});
    set.add({key: 'hello', value: 'world'});
    set.contains({key: 'hello', value: 'world'});
    set.remove({key: 'hello', value: 'world'});

### Sorted Set (ZSet)
To create an empty sorted set:
    var ZSet = require('data-structures-js/zset');
    var zset = new ZSet();

More documentation coming soon...

### Testing
To run tests in the browser:
    /path/to/bin/browser test/index.html

# Contributors
- [Brian Noguchi](http://github.com/bnoguchi)

### License
MIT License

---
### Author
Brian Noguchi
