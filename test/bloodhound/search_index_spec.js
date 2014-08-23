describe('SearchIndex', function() {

  beforeEach(function() {
    this.index = new SearchIndex({
      datumTokenizer: datumTokenizer,
      queryTokenizer: queryTokenizer
    });

    this.index.add(fixtures.data.simple);
  });

  it('should support serialization/deserialization', function() {
    var serialized = this.index.serialize();

    this.index = new SearchIndex({
      datumTokenizer: datumTokenizer,
      queryTokenizer: queryTokenizer
    });
    this.index.bootstrap(serialized);

    expect(this.index.search('smaller')).toEqual([{ value: 'smaller' }]);
  });

  it('should be able to add data on the fly', function() {
    this.index.add({ value: 'new' });

    expect(this.index.search('new')).toEqual([{ value: 'new' }]);
  });

  it('#get should return datums by id', function() {
    this.index = new SearchIndex({
      identify: function(d) { return d.value; },
      datumTokenizer: datumTokenizer,
      queryTokenizer: queryTokenizer
    });
    this.index.add(fixtures.data.simple);

    expect(this.index.get(['big', 'bigger'])).toEqual([
      { value: 'big' },
      { value: 'bigger' }
    ]);
  });

  it('#search should return datums that match the given query', function() {
    expect(this.index.search('big')).toEqual([
      { value: 'big' },
      { value: 'bigger' },
      { value: 'biggest' }
    ]);

    expect(this.index.search('small')).toEqual([
      { value: 'small' },
      { value: 'smaller' },
      { value: 'smallest' }
    ]);
  });

  it('#search should return an empty array of there are no matches', function() {
    expect(this.index.search('wtf')).toEqual([]);
  });

  it('#all should return all datums', function() {
    expect(this.index.all()).toEqual(fixtures.data.simple);
  });

  it('#reset should empty the search index', function() {
    this.index.reset();
    expect(this.index.datums).toEqual([]);
    expect(this.index.trie.ids).toEqual([]);
    expect(this.index.trie.children).toEqual({});
  });

  // helper functions
  // ----------------

  function datumTokenizer(d) { return $.trim(d.value).split(/\s+/); }
  function queryTokenizer(s) { return $.trim(s).split(/\s+/); }
});
