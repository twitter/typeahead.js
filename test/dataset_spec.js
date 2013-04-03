describe('Dataset', function() {
  var fixtureStrings = ['grape', 'coconut', 'cake', 'tea', 'coffee'],
      fixtureDatums = [
      { value: 'grape' },
      { value: 'coconut' },
      { value: 'cake' },
      { value: 'tea' },
      { value: 'coffee' }
      ],
      expectedAdjacencyList = {
        g: ['grape'],
        c: ['coconut', 'cake', 'coffee'],
        t: ['tea']
      },
      expectedItemHash = {
        grape: createItem('grape'),
        coconut: createItem('coconut'),
        cake: createItem('cake'),
        tea: createItem('tea'),
        coffee: createItem('coffee')
      },
      prefetchResp = {
        status: 200,
        responseText: JSON.stringify(fixtureStrings)
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

          else if (/thumbprint/.test(key)) {
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
    describe('when called with a name', function() {
    beforeEach(function() {
      this.dataset = new Dataset({
        name: '#constructor',
        local: fixtureStrings
      });
    });

      it('should initialize persistent storage', function() {
        expect(this.dataset.storage).toBeDefined();
        expect(PersistentStorage).toHaveBeenCalled();
      });
    });

    describe('when called with no name', function() {
      beforeEach(function() {
        this.dataset = new Dataset({ local: fixtureStrings });
      });

      it('should not use persistent storage', function() {
        expect(this.dataset.storage).toBeNull();
        expect(PersistentStorage).not.toHaveBeenCalled();
      });
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
        this.dataset = new Dataset({ local: fixtureStrings });
      });

      it('should compile default template', function() {
        expect(this.dataset.template({ value: 'boo' }))
        .toBe('<p>boo</p>');
      });
    });

    describe('when called with a template and engine', function() {
      beforeEach(function() {
        this.spy = jasmine.createSpy().andReturn({
          render: function() { return 'boo!'; }
        });

        this.dataset = new Dataset({
          local: fixtureStrings,
          template: 't',
          engine: { compile: this.spy }
        });
      });

      it('should compile the template', function() {
        expect(this.spy)
        .toHaveBeenCalledWith('t');

        expect(this.dataset.template()).toBe('boo!');
      });
    });

    describe('when called with a compiled template', function() {
      beforeEach(function() {
        this.dataset = new Dataset({ local: fixtureStrings, template: $.noop });
      });

      it('should use it', function() {
        expect(this.dataset.template).toBe($.noop);
      });
    });
  });

  describe('#initialize', function() {
    it('should return Deferred instance', function() {
      var returnVal;

      this.dataset = new Dataset({ local: fixtureStrings });
      returnVal = this.dataset.initialize();

      // eh, have to rely on duck typing unfortunately
      expect(returnVal.fail).toBeDefined();
      expect(returnVal.done).toBeDefined();
      expect(returnVal.always).toBeDefined();
    });

    describe('when called with local', function() {
      beforeEach(function() {
        this.dataset1 = new Dataset({ local: fixtureStrings });
        this.dataset2 = new Dataset({ local: fixtureDatums });

        this.dataset1.initialize();
        this.dataset2.initialize();
      });

      it('should process and merge the data', function() {
        expect(this.dataset1.itemHash).toEqual(expectedItemHash);
        expect(this.dataset1.adjacencyList).toEqual(expectedAdjacencyList);
        expect(this.dataset2.itemHash).toEqual(expectedItemHash);
        expect(this.dataset2.adjacencyList).toEqual(expectedAdjacencyList);
      });
    });

    describe('when called with prefetch', function() {
      describe('if data is available in storage', function() {
        beforeEach(function() {
          this.dataset = new Dataset({
            name: 'prefetch',
            prefetch: '/prefetch.json'
          });

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
              filteredItemHash = { filter: createItem('filter') };

          beforeEach(function() {
            this.dataset = new Dataset({
              name: 'prefetch',
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

          it('should process and merge fileered data', function() {
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
            .toHaveBeenCalledWith('thumbprint', VERSION, ttl);
          });
        });

        describe('if filter was not passed in', function() {
          beforeEach(function() {
            this.dataset = new Dataset({
              name: 'prefetch',
              prefetch: '/prefetch.json'
            });

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
            .toHaveBeenCalledWith('thumbprint', VERSION, ttl);
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

  describe('#getSuggestions', function() {
    describe('when length of query is less than minLength', function() {
      beforeEach(function() {
        this.spy = jasmine.createSpy();

        this.dataset = new Dataset({ local: fixtureStrings, minLength: 3 });
        this.dataset.initialize();
      });

      it('should be a noop', function() {
        this.dataset.getSuggestions('co', this.spy);
        expect(this.spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Matching, combining, returning results', function() {
    beforeEach(function() {
      this.dataset = new Dataset({ local: fixtureStrings, remote: '/remote' });
      this.dataset.initialize();
    });

    it('network requests are not triggered with enough local results', function() {
      this.dataset.limit = 3;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          createItem('coconut'),
          createItem('cake'),
          createItem('coffee')
        ]);
      });

      expect(this.dataset.transport.get).not.toHaveBeenCalled();

      this.dataset.limit = 100;
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          createItem('coconut'),
          createItem('cake'),
          createItem('coffee')
        ]);
      });

      expect(this.dataset.transport.get).toHaveBeenCalled();
    });

    it('matches', function() {
      this.dataset.getSuggestions('c', function(items) {
        expect(items).toEqual([
          createItem('coconut'),
          createItem('cake'),
          createItem('coffee')
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
          remote = [fixtureDatums[0], fixtureStrings[2]];

      this.dataset.transport.get.andCallFake(function(q, cb) {
        utils.defer(function() { cb(remote); });
      });

      this.dataset.getSuggestions('c', spy);

      waitsFor(function() { return spy.callCount === 2; });

      runs(function() {
        // local suggestions
        expect(spy.argsForCall[0][0]).toEqual([
          expectedItemHash.coconut,
          expectedItemHash.cake,
          expectedItemHash.coffee
        ]);

        // local + remote suggestions
        expect(spy.argsForCall[1][0]).toEqual([
          expectedItemHash.coconut,
          expectedItemHash.cake,
          expectedItemHash.coffee,
          expectedItemHash.grape
        ]);
      });
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
          expect(items).toEqual([createItem('course-106')]);
        });
        this.dataset.getSuggestions('cOuRsE 106', function(items) {
          expect(items).toEqual([createItem('course-106')]);
        });
        this.dataset.getSuggestions('one two', function(items) {
          expect(items).toEqual([createItem('One-Two')]);
        });
        this.dataset.getSuggestions('THREE TWO', function(items) {
          expect(items).toEqual([createItem('two three')]);
        });
      });

      it('matches items with dashes', function() {
        this.dataset.getSuggestions('106 course', function(items) {
          expect(items).toEqual([createItem('course-106')]);
        });
        this.dataset.getSuggestions('course-106', function(items) {
          expect(items).toEqual([]);
        });
      });

      it('matches items with underscores', function() {
        this.dataset.getSuggestions('user name', function(items) {
          expect(items).toEqual([createItem('user_name')]);
        });
      });
    });
  });

  describe('with datum objects', function() {
    var fixtureData = [{ value: 'course-106' }];

    beforeEach(function() {
      this.dataset = new Dataset({ local: fixtureData });
      this.dataset.initialize();
    });

    it('matches items with dashes', function() {
      this.dataset.getSuggestions('106 course', function(items) {
        expect(items).toEqual([createItem('course-106')]);
      });

      this.dataset.getSuggestions('course-106', function(items) {
        expect(items).toEqual([]);
      });
    });
  });

  // helper functions
  // ----------------

  function createItem(val) {
    return {
      value: val,
      tokens: utils.tokenizeText(val),
      datum: { value: val }
    };
  }
});

