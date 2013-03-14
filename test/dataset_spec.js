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
    jasmine.Ajax.useMock();
    jasmine.PersistentStorage.useMock();
    jasmine.Transport.useMock();

    spyOn(utils, 'getUniqueId').andCallFake(function(name) { return name; });
  });

  afterEach(function() {
    clearAjaxRequests();
  });

  // public methods
  // --------------

  describe('#constructor', function() {
    it('should initialize persistent storage', function() {
      expect(new Dataset({ local: fixtureData }).storage).toBeDefined();
      expect(PersistentStorage).toHaveBeenCalled();
    });

    describe('when called with a template but no engine', function() {
      beforeEach(function() {
        this.fn = function() { var d = new Dataset({ template: 't' }); };
      });

      it('should throw an error', function() {
        expect(this.fn).toThrow();
      });
    });

    describe('when called without local, prefetch, or remote', function() {
      beforeEach(function() {
        this.fn = function() { this.dataset = new Dataset(); };
      });

      it('should throw an error', function() {
        expect(this.fn).toThrow();
      });
    });

    describe('when called with no template', function() {
      beforeEach(function() {
        this.dataset = new Dataset({ local: fixtureData });
      });

      it('should compile default template', function() {
        expect(this.dataset.template.render({ value: 'boo' }))
        .toBe('<div class="tt-suggestion"><p>boo</p></div>');
      });
    });

    describe('when called with a template and engine', function() {
      beforeEach(function() {
        this.dataset = new Dataset({
          local: fixtureData,
          template: 't',
          engine: { compile: this.spy = jasmine.createSpy().andReturn('boo') }
        });
      });

      it('should compile the template', function() {
        expect(this.spy)
        .toHaveBeenCalledWith('<div class="tt-suggestion">t</div>');

        expect(this.dataset.template).toBe('boo');
      });
    });
  });

  describe('#initialize', function() {
    it('should return Deferred instance', function() {
      var returnVal;

      this.dataset = new Dataset({ local: fixtureData });
      returnVal = this.dataset.initialize();

      // eh, have to rely on duck typing unfortunately
      expect(returnVal.fail).toBeDefined();
      expect(returnVal.done).toBeDefined();
      expect(returnVal.always).toBeDefined();
    });

    describe('when called with local', function() {
      beforeEach(function() {
        this.dataset = new Dataset({ local: fixtureData });
        this.dataset.initialize();
      });

      it('should process and merge the data', function() {
        expect(this.dataset.itemHash).toEqual(expectedItemHash);
        expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
      });
    });

    describe('when called with prefetch', function() {
      describe('if data is available in storage', function() {
        beforeEach(function() {
          this.dataset = new Dataset({ prefetch: '/prefetch.json' });
          this.dataset.storage.get.andCallFake(mockStorageFns.getHit);
          this.dataset.initialize();
        });

        it('should not make ajax request', function() {
          expect(mostRecentAjaxRequest()).toBeNull();
        });

        it('should use data from storage', function() {
          expect(this.dataset.itemHash).toEqual(expectedItemHash);
          expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
        });
      });

      describe('if data is not available in storage', function() {
        // default ttl
        var ttl = 24 * 60 * 60 * 1000;

        describe('if filter was passed in', function() {
          var filteredAdjacencyList = { f: ['filter'] },
              filteredItemHash = {
                filter: { tokens: ['filter'], value: 'filter' }
              };

          beforeEach(function() {
            this.dataset = new Dataset({
              prefetch: {
                url: '/prefetch.json',
                filter: function(data) { return ['filter']; }
              }
            });

            this.dataset.storage.get.andCallFake(mockStorageFns.getMiss);
            this.dataset.initialize();

            this.request = mostRecentAjaxRequest();
            this.request.response(prefetchResp);
          });

          it('should make ajax request', function() {
            expect(this.request).not.toBeNull();
          });

          it('should process and merge filtered data', function() {
            expect(this.dataset.adjacencyList).toEqual(filteredAdjacencyList);
            expect(this.dataset.itemHash).toEqual(filteredItemHash);
          });

          it('should store processed data in storage', function() {
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('itemHash', filteredItemHash, ttl);
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('adjacencyList', filteredAdjacencyList, ttl);
          });

          it('should store metadata in storage', function() {
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('protocol', utils.getProtocol(), ttl);
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('version', VERSION, ttl);
          });
        });

        describe('if filter was not passed in', function() {
          beforeEach(function() {
            this.dataset = new Dataset({ prefetch: '/prefetch.json' });

            this.dataset.storage.get.andCallFake(mockStorageFns.getMiss);

            this.dataset.initialize();

            this.request = mostRecentAjaxRequest();
            this.request.response(prefetchResp);
          });

          it('should make ajax request', function() {
            expect(this.request).not.toBeNull();
          });

          it('should process and merge fetched data', function() {
            expect(this.dataset.itemHash).toEqual(expectedItemHash);
            expect(this.dataset.adjacencyList).toEqual(expectedAdjacencyList);
          });

          it('should store processed data in storage', function() {
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('itemHash', expectedItemHash, ttl);
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('adjacencyList', expectedAdjacencyList, ttl);
          });

          it('should store metadata in storage', function() {
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('protocol', utils.getProtocol(), ttl);
            expect(this.dataset.storage.set)
            .toHaveBeenCalledWith('version', VERSION, ttl);
          });
        });
      });
    });

    describe('when called with remote', function() {
      beforeEach(function() {
        this.dataset = new Dataset({ remote: '/remote' });
        this.dataset.initialize();
      });

      it('should initialize the transport', function() {
        expect(Transport).toHaveBeenCalledWith('/remote');
      });
    });
  });

  describe('Datasource options', function() {
    beforeEach(function() {
      this.dataset = new Dataset({ local: fixtureData });
      this.dataset.initialize();
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
      this.dataset = new Dataset({ local: fixtureData, remote: '/remote' });
      this.dataset.initialize();
    });

    it('network requests are not triggered with enough local results', function() {
      this.dataset.limit = 3;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });

      expect(this.dataset.transport.get).not.toHaveBeenCalled();

      this.dataset.limit = 100;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          { tokens: ['coconut'], value: 'coconut' },
          { tokens: ['cake'], value: 'cake' },
          { tokens: ['coffee'], value: 'coffee' }
        ]);
      });

      expect(this.dataset.transport.get).toHaveBeenCalled();
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
      var spy = jasmine.createSpy(),
          remote = [expectedItemHash.grape, expectedItemHash.cake];

      this.dataset.transport.get.andCallFake(function(q, cb) { cb(remote); });

      this.dataset.getSuggestions('c', spy);

      expect(spy.callCount).toBe(2);

      // local suggestions
      expect(spy.argsForCall[0]).toContain([
        expectedItemHash.coconut,
        expectedItemHash.cake,
        expectedItemHash.coffee
      ]);

      // local + remote suggestions
      expect(spy.argsForCall[1]).toContain([
        expectedItemHash.coconut,
        expectedItemHash.cake,
        expectedItemHash.coffee,
        expectedItemHash.grape
      ]);
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
  });

  describe('tokenization', function() {
    describe('with datum strings', function() {
      var fixtureData = ['course-106', 'user_name', 'One-Two', 'two three'];

      beforeEach(function() {
        this.dataset = new Dataset({ local: fixtureData });
        this.dataset.initialize();
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
      this.dataset = new Dataset({ local: fixtureData });
      this.dataset.initialize();
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
