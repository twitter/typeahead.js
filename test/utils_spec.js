describe('utils', function() {
  describe('sort', function() {
    beforeEach(function() {
      this.ranker = function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      };
    });

    it('should sort an empty list', function() {
      var list = [];  
      expect(utils.sort(list, this.ranker)).toEqual([]);
    });

    it('should not modify an already sorted list', function() {
      var list = [0, 1, 23, 54, 99, 200];
      expect(utils.sort(list, this.ranker)).toEqual(list);
    });

    it('should sort a reverse sorted list', function() {
      var list = [500, 321, 30, 14, 0];
      expect(utils.sort(list, this.ranker)).toEqual([0, 14, 30, 321, 500]);
    });

    it('should sort a list containing the same element throughout', function() {
      var list = [1, 1, 1, 1, 1, 1];
      expect(utils.sort(list, this.ranker)).toEqual([1, 1, 1, 1, 1, 1]);
    });

    it('should sort a list containing dups', function() {
      var list = [120, 203, 2, 120, 309, 30, 2];
      expect(utils.sort(list, this.ranker)).toEqual([2, 2, 30, 120, 120, 203, 309]);
    });
  });
});
