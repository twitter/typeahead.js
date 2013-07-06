jasmine.Matchers.prototype.toBeFunction = function() {
  return typeof this.actual === 'function';
};
