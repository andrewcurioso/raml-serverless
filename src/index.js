'use strict';

var yaml = require('js-yaml');

class Raml {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    /* Note: this will not work once non-AWS providers are added */
    this.provider = this.serverless.getProvider('aws');

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
    this.getEndpointAsync()
    .then((endpoint) => console.log(this.getRaml(endpoint)));
  }

  getEndpointAsync() {
    const stackName = this.provider.naming.getStackName(this.options.stage);

    return this.provider.request('CloudFormation',
      'describeStacks',
      { StackName: stackName },
      this.options.stage,
      this.options.region)

    .then((result) => {
      let outputs;
      if ( result && result.Stacks.length ) {
        outputs = result.Stacks[0].Outputs;
        const serviceEndpointOutputRegex = this.provider.naming.getServiceEndpointRegex();
        return outputs.filter(x => x.OutputKey.match(serviceEndpointOutputRegex)).reduce(x => x);
      }

    })

    .then((endpoint) => {
      return endpoint && endpoint.OutputValue;
    })

    .catch((e) => {
      return null;
    });
    
  }

  getRaml(endpoint) {

    var service = this.serverless.service;
    var docs = service.custom && service.custom.documentation && service.custom.documentation.raml;

    var spec = docs || {};

    !spec.protocols && (spec.protocols = [ 'HTTPS' ]);
    !spec.mediaType && (spec.mediaType = 'application/json' );
    !spec.baseUri && endpoint && (spec.baseUri = endpoint);

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
