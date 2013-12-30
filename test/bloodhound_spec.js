describe('Bloodhound', function() {

  beforeEach(function() {
    jasmine.Ajax.useMock();
    jasmine.Transport.useMock();
    jasmine.PersistentStorage.useMock();
  });

  afterEach(function() {
    clearAjaxRequests();
  });

  describe('local', function() {
    beforeEach(function() {
      this.bloodhound = new Bloodhound({ local: fixtures.data.simple });
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

  describe('prefetch', function() {
    it('should throw error if url is not set', function() {
      expect(test).toThrow();

      function test() { var d = new Bloodhound({ prefetch: {} }); }
    });

    it('should use url or cacheKey to store data locally', function() {
      var ttl = 100;

      this.bloodhound1 = new Bloodhound({
        prefetch: { url: '/test1', cacheKey: 'woah' }
      });
      expect(PersistentStorage).toHaveBeenCalledWith('woah');

      this.bloodhound2 = new Bloodhound({
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

      this.bloodhound1 = new Bloodhound({ prefetch: '/test1' });
      this.bloodhound2 = new Bloodhound({ prefetch: { url: '/test2' } });
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

    it('should filter data if filter is provided', function() {
      var filterSpy, spy;

      filterSpy = jasmine.createSpy().andCallFake(fakeFilter);
      spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
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
        return ['BIG', 'BIGGER', 'BIGGEST'];
      }
    });

    it('should not make a request if data is available in storage', function() {
      var that = this, spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({ name: 'name', prefetch: '/test' });
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
        remote: { url: '/test?q=$$', wildcard: '$$' }
      });
      this.bloodhound2 = new Bloodhound({
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
        { method: 'get', dataType: 'json' },
        jasmine.any(Function)
      );

      expect(this.bloodhound2.transport.get).toHaveBeenCalledWith(
        '/test?q=one two',
        { method: 'get', dataType: 'json' },
        jasmine.any(Function)
      );
    });

    it('should filter the response if a filter is provided', function() {
      var filterSpy, spy;

      spy = jasmine.createSpy();
      filterSpy = jasmine.createSpy().andCallFake(fakeFilter);

      this.bloodhound = new Bloodhound({
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
        return ['BIG', 'BIGGER', 'BIGGEST'];
      }

      function fakeGet(url, o, cb) {
        cb(fixtures.data.simple);
      }
    });

    it('should call #get callback once if cache hit', function() {
      var spy = jasmine.createSpy();

      this.bloodhound = new Bloodhound({ remote: '/test?q=%QUERY' });
      this.bloodhound.initialize();
      this.bloodhound.transport.get.andCallFake(fakeGet);

      this.bloodhound.get('dog', spy);

      expect(spy.callCount).toBe(1);

      function fakeGet(url, o, cb) {
        cb(fixtures.data.animals);
        return true;
      }
    });
  });

  describe('local/prefetch/remote integration', function() {
    it('remote should backfill local/prefetch', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy();
      spy2 = jasmine.createSpy();

      this.bloodhound = new Bloodhound({
        limit: 3,
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
        setTimeout(function() {
          cb(fixtures.data.animals);
        }, 0);
      }
    });
  });
});
