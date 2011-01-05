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
