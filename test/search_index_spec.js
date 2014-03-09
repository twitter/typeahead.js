describe('SearchIndex', function() {

  beforeEach(function() {
    this.searchIndex = new SearchIndex({
      datumTokenizer: datumTokenizer,
      queryTokenizer: queryTokenizer
    });

    this.searchIndex.add(fixtures.data.simple);
  });

  it('should support serialization/deserialization', function() {
    var serialized = this.searchIndex.serialize();

    this.searchIndex = new SearchIndex({
      datumTokenizer: datumTokenizer,
      queryTokenizer: queryTokenizer
    });
    this.searchIndex.bootstrap(serialized);

    expect(this.searchIndex.get('smaller')).toEqual([{ value: 'smaller' }]);
  });

  it('should be able to add data on the fly', function() {
    this.searchIndex.add({ value: 'new' });

    expect(this.searchIndex.get('new')).toEqual([{ value: 'new' }]);
  });

  it('#get should return datums that match the given query', function() {
    expect(this.searchIndex.get('big')).toEqual([
      { value: 'big' },
      { value: 'bigger' },
      { value: 'biggest' }
    ]);

    expect(this.searchIndex.get('small')).toEqual([
      { value: 'small' },
      { value: 'smaller' },
      { value: 'smallest' }
    ]);
  });

  it('#get should return an empty array of there are no matches', function() {
    expect(this.searchIndex.get('wtf')).toEqual([]);
  });

  it('#reset should empty the search index', function() {
    this.searchIndex.reset();
    expect(this.searchIndex.datums).toEqual([]);
    expect(this.searchIndex.trie.ids).toEqual([]);
    expect(this.searchIndex.trie.children).toEqual({});
  });

  // helper functions
  // ----------------

  function datumTokenizer(d) { return $.trim(d.value).split(/\s+/); }
  function queryTokenizer(s) { return $.trim(s).split(/\s+/); }
});
