describe('Transport', function() {
  var successData = { prop: 'val' },
      successResp = { status: 200, responseText: JSON.stringify(successData) },
      errorResp = { status: 500 },
      _debounce;

  beforeEach(function() {
    jasmine.Ajax.useMock();
    jasmine.RequestCache.useMock();

    _debounce = utils.debounce;
    utils.debounce = function(fn) { return fn; };

    this.transport = new Transport({
      url: 'http://example.com?q=$$',
      wildcard: '$$',
      debounce: true,
      maxParallelRequests: 3
    });

    // request cache is hidden in transport's closure
    // so this is how we access it to spy on its methods
    this.requestCache = RequestCache.instance;
    spyOn(this.requestCache, 'get');
    spyOn(this.requestCache, 'set');
  });

  afterEach(function() {
    utils.debounce = _debounce;

    // run twice to flush out  on-deck requests
    for (var i = 0; i < 2; i ++) {
      ajaxRequests.forEach(respond);
    }

    clearAjaxRequests();

    function respond(req) { req.response(successResp); }
  });

  // public methods
  // --------------

  describe('#get', function() {
    describe('when request is available in cache', function() {
      beforeEach(function() {
        this.spy = jasmine.createSpy();
        this.requestCache.get.andReturn({ data: ['val'] });

        this.transport.filter = jasmine.createSpy().andReturn(['val']);
        this.transport.get('query', this.spy);
        this.request = mostRecentAjaxRequest();
      });

      it('should not call $.ajax', function() {
        expect(this.request).toBeNull();
      });

      it('should call filter', function() {
        waitsFor(function() {
          return this.transport.filter.callCount === 1;
        });
      });

      it('should invoke callback with data', function() {
        waitsFor(function() { return this.spy.callCount === 1; });

        runs(function() {
          expect(this.spy).toHaveBeenCalledWith(['val']);
        });
      });
    });

    describe('when below pending requests threshold', function() {
      it('should make remote request', function() {
        this.transport.get('has space');
        this.request = mostRecentAjaxRequest();

        expect(this.request).not.toBeNull();
      });

      it('should replace wildcard in url with encoded query', function() {
        this.transport.get('has space');
        this.request = mostRecentAjaxRequest();

        expect(this.request.url).toEqual('http://example.com?q=has%20space');

        this.transport.replace = function(url, query) { return url + query; };
        this.transport.get('has space');
        this.request = mostRecentAjaxRequest();

        expect(this.request.url).toEqual('http://example.com?q=$$has%20space');
      });

      it('should piggyback off of pending requests', function() {
        this.spy1 = jasmine.createSpy();
        this.spy2 = jasmine.createSpy();
        this.transport2 = new Transport({ url: 'http://example.com?q=%QUERY' });

        this.transport.get('hazel', this.spy1);
        this.transport2.get('hazel', this.spy2);

        this.request = mostRecentAjaxRequest();
        this.request.response(successResp);

        expect(ajaxRequests.length).toBe(1);
        expect(this.spy1).toHaveBeenCalledWith(successData);
        expect(this.spy2).toHaveBeenCalledWith(successData);
      });
    });

    describe('when at concurrent request threshold', function() {
      beforeEach(function() {
        this.goodRequests = [];

        for (var i = 0; i < 3; i++) {
          this.transport.get('good' + i);
          this.goodRequests.push(mostRecentAjaxRequest());
        }

        this.transport.get('bad', $.noop);
      });

      it('should not call $.ajax', function() {
        expect(ajaxRequests.length).toBe(3);
      });

      it('should set args for the on-deck request', function() {
        expect(this.transport.onDeckRequestArgs)
        .toEqual(['http://example.com?q=bad', $.noop]);
      });
    });

    describe('when request succeeds', function() {
      beforeEach(function() {
        this.spy = jasmine.createSpy();

        this.transport.filter = jasmine.createSpy().andReturn({ prop: 'val' });

        this.transport.get('has space', this.spy);
        this.request = mostRecentAjaxRequest();
        this.request.response(successResp);
      });

      it('should invoke callback with json response', function() {
        var spy = jasmine.createSpy();

        expect(this.spy).toHaveBeenCalledWith(successData);
      });

      it('should add response to the cache', function() {
        expect(this.requestCache.set)
        .toHaveBeenCalledWith('http://example.com?q=has%20space', successData);
      });

      it('should call filter', function() {
        expect(this.transport.filter).toHaveBeenCalledWith(successData);
      });
    });

    describe('when request fails', function() {
      beforeEach(function() {
        this.spy = jasmine.createSpy();

        this.transport.get('has space', this.spy);
        this.request = mostRecentAjaxRequest();
        this.request.response(errorResp);
      });

      it('should not invoke callback', function() {
        expect(this.spy).not.toHaveBeenCalled();
      });

      it('should not add response to the cache', function() {
        expect(this.requestCache.set).not.toHaveBeenCalled();
      });
    });

    describe('when request count drops below threshold', function() {
      it('should call #get with on-deck request args', function() {
        var requests = [];

        for (var i = 0; i < 3; i++) {
          this.transport.get('good' + i);
          requests.push(mostRecentAjaxRequest());
        }

        this.transport.get('bad');

        expect(ajaxRequests.length).toBe(3);
        requests[0].response(successResp);
        expect(ajaxRequests.length).toBe(4);

        expect(mostRecentAjaxRequest().url).toBe('http://example.com?q=bad');
      });
    });
  });
});
