$(document).ready(function() {
  var numbers, countries, repos, arabic, nba, nhl, films, anExcitedSource;

  numbers = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.num); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: [
      { num: 'one' },
      { num: 'two' },
      { num: 'three' },
      { num: 'four' },
      { num: 'five' },
      { num: 'six' },
      { num: 'seven' },
      { num: 'eight' },
      { num: 'nine' },
      { num: 'ten' }
    ]
  });

  numbers.initialize();

  $('.example-numbers .typeahead').typeahead(null, {
    displayKey: 'num',
    source: numbers.ttAdapter()
  });

var countries = new Bloodhound({
  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 10,
  prefetch: {
    url: '../data/countries.json',
    filter: function(list) {
      return $.map(list, function(country) { return { name: country }; });
    }
  }
});

countries.initialize();

$('.example-countries .typeahead').typeahead(null, {
  name: 'countries',
  displayKey: 'name',
  source: countries.ttAdapter()
});

repos = new Bloodhound({
  datumTokenizer: function(d) { return d.tokens; },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../data/repos.json'
});

repos.initialize();

$('.example-twitter-oss .typeahead').typeahead(null, {
  name: 'twitter-oss',
  displayKey: 'name',
  source: repos.ttAdapter(),
  templates: {
    suggestion: Handlebars.compile([
      '<p class="repo-language">{{language}}</p>',
      '<p class="repo-name">{{name}}</p>',
      '<p class="repo-description">{{description}}</p>'
    ].join(''))
  }
});

var arabic = new Bloodhound({
  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.word); },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  local: [
    { word: "الإنجليزية" },
    { word: "نعم" },
    { word: "لا" },
    { word: "مرحبا" },
    { word: "أهلا" }
  ]
});

arabic.initialize();

$('.example-arabic .typeahead').typeahead({
  hint: false
},
{
  name: 'arabic',
  displayKey: 'word',
  source: arabic.ttAdapter()
});

nba = new Bloodhound({
  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.team); },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../data/nba.json'
});

nhl = new Bloodhound({
  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.team); },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../data/nhl.json'
});

nba.initialize();
nhl.initialize();

$('.example-sports .typeahead').typeahead({
  highlight: true
},
{
  name: 'nba',
  displayKey: 'team',
  source: nba.ttAdapter(),
  templates: {
    header: '<h3 class="league-name">NBA Teams</h3>'
  }
},
{
  name: 'nhl',
  displayKey: 'team',
  source: nhl.ttAdapter(),
  templates: {
    header: '<h3 class="league-name">NHL Teams</h3>'
  }
});

films = new Bloodhound({
  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  remote: '../data/films/queries/%QUERY.json',
  prefetch: '../data/films/post_1960.json'
});

films.initialize();

$('.example-films .typeahead').typeahead(null, {
  displayKey: 'value',
  source: films.ttAdapter(),
  templates: {
    suggestion: Handlebars.compile(
      '<p><strong>{{value}}</strong> – {{year}}</p>'
    )
  }
});

anExcitedSource = function(query, cb) {
  var results = $.map(['!', '!!', '!!!'], function(appendage) {
    var datum = { theValue: query + appendage };

    return datum;
  });

  cb(results);
};

$('.example-exclaimation .typeahead').typeahead(null, {
  displayKey: 'theValue',
  source: anExcitedSource
});
});
