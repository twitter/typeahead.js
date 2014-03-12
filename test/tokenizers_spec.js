describe('tokenizers', function() {

  it('.whitespace should tokenize on whitespace', function() {
    var tokens = tokenizers.whitespace('big-deal ok');
    expect(tokens).toEqual(['big-deal', 'ok']);
  });

  it('.nonword should tokenize on non-word characters', function() {
    var tokens = tokenizers.nonword('big-deal ok');
    expect(tokens).toEqual(['big', 'deal', 'ok']);
  });

  it('.obj.whitespace should tokenize on whitespace', function() {
    var t = tokenizers.obj.whitespace('val');
    var tokens = t({ val: 'big-deal ok' });

    expect(tokens).toEqual(['big-deal', 'ok']);
  });

  it('.obj.nonword should tokenize on non-word characters', function() {
    var t = tokenizers.obj.nonword('val');
    var tokens = t({ val: 'big-deal ok' });

    expect(tokens).toEqual(['big', 'deal', 'ok']);
  });
});
