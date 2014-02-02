var fixtures = fixtures || {};

fixtures.data = {
  simple: [
    { value: 'big' },
    { value: 'bigger' },
    { value: 'biggest' },
    { value: 'small' },
    { value: 'smaller' },
    { value: 'smallest' }
  ],
  animals: [
    { value: 'dog' },
    { value: 'cat' },
    { value: 'moose' }
  ]
};

fixtures.serialized = {
  simple: {
    "datums": [
      { "value": "big" },
      { "value": "bigger" },
      { "value": "biggest" },
      { "value": "small" },
      { "value": "smaller" },
      { "value": "smallest" }
    ],
    "trie": {
      "ids": [],
      "children": {
        "b": {
          "ids": [0, 1, 2],
          "children": {
            "i": {
              "ids": [0, 1, 2],
              "children": {
                "g": {
                  "ids": [0, 1, 2],
                  "children": {
                    "g": {
                      "ids": [1, 2],
                      "children": {
                        "e": {
                          "ids": [1, 2],
                          "children": {
                            "r": {
                              "ids": [1],
                              "children": {}
                            },
                            "s": {
                              "ids": [2],
                              "children": {
                                "t": {
                                  "ids": [2],
                                  "children": {}
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "s": {
          "ids": [3, 4, 5],
          "children": {
            "m": {
              "ids": [3, 4, 5],
              "children": {
                "a": {
                  "ids": [3, 4, 5],
                  "children": {
                    "l": {
                      "ids": [3, 4, 5],
                      "children": {
                        "l": {
                          "ids": [3, 4, 5],
                          "children": {
                            "e": {
                              "ids": [4, 5],
                              "children": {
                                "r": {
                                  "ids": [4],
                                  "children": {}
                                },
                                "s": {
                                  "ids": [5],
                                  "children": {
                                    "t": {
                                      "ids": [5],
                                      "children": {}
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
