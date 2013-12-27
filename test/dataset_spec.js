describe('Dataset', function() {

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
      this.dataset = new Dataset({ local: fixtures.data.simple });
      this.dataset.initialize();
    });

    it('should hydrate the dataset', function() {
      var spy = jasmine.createSpy();

      this.dataset.get('big', spy);

      expect(spy).toHaveBeenCalledWith([
        { value: 'big' },
        { value: 'bigger' },
        { value: 'biggest' }
      ]);
    });
  });

  describe('prefetch', function() {
    it('should only cache data locally if name is set', function() {
      var ttl = 100;

      this.dataset1 = new Dataset({ prefetch: 'test2' });
      expect(PersistentStorage).not.toHaveBeenCalled();

      this.dataset2 = new Dataset({
        name: 'name',
        prefetch: { url: '/test1', ttl: ttl, thumbprint: '!' }
      });
      expect(PersistentStorage).toHaveBeenCalledWith('name');

      this.dataset2.initialize();
      ajaxRequests[0].response(fixtures.ajaxResps.ok);

      expect(this.dataset2.storage.set)
        .toHaveBeenCalledWith('data', fixtures.serialized.simple, ttl);
      expect(this.dataset2.storage.set)
        .toHaveBeenCalledWith('protocol', 'http:', ttl);
      expect(this.dataset2.storage.set)
        .toHaveBeenCalledWith('thumbprint', '%VERSION%!', ttl);
    });

    it('should load data from provided url', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy();
      spy2 = jasmine.createSpy();

      this.dataset1 = new Dataset({ prefetch: '/test1' });
      this.dataset2 = new Dataset({ prefetch: { url: '/test2' } });
      this.dataset1.initialize();
      this.dataset2.initialize();

      ajaxRequests[0].response(fixtures.ajaxResps.ok);
      ajaxRequests[1].response(fixtures.ajaxResps.ok);

      expect(ajaxRequests[0].url).toBe('/test1');
      expect(ajaxRequests[1].url).toBe('/test2');

      this.dataset1.get('big', spy1);
      this.dataset2.get('big', spy2);

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

      this.dataset = new Dataset({
        prefetch: { url: '/test', filter: filterSpy }
      });
      this.dataset.initialize();

      mostRecentAjaxRequest().response(fixtures.ajaxResps.ok);

      expect(filterSpy).toHaveBeenCalled();

      this.dataset.get('big', spy);

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

      this.dataset = new Dataset({ name: 'name', prefetch: '/test' });
      this.dataset.storage.get.andCallFake(fakeGet);
      this.dataset.initialize();

      expect(mostRecentAjaxRequest()).toBeNull();

      this.dataset.get('big', spy);

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
            val = that.dataset.prefetch.thumbprint;
            break;
        }

        return val;
      }
    });
  });

  describe('remote', function() {
    it('should perform query substitution on the provided url', function() {
      this.dataset1 = new Dataset({
        remote: { url: '/test?q=$$', wildcard: '$$' }
      });
      this.dataset2 = new Dataset({
        remote: {
          url: '/test?q=%QUERY',
          replace: function(str, query) {return str.replace('%QUERY', query);  }
        }
      });

      this.dataset1.initialize();
      this.dataset2.initialize();

      this.dataset1.get('one two', $.noop);
      this.dataset2.get('one two', $.noop);

      expect(this.dataset1.transport.get).toHaveBeenCalledWith(
        '/test?q=one%20two',
        { method: 'get', dataType: 'json' },
        jasmine.any(Function)
      );

      expect(this.dataset2.transport.get).toHaveBeenCalledWith(
        '/test?q=one two',
        { method: 'get', dataType: 'json' },
        jasmine.any(Function)
      );
    });

    it('should filter the response if a filter is provided', function() {
      var filterSpy, spy;

      spy = jasmine.createSpy();
      filterSpy = jasmine.createSpy().andCallFake(fakeFilter);

      this.dataset = new Dataset({
        remote: { url: '/test', filter: filterSpy }
      });
      this.dataset.initialize();

      this.dataset.transport.get.andCallFake(fakeGet);
      this.dataset.get('big', spy);

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

      this.dataset = new Dataset({ remote: '/test?q=%QUERY' });
      this.dataset.initialize();
      this.dataset.transport.get.andCallFake(fakeGet);

      this.dataset.get('dog', spy);

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

      this.dataset = new Dataset({
        limit: 3,
        local: fixtures.data.simple,
        remote: { url: '/test?q=%QUERY' }
      });
      this.dataset.initialize();

      this.dataset.transport.get.andCallFake(fakeGet);

      this.dataset.get('big', spy1);
      this.dataset.get('bigg', spy2);

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
