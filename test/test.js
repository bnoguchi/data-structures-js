
(function() {var require = (function() {
  var _isArray = Array.isArray || function(obj) {
        return !!(obj && obj.concat && obj.unshift && !obj.callee);
      }
    , _keys = Object.keys || function(obj) {
        if (_isArray(obj)) return _.range(0, obj.length);
        var keys = [];
        for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) keys[keys.length] = key;
        return keys;
      }
    , _dependencyGraph = {}
    , _factories = {} // Maps "ids" to factories that load its logic into a module.exports
    , _modules = {} // Maps "keys" to module objects of form {id: ..., exports: {...}}
    , _currDir
    , _contexts = [_currDir = './']
    , PREFIX = '__module__'; // Prefix identifiers to avoid issues in IE.
      
  /**
   * While context: ./
   * ----REQUIRE----             ----FACTORY NAME----
   * require('./index') ->       ./index
   * require('../lib/class')     ./../lib/class
   * require('lingo')            PATH/lingo
   *
   * While context: PATH/lingo/
   * require('./lib')            PATH/lingo/lib
   * require('../dir/index')     PATH/lingo/../dir/index
   * require('utils')            PATH/utils
   *
   * While context: PATH/lingo/../dir/
   * require('./lib')            PATH/lingo/../dir/lib
   * require('../lib')           PATH/lingo/../lib
   * require('../../lib')        PATH/lingo/../../lib  [PATH, lingo, .., dir, .., .., lib]
   *  
   */
  function require (identifier) {
    var id = resolveIdentifier(identifier)
      , key = PREFIX + id
      , mod = _modules[key] || (_modules[key] = loadModule(identifier, id, key));
    return mod.exports;
  }

  function loadModule (identifier, id, key) {
    var fn = _factories[key]
      , mod = { id: id, exports: {} }
      , expts = mod.exports;
    _contexts.push(_currDir = id.substring(0, id.lastIndexOf('/') + 1))
    try {
      if (!fn) { throw 'Can\'t find module "' + identifier + '" keyed as "' + id + '".'; }
      if (typeof fn === 'string') {
        fn = new Function('require', 'exports', 'module', fn);
      }
      fn(require, expts, mod);
      if (_keys(expts).length) mod.exports = expts;
      _contexts.pop();
      _currDir = _contexts[_contexts.length-1];
    } catch(e) {
      _contexts.pop();
      _currDir = _contexts[_contexts.length-1];
      // We'd use a finally statement here if it wasn't for IE.
      throw e;
    }
    return mod;
  }
  
  function resolveIdentifier (identifier) {
    if (identifier.charAt(0) !== '.') { // This module exists relative to PATH/
      var dir = ['PATH', identifier, ''].join('/');
      return _factories[PREFIX + dir + 'index'] 
        ? (dir + 'index')
        : dir.substring(0, dir.length-1);
    }

    var parts, part, path, dir;
    parts = _currDir.split('/').concat(identifier.split('/'));
    path = [];
    for (var i = 0, l = parts.length; i < l; i++) {
      part = parts[i];
      if (part === '') continue;
      if (part === '.') {
        if (path.length === 0 && parts[0] === '.') {
          path.push(part);
        }
      } else if (part === '..') {
        if (path[path.length-1].charAt(0) === '.' ||
            parts[0] === 'PATH' && path.length === 2) {
          path.push(part);
        } else {
          path.pop();
        }
      } else {
        path.push(part);
      }
    }
    return path.join('/');
  }
  
  function define (id2module) {
    for (var id in id2module) {
      _factories[PREFIX + id] = id2module[id];
    }
  }
  
  function ensure(factory) {
    factory();
  }
  
  require.define = define;
  require.ensure = ensure;
  require.main = {};

  return require; 
})()
, module = require.main;

require.define({
'./../lib/set': function(require, exports, module) {
var isArray = Array.isArray || function (obj) {
  return !!(obj && obj.concat && obj.unshift && !obj.callee);
};

function Set (members, opts) {
  this._members = {};
  this.length = 0;

  opts = opts || {};
  if (arguments.length === 1 && !isArray(arguments[0])) {
    opts = members;
    members = [];
  }
  if (opts.hashBy) this.hashBy = opts.hashBy;
  if (members) this.madd(members);
}

Set.prototype = {
  contains: function (member, opts) {
    var key = this._hash(member, opts && opts.hashBy);
    return !!this._members[key];
  },
  add: function (member, opts) {
    if (this.contains(member, opts)) return false;
    var key = this._hash(member, opts && opts.hashBy);
    this._members[key] = (opts && opts.hashBy) ? member : true;
    this.length++;
    return true;
  },
  madd: function (members, opts) {
    var i = members.length
      , numAdded = 0;
    while (i--) {
      numAdded += this.add(members[i], opts) ? 1 : 0;
    }
    return numAdded;
  },
  remove: function (member, opts) {
    if (!this.contains(member, opts)) return false;
    var key = this._hash(member, opts && opts.hashBy);
    delete this._members[key];
    this.length--;
    return true;
  },
  mremove: function (members, opts) {
    var i = members.length
      , numRemoved = 0;
    while (i--) {
      numRemoved += this.remove(members[i], opts) ? 1 : 0;
    }
    return numRemoved;
  },
  clear: function () {
    this._members = {};
    this.length = 0;
  },
  forEach: function (block, context) {
    var k, members = this._members;
    for (k in members) {
      block.call(context, typeof members[k] === "boolean" ? k : members[k]);
    }
  },
  _hash: function (member, hashBy) {
    switch (typeof hashBy || this.hashBy) {
      case 'string': return member[hashBy];
      case 'function': return hashBy(member);
      default: return member;
    }
  }
};

module.exports = Set;

}, 
'./../lib/zset': function(require, exports, module) {
function ZSet (initialMembers, opts) {
  this._members = {};
  this._orderedKeys = [];
  this.length = 0;

  var member;
  if (initialMembers) for (var i = 0, l = initialMembers.length; i < l; i++) {
    member = initialMembers[i];
    this.add(member, opts);
  }
}

ZSet.prototype = {
  contains: function (member, opts) {
    var key = this._hash(member, opts.hashBy);
    return !!this._members[key];
  },
  add: function (member, opts, sortVal) {
    sortVal || (sortVal = +new Date); // Default to insertion order
    if (this.contains(member, opts)) return false;
    var key = this._hash(member, opts.hashBy);
    this._members[key] = member;
    this._orderedKeys.splice(this._indexOf(member, opts, sortVal), 0, {key: key, sortVal: sortVal});
    this.length++;
    return true;
  },
  remove: function (member, opts) {
    if (!this.contains(member, opts)) return false;
    var key = this._hash(member, opts.hashBy);
    delete this._members[key];
    this._orderedKeys.splice(this._indexOf(member, opts), 1);
    this.length--;
    return true;
  },
  forEach: function (block, context) {
    var keys = this._orderedKeys
      , members = this._members
      , i = 0, l = keys.length;
    for (; i < l; i++) {
      block.call(context, members[keys[i]], i)
    } 
  },
  /**
   * @param {Object} lb is the lower bound
   * @param {Function} block
   * @param {Object} context
   */
  forEachGte: function (lb, block, context) {
    var keys = this._orderedKeys
      , i = this._indexOfSortVal(lb)
      , l = keys.length;
    for ( ; i < l; i++) {
      block.call(context, members[keys[i]], keys[i].sortVal, i);
    }
  },
  _hash: function (member, hashBy) {
    return hashBy ? member[hashBy] : member;
  },
  _indexOf: function (member, opts, sortVal) {
    var key = this._hash(member, opts.hashBy)
      , keys = this._orderedKeys
      , begin = 0
      , end = keys.length - 1
      , i = parseInt(end / 2, 10);
    while (begin < end) {
      if (keys[i].key === key) return i;
      if (keys[i].sortVal < sortVal) {
        begin = i;
      } else if (keys[i].sortVal > sortVal) {
        end = i;
      }
      i = parseInt( (end + begin) / 2, 10);
    }
    return i;
  },
  _indexOfSortVal: function (sortVal) {
    var keys = this._orderedKeys
      , begin = 0
      , end = keys.length - 1
      , i = parseInt(end / 2, 10)
      , currSortVal;
    while (begin < end) {
      currSortVal = keys[i].sortVal;
      if (currSortVal === sortVal) return i;
      if (currSortVal < sortVal) {
        begin = i;
      } else if (currSortVal > sortVal) {
        end = i;
      }
      i = parseInt( (end + begin) / 2, 10);
    }
    return i;
  }
};

module.exports = ZSet;

}
});
require.ensure(function() {
var Set = require('../lib/set')
  , ZSet = require('../lib/zset');

window.module('Set');
test('an empty set should have length 0', function () {
  var s = new Set();
  equals(s.length, 0);
});

test('a member can be added to the set', function () {
  var s = new Set();
  equals(s.add('hello'), true);
  equals(s.contains('hello'), true);
});

test('should return false if we try to add a member that already exists', function () {
  var s = new Set();
  equals(s.add('hello'), true);
  equals(s.add('hello'), false);
});

test('should be able to add multiple members', function () {
  var s = new Set();
  s.madd(['hello', 'world']);
  ok(s.contains('hello'));
  ok(s.contains('world'));
});

test('should return the number of members actually added when adding multiple members', function () {
  var s = new Set();
  s.add('hello');
  equals(s.madd(['hello', 'world', 'foo', 'bar']), 3);
});

test('the set constructor should be able to initialize a set with an array of members', function () {
  var s = new Set(['hello', 'world']);
  ok(s.contains('hello'));
  ok(s.contains('world'));
});

test('a set should know if it does not contain an object', function () {
  var s = new Set();
  equals(s.contains('hello'), false);
});

test('a member can be removed from the set', function () {
  var s = new Set();
  s.add('hello');
  equals(s.remove('hello'), true);
  equals(s.contains('hello'), false);
});

test('should return false if we try to remove a member that does not exist', function () {
  var s = new Set();
  equals(s.remove('hello'), false);
});

test('a set can clear all its members', function () {
  var s = new Set();
  s.add('hello');
  s.add('world');
  equals(s.length, 2);
  s.clear();
  equals(s.length, 0);
  equals(s.contains('hello'), false);
  equals(s.contains('world'), false);
});

test('a set can iterate through its members', function () {
  var s = new Set()
    , arr = ['foo', 'bar']
    , i, l = arr.length;
  for ( ; i < l; i++) s.add(arr[i]);
  s.forEach(function (mem) {
    equals(arr[++i], mem);
  });
});

test('a set can iterate through its members with a block and context', function () {
  var s = new Set()
    , arr = ['foo', 'bar']
    , i, l = arr.length;
  for ( ; i < l; i++) s.add(arr[i]);
  s.forEach(function (mem) {
    equals(this.noFirstChar(arr[++i]), this.noFirstChar(mem));
  }, {noFirstChar: function (str) {return str.substring(1); } });
});

test('a set can add an object, specifying the object key to hash by for internal storage in the set', function () {
  var s = new Set()
    , obj = {some: 'obj', keyA: 'me'};
  ok(s.add(obj, {hashBy: 'keyA'}));
  ok(s.contains(obj, {hashBy: 'keyA'}));
});

test('a set can insert an object, via a hashing function', function () {
  var s = new Set()
    , obj = {some: 'obj', keyA: 'me'};
  function hashBy (obj) {
    return obj.keyA;
  }
  ok(s.add(obj, {hashBy: hashBy}));
  ok(s.contains(obj, {hashBy: hashBy}));
});

test('a set can set a default hashing strategy by which it can hash incoming objects that quack like the duck it expects', function () {
  var s = new Set({hashBy: 'hash'})
    , obj = {some: 'obj', hash: 'e4mrg5mk'};
  ok(s.add(obj));
  ok(s.contains(obj));
});

window.module('ZSet');
test('an empty zset should have length 0', function () {
  var s = new ZSet();
  equals(s.length, 0);
});

window.onload = onload;

});
})();
