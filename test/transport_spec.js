describe('Transport', function() {
  var successResp = { prop: 'val' },
      ajaxMocks = {
        timeout: function(o) {
          o.beforeSend && o.beforeSend();
        },
        success: function(o) {
          o.beforeSend && o.beforeSend();

          setTimeout(function() {
            o.success && o.success(successResp);
            o.complete && o.complete();
          }, 50);
        },
        error: function(o) {
          o.beforeSend && o.beforeSend();

          setTimeout(function() {
            o.error && o.error();
            o.complete && o.complete();
          }, 50);
        }
      },
      _debounce;

  beforeEach(function() {
    spyOn($, 'ajax');

    _debounce = utils.debounce;
    utils.debounce = function(fn) { return fn; };

    this.transport = new Transport({
      wildcard: '%QUERY',
      debounce: true,
      maxConcurrentRequests: 3
    });
  });

  afterEach(function() {
    utils.debounce = _debounce;
  });

  describe('#get', function() {
    describe('when request is available in cache', function() {
      beforeEach(function() {
        spyOn(this.transport.cache, 'get').andReturn(successResp);
      });

      it('should not call $.ajax', function() {
        this.transport.get('http://example.com', 'query');

        expect($.ajax).not.toHaveBeenCalled();
      });

      it('should invoke callback with response from cache', function() {
        var spy = jasmine.createSpy();

        this.transport.get('http://example.com', 'query', spy);

        waitsFor(function() { return spy.callCount; });
        runs(function() { expect(spy).toHaveBeenCalledWith(successResp); });
      });
    });

    describe('when below concurrent request threshold', function() {
      beforeEach(function() {
        $.ajax.andCallFake(ajaxMocks.timeout);
      });

      it('should make remote request', function() {
        this.transport.get('http://example.com', 'query');

        waitsFor(function() { return $.ajax.callCount === 1; });
      });

      it('should replace wildcard in url with encoded query', function() {
        var args;

        this.transport.get('http://example.com?q=%QUERY', 'has space');
        args = $.ajax.mostRecentCall.args;

        expect(args[0].url).toEqual('http://example.com?q=has%20space');
      });

      it('should increment the concurrent request count', function() {
        this.transport.get('http://example.com', 'query');

        expect(this.transport.concurrentRequests).toEqual(1);
      });
    });

    describe('when at concurrent request threshold', function() {
      beforeEach(function() {
        $.ajax.andCallFake(ajaxMocks.timeout);
        this.transport.concurrentRequests =
          this.transport.maxConcurrentRequests + 1;
      });

      it('should not call $.ajax', function() {
        this.transport.get('http://example.com', 'query');

        expect($.ajax).not.toHaveBeenCalled();
      });

      it('should set args for the on-deck request', function() {
        var cb = function() {};

        this.transport.get('http://example.com', 'query', cb);

        expect(this.transport.onDeckRequestArgs)
        .toEqual(['http://example.com', 'query', cb]);
      });
    });

    describe('when request succeeds', function() {
      beforeEach(function() {
        $.ajax.andCallFake(ajaxMocks.success);
      });

      it('should invoke callback with json response', function() {
        var spy = jasmine.createSpy();

        this.transport.get('http://example.com', 'query', spy);

        waitsFor(function() { return spy.callCount; });
        runs(function() { expect(spy).toHaveBeenCalledWith(successResp); });
      });

      it('should decrement the request count', function() {
        this.transport.get('http://example.com', 'query');

        expect(this.transport.concurrentRequests).toEqual(1);
        waitsFor(function() {
          return this.transport.concurrentRequests === 0;
        });
      });

      it('should add response to the cache', function() {
        spyOn(this.transport.cache, 'set');

        this.transport.get('http://example.com', 'query');

        waitsFor(function() {
          return this.transport.cache.set.callCount;
        });

        runs(function() {
          expect(this.transport.cache.set)
          .toHaveBeenCalledWith('http://example.com', successResp);
        });
      });
    });

    describe('when request fails', function() {
      beforeEach(function() {
        $.ajax.andCallFake(ajaxMocks.error);
      });

      it('should decrement the request count', function() {
        this.transport.get('http://example.com', 'query');

        expect(this.transport.concurrentRequests).toEqual(1);
        waitsFor(function() {
          return this.transport.concurrentRequests === 0;
        });
      });
    });

    describe('when request count drops below threshold', function() {
      beforeEach(function() {
        $.ajax.andCallFake(ajaxMocks.success);
      });

      it('should call #get with on-deck request args', function() {
        var spy = jasmine.createSpy(),
            i = this.transport.maxConcurrentRequests;

        while(i--) { this.transport.get('http://example.com', 'query', spy); }

        // above the threshold, should be delayed
        this.transport.get('http://example.com', 'query', spy);

        spyOn(this.transport, 'get');

        waitsFor(function() {
          return spy.callCount === this.transport.maxConcurrentRequests &&
            this.transport.get.callCount === 1;
        });

        runs(function() {
          expect(this.transport.get)
          .toHaveBeenCalledWith('http://example.com', 'query', spy);
        });

      });
    });
  });
});
