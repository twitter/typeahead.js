describe('SectionView', function() {

  beforeEach(function() {
    jasmine.Dataset.useMock();

    this.dataset = new Dataset();
    this.dataset.name = 'test';

    this.section = new SectionView({ dataset: this.dataset });
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

      expect(this.section.getRoot()).toContainText('one');
      expect(this.section.getRoot()).toContainText('two');
      expect(this.section.getRoot()).toContainText('three');
    });

    it('should render empty when no suggestions are available', function() {
      this.section = new SectionView({
        dataset: this.dataset,
        templates: {
          empty: '<h2>empty</h2>'
        }
      });

      this.dataset.get.andCallFake(fakeGetWithSyncEmptyResults);
      this.section.update('woah');

      expect(this.section.getRoot()).toContainText('empty');
    });

    it('should render header', function() {
      this.section = new SectionView({
        dataset: this.dataset,
        templates: {
          header: '<h2>header</h2>'
        }
      });

      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      expect(this.section.getRoot()).toContainText('header');
    });

    it('should render footer', function() {
      this.section = new SectionView({
        dataset: this.dataset,
        templates: {
          footer: function(c) { return '<p>' + c.query + '</p>'; }
        }
      });

      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      expect(this.section.getRoot()).toContainText('woah');
    });

    it('should not render header/footer if there is no content', function() {
      this.section = new SectionView({
        dataset: this.dataset,
        templates: {
          header: '<h2>header</h2>',
          footer: '<h2>footer</h2>'
        }
      });

      this.dataset.get.andCallFake(fakeGetWithSyncEmptyResults);
      this.section.update('woah');

      expect(this.section.getRoot()).not.toContainText('header');
      expect(this.section.getRoot()).not.toContainText('footer');
    });

    it('should not render stale suggestions', function() {
      this.dataset.get.andCallFake(fakeGetWithAsyncResults);
      this.section.update('woah');

      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('nelly');

      waits(100);

      runs(function() {
        expect(this.section.getRoot()).toContainText('one');
        expect(this.section.getRoot()).toContainText('two');
        expect(this.section.getRoot()).toContainText('three');
        expect(this.section.getRoot()).not.toContainText('four');
        expect(this.section.getRoot()).not.toContainText('five');
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
    it('should clear suggestions', function() {
      this.dataset.get.andCallFake(fakeGetWithSyncResults);
      this.section.update('woah');

      this.section.clear();
      expect(this.section.getRoot()).toBeEmpty();
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

  function fakeGetWithSyncEmptyResults(query, cb) {
    cb();
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
