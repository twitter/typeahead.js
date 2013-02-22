describe("Dataset", function() {
  var fixtureData = ["grape", "coconut", "cake", "tea", "coffee"];
  var expectedAdjacencyList = { g : [ "grape" ], c : [ "coconut", "cake", "coffee" ], t : [ "tea" ] };

  var expectedItemHash = {
    grape : { tokens : [ "grape" ], value : "grape", id : "grape" },
    coconut : { tokens : [ "coconut" ], value : "coconut", id : "coconut" },
    cake : { tokens : [ "cake" ], value : "cake", id : "cake" },
    tea : { tokens : [ "tea" ], value : "tea", id : "tea" },
    coffee : { tokens : [ "coffee" ], value : "coffee", id : "coffee" }
  };

  var dataset;
  beforeEach(function() {
    setFixtures(fixtureData);
    localStorage.clear();
    spyOn(window, "Date").andReturn({ getTime: function() { return 1; } });
    spyOn($, "ajax").andCallFake(function (options) {
      options.success(["grape", "coconut", "cake", "tea", "coffee"]);
    });
    spyOn(utils, "getUniqueId").andCallFake(function(name) {
      return name;
    });
    dataset = new Dataset({
          name: "words",
          local: null,
          prefetch: "http://localhost",
          remotePreprocessor: function (data) {
            // custom user code
            return data;
          },
          remote: null
        });
    jasmine.Clock.useMock();
  });

  it("prefetches data from the API", function() {
    expect($.ajax).toHaveBeenCalled();
    expect(dataset.itemHash).toEqual(expectedItemHash);
    expect(dataset.adjacencyList).toEqual(expectedAdjacencyList);
  });

  it("loads data from local storage", function() {
    expect($.ajax).toHaveBeenCalled();
    expect($.ajax.callCount).toBe(1);
    dataset._loadData();
    expect($.ajax.callCount).toBe(1);
    expect(dataset.itemHash).toEqual(expectedItemHash);
  });

  it("versioning prefetches data when the localStorage version is out of date", function() {
    expect($.ajax).toHaveBeenCalled();
    expect($.ajax.callCount).toBe(1);
    dataset._loadData();
    expect($.ajax.callCount).toBe(1);
    dataset.storageVersion = -1;
    dataset._loadData();
    expect($.ajax.callCount).toBe(2);
  });

  it("reloads data after switching versions", function() {
    expect($.ajax.callCount).toBe(1);

    dataset._loadData();
    expect($.ajax.callCount).toBe(1);

    VERSION = "-0.0.0";
    dataset._loadData();
    expect($.ajax.callCount).toBe(2);
  });

  it("reloads data after switching protocols", function() {
    dataset.resetDataOnProtocolSwitch = true;
    spyOn(utils, "getProtocol").andReturn("https:");
    expect($.ajax.callCount).toBe(1);
    utils.getProtocol.andReturn("http:");

    dataset._loadData();
    expect($.ajax.callCount).toBe(2);
    expect(dataset.adjacencyList).toEqual(expectedAdjacencyList);
    expect(dataset.itemHash).toEqual(expectedItemHash);
  });

  describe("prefetch", function() {
    describe("prefetch fails and stale data loaded from localstorage", function() {
      it("loads data from local storage if ajax call fails", function() {
        expect($.ajax).toHaveBeenCalled();
        expect($.ajax.callCount).toBe(1);
        dataset.itemHash = {};
        expect(dataset.itemHash).toEqual({});
        dataset.storageVersion = -1;
        dataset._loadData();
        expect($.ajax.callCount).toBe(2);
        expect(dataset.itemHash).toEqual(expectedItemHash);
      });
    });

    it("does not prefetch if the cache is current", function() {
      window.Date.andReturn({ getTime: function() { return 10; } });
      expect($.ajax).toHaveBeenCalled();
      dataset._loadData();
      expect($.ajax.callCount).toBe(1);
    });

    it("prefetches if the cache is old", function() {
      expect($.ajax).toHaveBeenCalled();
      window.Date.andReturn({ getTime: function() { return 1000000000; } });
      dataset._loadData();
      expect($.ajax.callCount).toBe(2);
    });

    it("does not prefetch data from the API if the browser is not fully supported", function() {
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.callCount).toBe(1);
      dataset._loadData();
      expect($.ajax.callCount).toBe(1);
    });

  });

  describe("Datasource options", function() {
    it("allow for a custom matching function to be defined", function() {
      dataset._customMatcher = function(item) { //simple custom matched that returns item even if query not prefix of each token
        return item;
      };

      dataset.getSuggestions("ca", function(items) {
        expect(items).toEqual([
          { tokens : [ "coconut" ], value : "coconut", id : "coconut" },
          { tokens : [ "cake" ], value : "cake", id : "cake" },
          { tokens : [ "coffee" ], value : "coffee", id : "coffee" }
        ]);
      });
    });

    it("allow for a custom ranking function to be defined", function() {
      dataset._customRanker = function(a, b) { //simple custom ranker that returns items in order of string length ascending
        return a.value.length > b.value.length ? 1 : a.value.length === b.value.length ? 0 : -1;
      };

      dataset.getSuggestions("c", function(items) {
        expect(items).toEqual([
          { tokens : [ "cake" ], value : "cake", id : "cake" },
          { tokens : [ "coffee" ], value : "coffee", id : "coffee" },
          { tokens : [ "coconut" ], value : "coconut", id : "coconut" }
        ]);
      });
    });

    it("allow for a custom prefetch TTL to be defined", function() {
      window.Date.andReturn({ getTime: function() { return 0; } });
      dataset._ttl_ms = 100;
      dataset._processRawData(["grape", "coconut", "cake", "tea", "coffee"]);
      dataset._loadData();
      expect($.ajax.callCount).toBe(1);
      window.Date.andReturn({ getTime: function() { return 99; } });
      dataset._loadData();
      expect($.ajax.callCount).toBe(1);
      window.Date.andReturn({ getTime: function() { return 101; } });
      dataset._loadData();
      expect($.ajax.callCount).toBe(2);
    });
  });

  describe("Matching, ranking, combining, returning results", function() {

    it("network requests are not triggered with enough local results", function() {
      dataset.transport = new Transport({debounce:utils.debounce});
      dataset.limit = 1;
      dataset.queryUrl = "http://www.hello-word.com.json";
      spyOn(dataset.transport, "get");
      dataset.getSuggestions("c", function(items) {
        expect(items).toEqual([
          { tokens : [ "coconut" ], value : "coconut", id : "coconut" },
          { tokens : [ "cake" ], value : "cake", id : "cake" },
          { tokens : [ "coffee" ], value : "coffee", id : "coffee" }
        ]);
      });
      expect(dataset.transport.get.callCount).toBe(0);
      dataset.limit = 100;
      dataset.getSuggestions("c", function(items) {
        expect(items).toEqual([
          { tokens : [ "coconut" ], value : "coconut", id : "coconut" },
          { tokens : [ "cake" ], value : "cake", id : "cake" },
          { tokens : [ "coffee" ], value : "coffee", id : "coffee" }
        ]);
      });
      expect(dataset.transport.get.callCount).toBe(1);
    });

    it("matches", function() {
      dataset.getSuggestions("c", function(items) {
        expect(items).toEqual([
          { tokens : [ "coconut" ], value : "coconut", id : "coconut" },
          { tokens : [ "cake" ], value : "cake", id : "cake" },
          { tokens : [ "coffee" ], value : "coffee", id : "coffee" }
        ]);
      });
    });

    it("does not match", function() {
      dataset.getSuggestions("q", function(items) {
         expect(items).toEqual([]);
      });
    });

    it("does not match multiterm queries", function() {
      dataset.getSuggestions("coff ca", function(items) {
         expect(items).toEqual([]);
      });
    });

    it("concatenates local and remote results and dedups them", function() {
      var localSuggestions = [expectedItemHash.cake, expectedItemHash.coffee];
      var remoteSuggestions = [expectedItemHash.coconut, expectedItemHash.cake]; // not actually used, does not work, no remote request triggered, this is already in the local storage
      var func = dataset._processRemoteSuggestions(function(items) {
        expect(items).toEqual([expectedItemHash.coconut, expectedItemHash.cake, expectedItemHash.coffee]);
      }, localSuggestions);
      func(remoteSuggestions);
    });

    it("calls the custom preprocessor function for remote data", function () {

      var unprocessedData = {response: [expectedItemHash.coconut, expectedItemHash.cake]};
      var processedData = [expectedItemHash.coconut, expectedItemHash.cake, expectedItemHash.coffee];

      spyOn(dataset,"remotePreprocessor").andCallFake(function (data) {
        expect(data).toEqual(unprocessedData);
        return data.response;
      });
      
      var localSuggestions = [expectedItemHash.cake, expectedItemHash.coffee];
      
      var func = dataset._processRemoteSuggestions(function(items) {
        expect(items).toEqual(processedData);
      }, localSuggestions);
      func(unprocessedData);
      
    });

    it("sorts results: local first, then remote, sorted by graph weight / score within each local/remote section", function() {
      expect([
        { id: 1, weight: 1000, score: 0 },
        { id: 2, weight: 500, score: 0 },
        { id: 3, weight: 1500, score: 0 },
        { id: 4, weight: 0, score: 100000 },
        { id: 5, weight: 0, score: 250000 }
      ].sort(dataset._ranker)).toEqual([
        { id : 3, weight : 1500, score : 0 },
        { id : 1, weight : 1000, score : 0 },
        { id : 2, weight : 500, score : 0 },
        { id : 5, weight : 0, score : 250000 },
        { id : 4, weight : 0, score : 100000 }
      ]);
    });

    it("only returns unique ids when looking up potentially matching ids", function() {
      dataset.adjacencyList = {
        a: [1, 2, 3, 4],
        b: [3, 4, 5, 6]
      };
      expect(dataset._getPotentiallyMatchingIds(["a","b"])).toEqual([3, 4]);
    });

  });

});
