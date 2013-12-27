describe('SearchIndex', function() {

  beforeEach(function() {
    this.searchIndex = new SearchIndex();
    this.searchIndex.add(fixtures.data.simple);
  });

  it('should support serialization/deserialization', function() {
    var serialized = this.searchIndex.serialize();

    this.searchIndex = new SearchIndex();
    this.searchIndex.bootstrap(serialized);

    expect(this.searchIndex.get('smaller')).toEqual([{ value: 'smaller' }]);
  });

  it('should be able to add data on the fly', function() {
    this.searchIndex.add({ value: 'new' });

    expect(this.searchIndex.get('new')).toEqual([{ value: 'new' }]);
  });

  it('should allow tokens to be set manually', function() {
    this.searchIndex.add({ value: 'old', tokens: ['new'] });

    expect(this.searchIndex.get('new')).toEqual([{ value: 'old' }]);
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

  it('#remote should throw an exception', function() {
    expect(this.searchIndex.remove).toThrow();
  });

  it('#get should return an empty array of there are no matches', function() {
    expect(this.searchIndex.get('wtf')).toEqual([]);
  });
});
