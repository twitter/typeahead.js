$(document).ready(function() {
  $('.example-countries .typeahead').typeahead({
    name: 'countries',
    prefetch: '../data/countries.json',
    limit: 10
  });

  $('.example-twitter-oss .typeahead').typeahead({
    name: 'twitter-oss',
    prefetch: '../data/repos.json',
    template: [
      '<p class="repo-language">{{language}}</p>',
      '<p class="repo-name">{{name}}</p>',
      '<p class="repo-description">{{description}}</p>'
    ].join(''),
    engine: Hogan
  });

  $('.example-arabic .typeahead').typeahead({
    name: 'arabic',
    local: [
      "الإنجليزية",
      "نعم",
      "لا",
      "مرحبا",
      "کيف الحال؟",
      "أهلا",
      "مع السلامة",
      "لا أتكلم العربية",
      "لا أفهم",
      "أنا جائع"
    ]
  });

  $('.example-sports .typeahead').typeahead([
    {
      name: 'nba-teams',
      prefetch: '../data/nba.json',
      header: '<h3 class="league-name">NBA Teams</h3>'
    },
    {
      name: 'nhl-teams',
      prefetch: '../data/nhl.json',
      header: '<h3 class="league-name">NHL Teams</h3>'
    }
  ]);

  $('.example-films .typeahead').typeahead([
    {
      name: 'best-picture-winners',
      remote: '../data/films/queries/%QUERY.json',
      prefetch: '../data/films/post_1960.json',
      template: '<p><strong>{{value}}</strong> – {{year}}</p>',
      engine: Hogan
    }
  ]);
});
