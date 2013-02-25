describe('Dataset', function() {
  var fixtureData = ['grape', 'coconut', 'cake', 'tea', 'coffee'],
      expectedAdjacencyList = {
        g: ['grape'],
        c: ['coconut', 'cake', 'coffee'],
        t: ['tea']
      },
      expectedItemHash = {
        grape: { tokens: ['grape'], value: 'grape' },
        coconut: { tokens: ['coconut'], value: 'coconut' },
        cake: { tokens: ['cake'], value: 'cake' },
        tea: { tokens: ['tea'], value: 'tea' },
        coffee: { tokens: ['coffee'], value: 'coffee' }
      },
      prefetchResp = {
        status: 200,
        responseText: JSON.stringify(fixtureData)
      },
      mockStorageFns = {
        getMiss: function() {
          return null;
        },
        getMissGenerator: function(key) {
          var regex = new RegExp(key);

          return function(k) {
            return regex.test(k) ?
              mockStorageFns.getMiss(key) : mockStorageFns.getHit(key);
          };
        },
        getHit: function(key) {
          if (/itemHash/.test(key)) {
            return expectedItemHash;
          }

          else if (/adjacencyList/.test(key)) {
            return expectedAdjacencyList;
          }

          else if (/version/.test(key)) {
            return VERSION;
          }

          else if (/protocol/.test(key)) {
            return utils.getProtocol();
          }
        }
      };

  beforeEach(function() {
    localStorage.clear();

    jasmine.Ajax.useMock();
    clearAjaxRequests();

    spyOn(utils, 'getUniqueId').andCallFake(function(name) { return name; });
  });

  describe('when initialized', function() {
    describe('with local data', function () {
      beforeEach(function() {
        this.dataset = new Dataset({ name: 'local', local: fixtureData });
      });

      it('should process local data', function() {
        expect(this.dataset.itemHash).toEqual(expectedItemHash);
        expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
      });
    });

    describe('with prefetch data', function () {
      describe('if available in storage', function() {
        beforeEach(function() {
          spyOn(PersistentStorage.prototype, 'get')
          .andCallFake(mockStorageFns.getHit);

          this.dataset = new Dataset({
            name: 'prefetch',
            prefetch: '/prefetch.json'
          });
        });

        it('should not make ajax request', function() {
          expect(mostRecentAjaxRequest()).toBeNull();
        });

        it('should use data from storage', function() {
          expect(this.dataset.itemHash).toEqual(expectedItemHash);
          expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
        });
      });

      ['itemHash', 'adjacencyList', 'version', 'protocol']
      .forEach(function(key) {
        describe('if ' + key + ' is stale or missing in storage', function() {
          beforeEach(function() {
            spyOn(PersistentStorage.prototype, 'get')
            .andCallFake(mockStorageFns.getMissGenerator(key));

            this.dataset = new Dataset({
              name: 'prefetch',
              prefetch: '/prefetch.json'
            });

            this.request = mostRecentAjaxRequest();
            this.request.response(prefetchResp);
          });

          it('should make ajax request', function() {
            expect(this.request).not.toBeNull();
          });

          it('should process fetched data', function() {
            expect(this.dataset.itemHash).toEqual(expectedItemHash);
            expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
          });
        });
      });
    });
  });

  describe('Datasource options', function() {
    beforeEach(function() {
      spyOn(PersistentStorage.prototype, 'get')
      .andCallFake(mockStorageFns.getHit);

      this.dataset = new Dataset({
        name: 'prefetch',
        prefetch: '/prefetch.json'
      });
    });

    it('allow for a custom matching function to be defined', function() {
      this.dataset._customMatcher = function(item) { return item; };

      this.dataset.getSuggestions('ca', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });
    });

    it('allow for a custom ranking function to be defined', function() {
      this.dataset._customRanker = function(a, b) {
        return a.value.length > b.value.length ?
          1 : a.value.length === b.value.length ? 0 : -1;
      };

      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' },
          { tokens: ['coconut'], value: 'coconut' }
        ]);
      });
    });
  });

  describe('Matching, ranking, combining, returning results', function() {
    beforeEach(function() {
      spyOn(PersistentStorage.prototype, 'get')
      .andCallFake(mockStorageFns.getHit);

      this.dataset = new Dataset({
        name: 'prefetch',
        prefetch: '/prefetch.json'
      });
    });

    it('network requests are not triggered with enough local results', function() {
      this.dataset.queryUrl = '/remote?q=%QUERY';
      this.dataset.transport = new Transport({debounce:utils.debounce});
      spyOn(this.dataset.transport, 'get');

      this.dataset.limit = 1;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });

      expect(this.dataset.transport.get.callCount).toBe(0);

      this.dataset.limit = 100;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });

      expect(this.dataset.transport.get.callCount).toBe(1);
    });

    it('matches', function() {
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });
    });

    it('does not match', function() {
      this.dataset.getSuggestions('q', function(items) {
         expect(items).toEqual([]);
      });
    });

    it('does not match multiterm queries', function() {
      this.dataset.getSuggestions('coff ca', function(items) {
         expect(items).toEqual([]);
      });
    });

    it('concatenates local and remote results and dedups them', function() {
      var local = [expectedItemHash.cake, expectedItemHash.coffee],
          remote = [expectedItemHash.coconut, expectedItemHash.cake];

      this.dataset._processRemoteSuggestions(function(items) {
        expect(items).toEqual([
          expectedItemHash.cake,
          expectedItemHash.coffee,
          expectedItemHash.coconut
        ]);
      }, local)(remote);
    });

    it('sorts results: local first, then remote, sorted by graph weight / score within each local/remote section', function() {
      expect([
        { id: 1, weight: 1000, score: 0 },
        { id: 2, weight: 500, score: 0 },
        { id: 3, weight: 1500, score: 0 },
        { id: 4, weight: 0, score: 100000 },
        { id: 5, weight: 0, score: 250000 }
      ].sort(this.dataset._ranker)).toEqual([
        { id: 3, weight: 1500, score: 0 },
        { id: 1, weight: 1000, score: 0 },
        { id: 2, weight: 500, score: 0 },
        { id: 5, weight: 0, score: 250000 },
        { id: 4, weight: 0, score: 100000 }
      ]);
    });

    it('only returns unique ids when looking up potentially matching ids', function() {
      this.dataset.adjacencyList = {
        a: [1, 2, 3, 4],
        b: [3, 4, 5, 6]
      };
      expect(this.dataset._getPotentiallyMatchingIds(['a','b'])).toEqual([3, 4]);
    });

  });

  describe('tokenization', function() {
    describe('with datum strings', function() {
      var fixtureData = ['course-106', 'user_name', 'One-Two', 'two three'];

      beforeEach(function() {
        this.dataset = new Dataset({ name: 'local', local: fixtureData });
      });

      it('normalizes capitalization to match items', function() {
        this.dataset.getSuggestions('Cours', function(items) {
          expect(items)
          .toEqual([{ tokens: ['course', '106'], value: 'course-106' }]);
        });
        this.dataset.getSuggestions('cOuRsE 106', function(items) {
          expect(items)
          .toEqual([{ tokens: ['course', '106'], value: 'course-106' }]);
        });
        this.dataset.getSuggestions('one two', function(items) {
          expect(items)
          .toEqual([{ tokens: ['one', 'two'], value: 'One-Two' }]);
        });
        this.dataset.getSuggestions('THREE TWO', function(items) {
          expect(items)
          .toEqual([{ tokens: ['two', 'three'], value: 'two three' }]);
        });
      });

      it('matches items with dashes', function() {
        this.dataset.getSuggestions('106 course', function(items) {
          expect(items)
          .toEqual([{ tokens: ['course', '106'], value: 'course-106' }]);
        });
        this.dataset.getSuggestions('course-106', function(items) {
          expect(items).toEqual([]);
        });
      });

      it('matches items with underscores', function() {
        this.dataset.getSuggestions('user name', function(items) {
          expect(items)
          .toEqual([{ tokens: ['user', 'name'], value: 'user_name' }]);
        });
      });
    });
  });

  describe('with datum objects', function() {
    var fixtureData = [{ value: 'course-106', tokens: ['course-106'] }];

    beforeEach(function() {
      this.dataset = new Dataset({ name: 'local', local: fixtureData });
    });

    it('matches items with dashes', function() {
      this.dataset.getSuggestions('106 course', function(items) {
        expect(items).toEqual([]);
      });

      this.dataset.getSuggestions('course-106', function(items) {
        expect(items)
        .toEqual([{ value: 'course-106', tokens: ['course-106'] }]);
      });
    });
  });
});
