(function() {
  var _RequestCache, _PersistentStorage, _Transport;

  $.extend(jasmine, {
    RequestCache: {
      useMock: function() {
        var spec = jasmine.getEnv().currentSpec;

        spec.after(jasmine.RequestCache.uninstallMock);
        jasmine.RequestCache.installMock();
      },

      installMock: function() {
        _RequestCache = RequestCache;
        RequestCache = MockRequestCache;
      },

      uninstallMock: function() {
        RequestCache = _RequestCache;
      }
    },

    PersistentStorage: {
      useMock: function() {
        var spec = jasmine.getEnv().currentSpec;

        spec.after(jasmine.PersistentStorage.uninstallMock);
        jasmine.PersistentStorage.installMock();
      },

      installMock: function() {
        _PersistentStorage = PersistentStorage;
        PersistentStorage = jasmine.createSpy().andReturn({
          get: jasmine.createSpy(),
          set: jasmine.createSpy(),
          remove: jasmine.createSpy(),
          clear: jasmine.createSpy(),
          isExpired: jasmine.createSpy()
        });
      },

      uninstallMock: function() {
        PersistentStorage = _PersistentStorage;
      }
    },

    Transport: {
      useMock: function() {
        var spec = jasmine.getEnv().currentSpec;

        spec.after(jasmine.Transport.uninstallMock);
        jasmine.Transport.installMock();
      },

      installMock: function() {
        _Transport = Transport;
        Transport = jasmine.createSpy().andReturn({
          get: jasmine.createSpy()
        });
      },

      uninstallMock: function() {
        Transport = _Transport;
      }
    }
  });

  function MockRequestCache() {
    this.get = $.noop;
    this.set = $.noop;
    MockRequestCache.instance = this;
  }
})();
