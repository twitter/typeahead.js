describe('EventTarget', function() {
  var obj;

  beforeEach(function() {
    utils.mixin(obj = {}, EventTarget);
  });

  describe('#on', function() {
    it('should allow for space separated events', function() {
      obj.on('event1 event2 event3', noop);

      expect(obj._callbacks.event1).toBeDefined();
      expect(obj._callbacks.event2).toBeDefined();
      expect(obj._callbacks.event3).toBeDefined();
    });

    it('should allow for binding multiple callbacks to same event', function() {
      obj.on('event1', noop);
      obj.on('event1', noop);
      obj.on('event1', noop);
      expect(obj._callbacks.event1.length).toEqual(3);
    });

    it('should do nothing if no callback is provided', function() {
      obj.on('event1');
      expect(obj._callbacks).not.toBeDefined();
    });
  });

  describe('#trigger', function() {
    it('should allow for space separated events', function() {
      var spy = jasmine.createSpy();

      obj.on('event1 event2 event3', spy);
      obj.trigger('event1 event2 event3');

      expect(spy.callCount).toEqual(3);
    });

    it('should call all callbacks for a given event', function() {
      var spy1 = jasmine.createSpy(),
          spy2 = jasmine.createSpy(),
          spy3 = jasmine.createSpy();

      obj.on('event', spy1);
      obj.on('event', spy2);
      obj.on('event', spy3);
      obj.trigger('event');

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
    });

    it('should invoke callback with event info object', function() {
      var spy = jasmine.createSpy();

      obj.on('event', spy);
      obj.trigger('event', 'i am data');

      expect(spy).toHaveBeenCalledWith({
        type: 'event',
        data: 'i am data'
      });
    });
  });

  // helper functions
  // ----------------

  function noop() {}

});
