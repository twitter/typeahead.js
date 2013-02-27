(function() {
  var _RequestCache;

  jasmine.RequestCache = {
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
  };

  function MockRequestCache() {
    this.get = $.noop;
    this.set = $.noop;
    MockRequestCache.instance = this;
  }
})();
