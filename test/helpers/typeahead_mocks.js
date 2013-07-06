(function(root) {
  var components;

  components = [
    'Dataset',
    'PersistentStorage',
    'Transport',
    'SearchIndex'
    ];

  for (var i = 0; i < components.length; i++) {
    makeMockable(components[i]);
  }

  function makeMockable(component) {
    var Original, Mock;

    Original = root[component];
    Mock = mock(Original);

    jasmine[component] = { useMock: useMock, uninstallMock: uninstallMock };

    function useMock() {
      root[component] = Mock;
      jasmine.getEnv().currentSpec.after(uninstallMock);
    }

    function uninstallMock() {
      root[component] = Original;
    }
  }

  function mock(Constructor) {
    Mock.prototype = Constructor.prototype;

    return jasmine.createSpy('mock constructor').andCallFake(Mock);

    function Mock() {
      var instance = utils.mixin({}, Constructor.prototype);

      Constructor.apply(instance, arguments);

      for (var key in instance) {
        if (typeof instance[key] === 'function') {
          spyOn(instance, key);
        }
      }

      instance.constructor = Constructor;

      return instance;
    }
  }
})(this);
