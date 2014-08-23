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
        initialize: false,
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple
      });

      spyOn(this.bloodhound, '_initialize').andCallThrough();
    });

    it('should not initialize if intialize option is false', function() {
      expect(this.bloodhound._initialize).not.toHaveBeenCalled();
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
      }).add(fixtures.data.simple);

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
      }).clear();

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
      }).clearPrefetchCache();

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
      }) .clearRemoteCache();

      expect(Transport.resetCache).toHaveBeenCalled();
    });
  });

  describe('#all', function() {
    it('should return all local results', function() {
      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple
      });

      expect(this.bloodhound.all()).toEqual(fixtures.data.simple);
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
      });

      it('should hydrate the bloodhound', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.get('big', spy)

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
      });

      it('should hydrate the bloodhound', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.get('big', spy)

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
        initialize: false,
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

      ajaxRequests[0].response(fixtures.ajaxResps.ok);

      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('data', fixtures.serialized.simple, ttl);
      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('protocol', 'http:', ttl);
      expect(this.bloodhound2.storage.set)
        .toHaveBeenCalledWith('thumbprint', '%VERSION%!', ttl);
    });

    it('should load data from provided url', function() {
      var spy1 = jasmine.createSpy(), spy2 = jasmine.createSpy();

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
        initialize: false,
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
      var spy, fakeFilter;

      spy = jasmine.createSpy();
      fakeFilter = jasmine.createSpy().andCallFake(fakeFilterImpl);

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        prefetch: { url: '/test', filter: fakeFilter }
      });

      mostRecentAjaxRequest().response(fixtures.ajaxResps.ok);
      expect(fakeFilter).toHaveBeenCalled();

      this.bloodhound.get('big', spy);

      expect(spy).toHaveBeenCalledWith([
        { value: 'BIG' },
        { value: 'BIGGER' },
        { value: 'BIGGEST' }
      ]);

      function fakeFilterImpl(resp) {
        return [{ value: 'BIG' }, { value: 'BIGGER' }, { value: 'BIGGEST' }];
      }
    });

    it('should not make a request if data is available in storage', function() {
      var that = this, spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        initialize: false,
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
    it('should respect before transform', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: {
          url: '/test?q=%QUERY',
          before: function(ajax) { return { url: '/foo' }; }
        }
      });

      this.bloodhound.get('one two', $.noop, spy);

      expect(this.bloodhound.transport.get).toHaveBeenCalledWith(
        { url: '/foo' },
        jasmine.any(Function)
      );
    });

    it('should perform query substitution on the provided url', function() {
      var spy = jasmine.createSpy();

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
          replace: function(str, q) { return str.replace('%QUERY', q);  }
        }
      });

      this.bloodhound1.get('one two', $.noop, spy);
      this.bloodhound2.get('one two', $.noop, spy);

      expect(this.bloodhound1.transport.get).toHaveBeenCalledWith(
        { url: '/test?q=one%20two', type: 'GET', dataType: 'json' },
        jasmine.any(Function)
      );

      expect(this.bloodhound2.transport.get).toHaveBeenCalledWith(
        { url: '/test?q=one two', type: 'GET', dataType: 'json' },
        jasmine.any(Function)
      );
    });

    it('should filter the response if a filter is provided', function() {
      var spy, fakeFilter;

      spy = jasmine.createSpy();
      fakeFilter = jasmine.createSpy().andCallFake(fakeFilterImpl);

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: { url: '/test', filter: fakeFilter }
      });
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('big', $.noop, spy);

      expect(fakeFilter).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith([
        { value: 'BIG' },
        { value: 'BIGGER' },
        { value: 'BIGGEST' }
      ]);

      function fakeFilterImpl(resp) {
        return [{ value: 'BIG' }, { value: 'BIGGER' }, { value: 'BIGGEST' }];
      }

      function fakeGet(o, cb) {
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
      });

      it('should call #get callback once', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGet);
        this.bloodhound.get('dog', $.noop, spy);

        expect(spy.callCount).toBe(1);

        function fakeGet(o, cb) {
          cb(null, fixtures.data.animals);
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
      });

      it('should call the #get callback with backfill', function() {
        var spy = jasmine.createSpy();

        this.bloodhound.transport.get.andCallFake(fakeGetWithCacheMiss);
        this.bloodhound.get('dog', $.noop, spy);

        expect(spy.callCount).toBe(1);

        function fakeGetWithCacheMiss(o, cb) {
          cb(null, fixtures.data.animals);
        }
      });
    });

    it('should treat failures as empty suggestion sets', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        remote: '/test?q=%QUERY'
      });
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('dog', $.noop, spy);

      expect(spy).toHaveBeenCalledWith([]);

      function fakeGet(o, cb) { cb(true); }
    });
  });

  describe('local/prefetch/remote integration', function() {
    it('duplicates should be removed if dupDetector is provided', function() {
      var syncSpy, asyncSpy;

      syncSpy = jasmine.createSpy();
      asyncSpy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        dupDetector: function(d1, d2) { return d1.value === d2.value; },
        local: fixtures.data.animals,
        remote: { url: '/test?q=%QUERY' }
      });
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('dog', syncSpy, asyncSpy);
      expect(asyncSpy).toHaveBeenCalledWith([{ value: 'cat' }, { value: 'moose' }]);

      function fakeGet(o, cb) { cb(null, fixtures.data.animals); }
    });

    it('remote should backfill local/prefetch', function() {
      var syncSpy, asyncSpy;

      syncSpy = jasmine.createSpy();
      asyncSpy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        datumTokenizer: datumTokenizer,
        queryTokenizer: queryTokenizer,
        local: fixtures.data.simple,
        remote: { url: '/test?q=%QUERY', sufficient: 3 }
      });
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('big', syncSpy, asyncSpy);

      expect(syncSpy).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
      expect(asyncSpy).not.toHaveBeenCalled();

      this.bloodhound.get('bigg', syncSpy, asyncSpy);

      expect(syncSpy).toHaveBeenCalledWith([
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
      expect(asyncSpy).toHaveBeenCalledWith(fixtures.data.animals);

      function fakeGet(o, cb) { cb(null, fixtures.data.animals); }
    });
  });

  // helper functions
  // ----------------

  function datumTokenizer(d) { return $.trim(d.value).split(/\s+/); }
  function queryTokenizer(s) { return $.trim(s).split(/\s+/); }
});
