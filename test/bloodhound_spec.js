describe('Bloodhound', function() {

  beforeEach(function() {
    jasmine.Ajax.useMock();
    jasmine.Transport.useMock();
    jasmine.PersistentStorage.useMock();
  });

  afterEach(function() {
    clearAjaxRequests();
  });

  describe('#initialize', function() {
    beforeEach(function() {
      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple
      });

      spyOn(this.bloodhound, '_initialize').andCallThrough();
    });

    it('should not support reinitialization by default', function() {
      var p1, p2;

      p1 = this.bloodhound.initialize();
      p2 = this.bloodhound.initialize();

      expect(p1).toBe(p2);
      expect(this.bloodhound._initialize.callCount).toBe(1);
    });

    it('should reinitialize if reintialize flag is true', function() {
      var p1, p2;

      p1 = this.bloodhound.initialize();
      p2 = this.bloodhound.initialize(true);

      expect(p1).not.toBe(p2);
      expect(this.bloodhound._initialize.callCount).toBe(2);
    });
  });

  describe('#add', function() {
    it('should add datums to search index', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: []
      });
      this.bloodhound.initialize();
      this.bloodhound.add(fixtures.data.simple);

      this.bloodhound.get('big', spy);

      expect(spy).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
    });
  });

  describe('#clear', function() {
    it('should remove all datums to search index', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple
      });
      this.bloodhound.initialize();
      this.bloodhound.clear();

      this.bloodhound.get('big', spy);

      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  describe('#clearPrefetchCache', function() {
    it('should clear persistent storage', function() {
      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: '/test'
      });
      this.bloodhound.initialize();
      this.bloodhound.clearPrefetchCache();

      expect(this.bloodhound.storage.clear).toHaveBeenCalled();
    });
  });

  describe('#clearRemoteCache', function() {
    it('should clear remote request cache', function() {
      spyOn(Transport, 'resetCache');

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: '/test'
      });
      this.bloodhound.initialize();

      this.bloodhound.clearRemoteCache();
      expect(Transport.resetCache).toHaveBeenCalled();
    });
  });

  describe('local', function() {
    describe('when local is an array', function() {
      beforeEach(function() {
        this.bloodhound = new Bloodhound({
          datumTokenizer: datumTokenizer,
          queryTokenizer: queryTokenizer,
          local: fixtures.data.simple
        });

        this.bloodhound.initialize();
      });

      it('should hydrate the bloodhound', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.get('big', spy);

        expect(spy).toHaveBeenCalledWith([
          { value: 'big' },
          { value: 'bigger' },
          { value: 'biggest' }
        ]);
      });
    });

    describe('when local is a function that returns an array', function() {
      beforeEach(function() {
        var localFn = function() {
          return fixtures.data.simple;
        };

        this.bloodhound = new Bloodhound({
          datumTokenizer: datumTokenizer,
          queryTokenizer: queryTokenizer,
          local: localFn
        });

        this.bloodhound.initialize();
      });

      it('should hydrate the bloodhound', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.get('big', spy);

        expect(spy).toHaveBeenCalledWith([
          { value: 'big' },
          { value: 'bigger' },
          { value: 'biggest' }
        ]);
      });
    });
  });

  describe('prefetch', function() {
    it('should throw error if url is not set', function() {
      expect(test).toThrow();

      function test() { var d = new Bloodhound({ prefetch: {} }); }
    });

    it('should use url or cacheKey to store data locally', function() {
      var ttl = 100;

      this.bloodhound1 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: { url: '/test1', cacheKey: 'woah' }
      });
      expect(PersistentStorage).toHaveBeenCalledWith('woah');

      this.bloodhound2 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: { url: '/test2', ttl: ttl, thumbprint: '!' }
      });
      expect(PersistentStorage).toHaveBeenCalledWith('/test2');

      this.bloodhound2.initialize();
      ajaxRequests[0].response(fixtures.ajaxResps.ok);

      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('data', fixtures.serialized.simple, ttl);
      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('protocol', 'http:', ttl);
      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('thumbprint', '%VERSION%!', ttl);
    });

    it('should load data from provided url', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy();
      spy2 = jasmine.createSpy();

      this.bloodhound1 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: '/test1'
      });
      this.bloodhound2 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: { url: '/test2' }
      });
      this.bloodhound1.initialize();
      this.bloodhound2.initialize();

      ajaxRequests[0].response(fixtures.ajaxResps.ok);
      ajaxRequests[1].response(fixtures.ajaxResps.ok);

      expect(ajaxRequests[0].url).toBe('/test1');
      expect(ajaxRequests[1].url).toBe('/test2');

      this.bloodhound1.get('big', spy1);
      this.bloodhound2.get('big', spy2);

      expect(spy1).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);

      expect(spy2).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
    });

    it('should clear preexisting data', function() {
      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: '/test'
      });

      spyOn(this.bloodhound, 'clear');
      this.bloodhound.initialize();

      mostRecentAjaxRequest().response(fixtures.ajaxResps.ok);
      expect(this.bloodhound.clear).toHaveBeenCalled();
    });

    it('should filter data if filter is provided', function() {
      var filterSpy, spy;

      filterSpy = jasmine.createSpy().andCallFake(fakeFilter);
      spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: { url: '/test', filter: filterSpy }
      });
      this.bloodhound.initialize();

      mostRecentAjaxRequest().response(fixtures.ajaxResps.ok);

      expect(filterSpy).toHaveBeenCalled();

      this.bloodhound.get('big', spy);

      expect(spy).toHaveBeenCalledWith([
        { value: 'BIG' },
        { value: 'BIGGER' },
        { value: 'BIGGEST' }
      ]);

      function fakeFilter(resp) {
        return [{ value: 'BIG' }, { value: 'BIGGER' }, { value: 'BIGGEST' }];
      }
    });

    it('should not make a request if data is available in storage', function() {
      var that = this, spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: '/test'
      });
      this.bloodhound.storage.get.andCallFake(fakeGet);
      this.bloodhound.initialize();

      expect(mostRecentAjaxRequest()).toBeNull();

      this.bloodhound.get('big', spy);

      expect(spy).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);

      function fakeGet(key) {
        var val;

        switch (key) {
          case 'data':
            val = fixtures.serialized.simple;
            break;
          case 'protocol':
            val = 'http:';
            break;
          case 'thumbprint':
            val = that.bloodhound.prefetch.thumbprint;
            break;
        }

        return val;
      }
    });
  });

  describe('remote', function() {
    it('should perform query substitution on the provided url', function() {
      this.bloodhound1 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: { url: '/test?q=$$', wildcard: '$$' }
      });
      this.bloodhound2 = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: {
          url: '/test?q=%QUERY',
          replace: function(str, query) {return str.replace('%QUERY', query);  }
        }
      });

      this.bloodhound1.initialize();
      this.bloodhound2.initialize();

      this.bloodhound1.get('one two', $.noop);
      this.bloodhound2.get('one two', $.noop);

      expect(this.bloodhound1.transport.get).toHaveBeenCalledWith(
        '/test?q=one%20two',
        { type: 'GET', dataType: 'json' },
        jasmine.any(Function)
      );

      expect(this.bloodhound2.transport.get).toHaveBeenCalledWith(
        '/test?q=one two',
        { type: 'GET', dataType: 'json' },
        jasmine.any(Function)
      );
    });

    it('should filter the response if a filter is provided', function() {
      var filterSpy, spy;

      spy = jasmine.createSpy();
      filterSpy = jasmine.createSpy().andCallFake(fakeFilter);

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: { url: '/test', filter: filterSpy }
      });
      this.bloodhound.initialize();

      this.bloodhound.transport.get.andCallFake(fakeGet);
      this.bloodhound.get('big', spy);

      waitsFor(function() { return spy.callCount; });

      runs(function() {
        expect(filterSpy).toHaveBeenCalled();

        expect(spy).toHaveBeenCalledWith([
          { value: 'BIG' },
          { value: 'BIGGER' },
          { value: 'BIGGEST' }
        ]);
      });

      function fakeFilter(resp) {
        return [{ value: 'BIG' }, { value: 'BIGGER' }, { value: 'BIGGEST' }];
      }

      function fakeGet(url, o, cb) {
        cb(null, fixtures.data.simple);
      }
    });

    describe('when there is not matching data in the search index', function() {
      beforeEach(function() {
        this.bloodhound = new Bloodhound({
          datumTokenizer: datumTokenizer,
          queryTokenizer: queryTokenizer,
          remote: '/test?q=%QUERY',
          local: { value: 'not an animal' }
        });

        this.bloodhound.initialize();
      });

      it('should call #get callback once if there is a cache hit', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGetWithCacheHit);
        this.bloodhound.get('dog', spy);

        expect(spy.callCount).toBe(1);

        function fakeGetWithCacheHit(url, o, cb) {
          cb(null, fixtures.data.animals);
          return true;
        }
      });

      it('should call #get callback once if there is a cache miss', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGetWithCacheMiss);
        this.bloodhound.get('dog', spy);

        expect(spy.callCount).toBe(1);

        function fakeGetWithCacheMiss(url, o, cb) {
          cb(null, fixtures.data.animals);
          return false;
        }
      });

    });

    describe('when there is matching data in the search index', function() {
      beforeEach(function() {
        this.bloodhound = new Bloodhound({
          datumTokenizer: datumTokenizer,
          queryTokenizer: queryTokenizer,
          remote: '/test?q=%QUERY',
          local: { value: 'dog' }
        });

        this.bloodhound.initialize();
      });

      it('should call the #get callback twice if there is a cache miss', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGetWithCacheMiss);
        this.bloodhound.get('dog', spy);

        expect(spy.callCount).toBe(2);

        function fakeGetWithCacheMiss(url, o, cb) {
          cb(null, fixtures.data.animals);
          return false;
        }
      });

      it('should call the #get callback once if there is a cache hit', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGetWithCacheHit);
        this.bloodhound.get('dog', spy);

        expect(spy.callCount).toBe(1);

        function fakeGetWithCacheHit(url, o, cb) {
          cb(null, fixtures.data.animals);
          return true;
        }
      });
    });

    it('should should treat failures as empty suggestion sets', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: '/test?q=%QUERY'
      });
      this.bloodhound.initialize();
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('dog', spy);

      expect(spy).toHaveBeenCalledWith([]);

      function fakeGet(url, o, cb) { cb(true); }
    });
  });

  describe('local/prefetch/remote integration', function() {
    it('duplicates should be removed if dupDetector is provided', function() {
      var spy;

      spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        limit: 6,
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        dupDetector: function(d1, d2) { return d1.value === d2.value; },
        local: fixtures.data.animals,
        remote: { url: '/test?q=%QUERY' }
      });

      this.bloodhound.initialize();

      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('dog', spy);

      expect(spy).toHaveBeenCalledWith([{ value: 'dog' }]);

      waitsFor(function() { return spy.callCount === 2; });

      runs(function() {
        expect(spy).toHaveBeenCalledWith(fixtures.data.animals);
      });

      function fakeGet(url, o, cb) {
        setTimeout(function() { cb(null, fixtures.data.animals); }, 0);
      }
    });

    it('remote should backfill local/prefetch', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy();
      spy2 = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        limit: 3,
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple,
        remote: { url: '/test?q=%QUERY' }
      });
      this.bloodhound.initialize();

      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('big', spy1);
      this.bloodhound.get('bigg', spy2);

      expect(spy1.callCount).toBe(1);
      expect(spy2.callCount).toBe(1);

      expect(spy1).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
      expect(spy2).toHaveBeenCalledWith([
        { value: 'bigger' },
        { value: 'biggest' }
      ]);

      waitsFor(function() { return spy2.callCount === 2; });

      runs(function() {
        expect(spy2).toHaveBeenCalledWith([
          { value: 'bigger' },
          { value: 'biggest' },
          { value: 'dog' }
        ]);
      });

      function fakeGet(url, o, cb) {
        setTimeout(function() { cb(null, fixtures.data.animals); }, 0);
      }
    });
  });

  // helper functions
  // ----------------

  function datumTokenizer(d) { return $.trim(d.value).split(/\s+/); }
  function queryTokenizer(s) { return $.trim(s).split(/\s+/); }
});
