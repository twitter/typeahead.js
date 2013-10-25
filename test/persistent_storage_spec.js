describe('PersistentStorage', function() {
  var engine, ls = window.localStorage;

  beforeEach(function() {
    engine = new PersistentStorage('ns');

    spyOn(ls, 'getItem').andCallThrough();
    spyOn(ls, 'setItem').andCallThrough();
    spyOn(ls, 'removeItem').andCallThrough();

    spyOn(Date.prototype, 'getTime').andReturn(0);
  });

  afterEach(function() {
    ls.clear();
  });

  // public methods
  // --------------

  describe('#get', function() {
    it('should access localStorage with prefixed key', function() {
      engine.get('key');
      expect(ls.getItem).toHaveBeenCalledWith('__ns__key');
    });

    it('should return undefined when key does not exist', function() {
      expect(engine.get('does not exist')).toEqual(undefined);
    });

    it('should return value as correct type', function() {
      engine.set('string', 'i am a string');
      engine.set('number', 42);
      engine.set('boolean', true);
      engine.set('null', null);
      engine.set('object', { obj: true });

      expect(engine.get('string')).toEqual('i am a string');
      expect(engine.get('number')).toEqual(42);
      expect(engine.get('boolean')).toEqual(true);
      expect(engine.get('null')).toBeNull();
      expect(engine.get('object')).toEqual({ obj: true });
    });

    it('should expire stale keys', function() {
      engine.set('key', 'value', -1);

      expect(engine.get('key')).toBeNull();
      expect(ls.getItem('__ns__key__ttl')).toBeNull();
    });
  });

  describe('#set', function() {
    it('should access localStorage with prefixed key', function() {
      engine.set('key', 'val');
      expect(ls.setItem.mostRecentCall.args[0]).toEqual('__ns__key');
    });

    it('should JSON.stringify value before storing', function() {
      engine.set('key', 'val');
      expect(ls.setItem.mostRecentCall.args[1]).toEqual(JSON.stringify('val'));
    });

    it('should store ttl if provided', function() {
      var ttl = 1;
      engine.set('key', 'value', ttl);

      expect(ls.setItem.argsForCall[0])
      .toEqual(['__ns__key__ttl__', ttl.toString()]);
    });
  });

  describe('#remove', function() {

    it('should remove key from storage', function() {
      engine.set('key', 'val');
      engine.remove('key');

      expect(engine.get('key')).toBeNull();
    });
  });

  describe('#clear', function() {
    it('should remove all keys that exist in namespace of engine', function() {
      engine.set('key1', 'val1');
      engine.set('key2', 'val2');
      engine.set('key3', 'val3');
      engine.set('key4', 'val4', 0);
      engine.clear();

      expect(engine.get('key1')).toEqual(undefined);
      expect(engine.get('key2')).toEqual(undefined);
      expect(engine.get('key3')).toEqual(undefined);
      expect(engine.get('key4')).toEqual(undefined);
    });

    it('should not affect keys with different namespace', function() {
      ls.setItem('diff_namespace', 'val');
      engine.clear();

      expect(ls.getItem('diff_namespace')).toEqual('val');
    });
  });

  describe('#isExpired', function() {
    it('should be false for keys without ttl', function() {
      engine.set('key', 'value');
      expect(engine.isExpired('key')).toBe(false);
    });

    it('should be false for fresh keys', function() {
      engine.set('key', 'value', 1);
      expect(engine.isExpired('key')).toBe(false);
    });

    it('should be true for stale keys', function() {
      engine.set('key', 'value', -1);
      expect(engine.isExpired('key')).toBe(true);
    });
  });
});
