(function(root) {
  var components;

  components = [
    'Dataset',
    'PersistentStorage',
    'Transport',
    'SearchIndex',
    'SectionView'
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
    var mockConstructor;

    Mock.prototype = Constructor.prototype;

    mockConstructor = jasmine.createSpy('mock constructor').andCallFake(Mock);

    // copy instance methods
    for (var key in Constructor) {
      if (typeof Constructor[key] === 'function') {
        mockConstructor[key] = Constructor[key];
      }
    }

    return mockConstructor;

    function Mock() {
      var instance = utils.mixin({}, Constructor.prototype);

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
