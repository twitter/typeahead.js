describe('utils', function() {

  describe('guid', function() {

    it('should return unique strings', function() {
        var a = _.guid();
        var b = _.guid();

        expect(typeof a).toEqual('string');
        expect(typeof b).toEqual('string');
        expect(a).toNotEqual(b);
    });

  });

});
