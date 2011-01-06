
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
var _ = require('underscore')._;

function Set (members, opts) {
  this._members = {};
  this.length = 0;

  opts = opts || {};
  if (arguments.length === 1 && !_.isArray(arguments[0])) {
    opts = members;
    members = null;
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
    this._members[key] = (typeof member !== 'string') ? member : true;
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
  toArray: function () {
    var mems = this._members;
    function resolveMember (key) {
      if (typeof mems[key] === 'boolean') {
        return key;
      } else {
        return mems[key];
      }
    }
    var arr = _.map(_.keys(mems), resolveMember);
    return arr;
  },
  _hash: function (member, hashBy) {
    hashBy || (hashBy = this.hashBy);
    switch (typeof hashBy) {
      case 'string': return member[hashBy];
      case 'function': return hashBy(member);
      default: return member;
    }
  }
};

module.exports = Set;

}, 
'PATH/underscore/index': function(require, exports, module) {
var from = "./../.npm/underscore/1.1.3/package/underscore"
module.exports = require(from)
}, 
'PATH/underscore/../.npm/underscore/1.1.3/package/underscore': function(require, exports, module) {
//     Underscore.js 1.1.3
//     (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.1.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects implementing `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    var value;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (_.isNumber(obj.length)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    var results = [];
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial && index === 0) {
        memo = value;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    var results = [];
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    var result = true;
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    var result = false;
    each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) return breaker;
    });
    return result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    var found = false;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator = iterator || _.identity;
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return iterable;
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return n && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, _.isUndefined(index) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    var values = slice.call(arguments, 1);
    return _.filter(array, function(value){ return !_.include(values, value); });
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  _.indexOf = function(array, item) {
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (var i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    var args  = slice.call(arguments),
        solo  = args.length <= 1,
        start = solo ? 0 : args[0],
        stop  = solo ? args[0] : args[1],
        step  = args[2] || 1,
        len   = Math.max(Math.ceil((stop - start) / step), 0),
        idx   = 0,
        range = new Array(len);
    while (idx < len) {
      range[idx++] = start;
      start += step;
    }
    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  _.bind = function(func, obj) {
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj || {}, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher = hasher || _.identity;
    return function() {
      var key = hasher.apply(this, arguments);
      return key in memo ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(wrapper, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (_.isArray(obj)) return _.range(0, obj.length);
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    return _.filter(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) obj[prop] = source[prop];
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return !!(obj && obj.concat && obj.unshift && !obj.callee);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && obj.callee);
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value NaN -- this one is interesting. NaN != NaN, and
  // isNaN(undefined) == true, so we make sure it's a number first.
  _.isNaN = function(obj) {
    return toString.call(obj) === '[object Number]' && isNaN(obj);
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();

}, 
'./../lib/zset': function(require, exports, module) {
var _ = require('underscore')._;

function ZSet (members, opts) {
  this._members = {};
  this._orderedKeys = [];
  this.length = 0;

  opts = opts || {};
  if (arguments.length === 1 && !_.isArray(arguments[0])) {
    opts = members;
    members = null;
  }
  if (opts.hashBy) this.hashBy = opts.hashBy;
  if (opts.sortBy) this.sortBy = opts.sortBy;
  if (members) this.madd(members, opts);
}

ZSet.prototype = {
  contains: function (member, opts) {
    var key = this._hash(member, opts && opts.hashBy);
    return !!this._members[key];
  },
  add: function (member, opts, sortVal) {
    if (this.contains(member, opts)) return false;
    var key = this._hash(member, opts && opts.hashBy);
    this._members[key] = member;
    sortVal = this._resolveSortVal(sortVal || this.sortBy);
    this._orderedKeys.splice(this._indexOf(member, opts, sortVal), 0, {key: key, sortVal: sortVal});
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
  remove: function (member, opts, sortVal) {
    if (!this.contains(member, opts)) return false;
    var key = this._hash(member, opts && opts.hashBy);
    delete this._members[key];
    sortVal = this._resolveSortVal(sortVal);
    this._orderedKeys.splice(this._indexOf(member, opts, sortVal || this.sortBy), 1);
    this.length--;
    return true;
  },
  clear: function () {
    this._members = {};
    this._orderedKeys = [];
    this.length = 0;
  },
  mremove: function (members, opts) {
    var i = members.length
      , numRemoved = 0;
    while (i--) {
      numRemoved += this.remove(members[i], opts) ? 1 : 0;
    }
    return numRemoved;
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
    hashBy || (hashBy = this.hashBy);
    switch (typeof hashBy) {
      case 'string': return member[hashBy];
      case 'function': return hashBy(member);
      default: return member;
    }
  },
  _indexOf: function (member, opts, sortVal) {
    var key = this._hash(member, opts && opts.hashBy)
      , keys = this._orderedKeys
      , begin = 0
      , end = keys.length - 1
      , i = parseInt(end / 2, 10);
    while (begin < end) {
      if (keys[i].key === key) return i;
      if (keys[i].sortVal < sortVal) {
        begin = i;
      } else if (keys[i].sortVal >= sortVal) {
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
      } else if (currSortVal >= sortVal) {
        end = i;
      }
      i = parseInt( (end + begin) / 2, 10);
    }
    return i;
  },
  _resolveSortVal: function (sortVal) {
    var sortValType = typeof sortVal;
    if (sortValType === 'undefined') {
      return +new Date; // Default to insertion order
    } else if (sortValType === 'function') {
      return sortVal(member);
    } else if (sortValType === 'string') {
      return member[sortVal];
    }
    return sortVal;
  }
};

module.exports = ZSet;

}
});
require.ensure(function() {
var Set = require('../lib/set')
  , ZSet = require('../lib/zset')
  , _ = require('underscore')._;

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
  ok(s.remove(obj));
  ok(!s.contains(obj));
});

test('a set should be able to return an array representation of itself via toArray()', function () {
  var s = new Set([1, 2, 3, 4, 5]);
  same([1, 2, 3, 4, 5], _.sortBy(s.toArray(), function (m) { return m; }));
});

window.module('ZSet');
test('an empty zset should have length 0', function () {
  var s = new ZSet();
  equals(s.length, 0);
});

test('should return true when a non-member becomes a member of the zset', function () {
  var s = new ZSet();
  ok(s.add(1));
});

test('should return false if we try to add a member that already exists', function () {
  var s = new ZSet();
  ok(s.add('hello'));
  equals(s.add('hello'), false);
});

test('should be able to add multiple members', function () {
  var s = new ZSet();
  s.madd(['hello', 'world']);
  ok(s.contains('hello'));
  ok(s.contains('world'));
});

test('should return the number of members actually added when adding multiple members', function () {
  var s = new ZSet();
  s.add('hello');
  equals(s.madd(['hello', 'world', 'foo', 'bar']), 3);
});

test('the set constructor should be able to initialize a set with an array of members', function () {
  var s = new ZSet(['hello', 'world']);
  ok(s.contains('hello'));
  ok(s.contains('world'));
});

test('a set should know if it does not contain an object', function () {
  var s = new ZSet();
  equals(s.contains('hello'), false);
});

test('a member can be removed from the zset', function () {
  var s = new ZSet();
  s.add('hello');
  equals(s.remove('hello'), true);
  equals(s.contains('hello'), false);
});

test('should return false if we try to remove a member that does not exist', function () {
  var s = new ZSet();
  equals(s.remove('hello'), false);
});

test('a zset can clear all its members', function () {
  var s = new ZSet();
  s.add('hello');
  s.add('world');
  equals(s.length, 2);
  s.clear();
  equals(s.length, 0);
  equals(s.contains('hello'), false);
  equals(s.contains('world'), false);
});

});
})();
