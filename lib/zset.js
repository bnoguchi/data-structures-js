var _ = require('underscore')._;

function ZSet (members, opts) {
  this._members = {};
  this._orderedKeys = [];
  this.length = 0;

  this.nextDefaultSortVal = 0;

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
    sortVal = this._resolveSortVal(sortVal || this.sortBy, member);
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
    if (this._members[key] !== member) return false;
    delete this._members[key];
    sortVal = this._resolveSortVal(sortVal || this.sortBy, member);
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
  toArray: function () {
    var self = this;
    return _.map(this._orderedKeys, function (pair) {
      return self._members[pair.key];
    });
  },
  forEach: function (block, context) {
    var keys = this._orderedKeys
      , members = this._members
      , i = 0, l = keys.length;
    for (; i < l; i++) {
      block.call(context, members[keys[i].key], i)
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
      , end = keys.length
      , i = parseInt(end / 2, 10);
    while (begin < end) {
      if (keys[i].key === key) return i;
      if (keys[i].sortVal < sortVal) {
        begin = i + 1;
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
      , end = keys.length
      , i = parseInt(end / 2, 10)
      , currSortVal;
    while (begin < end) {
      currSortVal = keys[i].sortVal;
      if (currSortVal === sortVal) return i;
      if (currSortVal < sortVal) {
        begin = i + 1;
      } else if (currSortVal >= sortVal) {
        end = i - 1;
      }
      i = parseInt( (end + begin) / 2, 10);
    }
    return i;
  },
  _resolveSortVal: function (sortVal, member) {
    var sortValType = typeof sortVal;
    if (sortValType === 'undefined') {
      return this.nextDefaultSortVal++; // Default to insertion order
    } else if (sortValType === 'function') {
      return sortVal(member);
    } else if (sortValType === 'string') {
      return member[sortVal];
    }
    return sortVal;
  }
};

module.exports = ZSet;
