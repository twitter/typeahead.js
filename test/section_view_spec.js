describe('SectionView', function() {

  beforeEach(function() {
    jasmine.Dataset.useMock();

    this.dataset = new Dataset();
    this.dataset.name = 'test';

    this.section = new SectionView({ dataset: this.dataset });

    this.$root = this.section.getRoot();
  });

  it('should throw an error if dataset is missing', function() {
    expect(noDataset).toThrow();

    function noDataset() { new SectionView(); }
  });

  describe('#getRoot', function() {
    it('should return the root element', function() {
      expect(this.section.getRoot()).toBe('div.tt-section-test');
    });
  });

  describe('#update', function() {
    it('should render suggestions', function() {
      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      expect(this.$root).toContainText('one');
      expect(this.$root).toContainText('two');
      expect(this.$root).toContainText('three');
    });

    it('should not render stale suggestions', function() {
      this.dataset.get.andCallFake(fakeGetWithAsyncResults);
      this.section.update('woah');

      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('nelly');

      waits(100);

      runs(function() {
        expect(this.$root).toContainText('one');
        expect(this.$root).toContainText('two');
        expect(this.$root).toContainText('three');
        expect(this.$root).not.toContainText('four');
        expect(this.$root).not.toContainText('five');
      });
    });

    it('should trigger rendered after suggestions are rendered', function() {
      var spy;

      this.section.onSync('rendered', spy = jasmine.createSpy());

      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      waitsFor(function() { return spy.callCount; });
    });
  });

  describe('#clear', function() {
    it('should empty the element', function() {
      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      waitsFor(function() { return this.$root.children().length });

      runs(function() {
        this.section.clear();
        expect(this.$root).toBeEmpty();
      });
    });
  });

  describe('#isEmpty', function() {
    it('should return true when empty', function() {
      expect(this.section.isEmpty()).toBe(true);
    });

    it('should return false when not empty', function() {
      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      expect(this.section.isEmpty()).toBe(false);
    });
  });

  // helper functions
  // ----------------

  function fakeGetWithSyncResults(query, cb) {
    cb([
      { value: 'one', raw: { value: 'one' } },
      { value: 'two', raw: { value: 'two' } },
      { value: 'three', raw: { value: 'three' } }
    ]);
  }

  function fakeGetWithAsyncResults(query, cb) {
    setTimeout(function() {
      cb([
        { value: 'four', raw: { value: 'four' } },
        { value: 'five', raw: { value: 'five' } },
      ]);
    }, 0);
  }
});
