describe('RequestCache', function() {
  var mockVal = { prop: 'val' };

  beforeEach(function() {
    this.requestCache = new RequestCache({ sizeLimit: 3 });
  });

  // public methods
  // --------------

  describe('#get', function() {
    it('should return undefined if miss', function() {
      expect(this.requestCache.get('miss')).toBeUndefined();
    });

    it('should return value if hit', function() {
      this.requestCache.set('hit', mockVal);
      expect(this.requestCache.get('hit')).toEqual(mockVal);
    });
  });

  describe('#set', function() {
    describe('when at limit', function() {
      beforeEach(function() {
        this.requestCache.set('one', mockVal);
        this.requestCache.set('two', mockVal);
        this.requestCache.set('three', mockVal);
      });

      it('should evict oldest key-value pair', function() {
        this.requestCache.set('four', mockVal);
        expect(this.requestCache.get('one')).toBeUndefined();
      });
    });

    it('should store key-value', function() {
      this.requestCache.set('hit', mockVal);
      expect(this.requestCache.cache.hit).toEqual(mockVal);
    });
  });
});
