'use strict';

var yaml = require('js-yaml');

class Raml {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      raml: {
        lifecycleEvents: [
          'serverless'
        ],
      },
    };

    this.hooks = {
      'raml:serverless': this.ramlCommand.bind(this)
    }
  }

  ramlCommand() {
    this.getRaml().then((raml) => console.log(raml));
  }

  getRaml() {

    var service = this.serverless.service;
    var docs = service.custom && service.custom.documentation && service.custom.documentation.raml;

    var spec = docs || {};

    !spec.protocols && (spec.protocols = [ 'HTTPS' ]);
    !spec.mediaType && (spec.mediaType = 'application/json' );

    service.getAllFunctions().map((f) => {
      var events = service.getFunction(f).events;

      return events
             ? events
               .filter((e) => !!e.http)
               .map((e) => {
                 return {
                   path       : e.http.path,
                   method     : e.http.method,
                   split_path : e.http.path.split('/'),
                   docs       : e.http.documentation && e.http.documentation.raml,
                 };
               })
             : [];

    })

    .reduce((a, b) => a.concat(b),[])

    .forEach((e) => {
      var root = spec;


      if ( e.path == '/' ) {

        if ( !root['/'] ) root['/'] = {};
        root = root['/'];

      } else {

        e.split_path.forEach((p) => {
          if ( p.length ) {
            p = '/' + p;
            if ( !root[p] ) root[p] = {};
            root = root[p];
          }
        });

      }

      root[e.method] = e.docs || {};

    });

    return [
      '#%RAML 1.0',
      yaml.safeDump(spec)
    ].join("\n");
  }
}

module.exports = Raml;
