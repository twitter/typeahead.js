describe('EventEmitter', function() {

  beforeEach(function() {
    this.spy = jasmine.createSpy();
    this.target = EventEmitter.mixin({});
  });

  it('.mixin should mix in methods', function() {
    expect(this.target.on).toBeDefined();
    expect(this.target.off).toBeDefined();
    expect(this.target.trigger).toBeDefined();
  });

  it('#on, #off, and #trigger should be chainable', function() {
    expect(this.target.on()).toEqual(this.target);
    expect(this.target.off()).toEqual(this.target);
    expect(this.target.trigger()).toEqual(this.target);
  });

  it('#on should take the context a callback should be called in', function() {
    var context = { val: 3 }, cbContext;

    this.target.on('event', setCbContext, context).trigger('event');

    waitsFor(assertCbContext, 'callback was called in the wrong context');

    function setCbContext() { cbContext = this; }
    function assertCbContext() { return cbContext === context; }
  });

  it('#trigger should invoke callbacks asynchronously', function() {
    this.target.on('event', this.spy).trigger('event');

    expect(this.spy.callCount).toBe(0);
    waitsFor(assertCallCount(this.spy, 1), 'the callback was not invoked');
  });

  it('#off should remove callbacks', function() {
    this.target
      .on('event1 event2', this.spy)
      .off('event1 event2')
      .trigger('event1 event2');

    waits(100);
    runs(assertCallCount(this.spy, 0));
  });

  it('#on and #trigger should accept multiple event types', function() {
    this.target.on('event1 event2', this.spy).trigger('event1 event2');

    expect(this.spy.callCount).toBe(0);
    waitsFor(assertCallCount(this.spy, 2), 'the callback was not invoked');
  });

  it('the event type should be passed to the callback', function() {
    this.target.on('event', this.spy).trigger('event');

    waitsFor(assertCallCount(this.spy, 1), 'the callback was not invoked');
    waitsFor(assertArgs(this.spy, 0, ['event']), 'bad args');
  });

  it('arbitrary args should be passed to the callback', function() {
    this.target.on('event', this.spy).trigger('event', 1, 2);

    waitsFor(assertCallCount(this.spy, 1), 'the callback was not invoked');
    waitsFor(assertArgs(this.spy, 0, ['event', 1, 2]), 'bad args');
  });

  function assertCallCount(spy, expected) {
    return function() { return spy.callCount === expected; };
  }

  function assertArgs(spy, call, expected) {
    return function() {
      var env = jasmine.getEnv(),
          actual = spy.calls[call] ? spy.calls[call].args : undefined;

      return env.equals_(actual, expected);
    };
  }

});
