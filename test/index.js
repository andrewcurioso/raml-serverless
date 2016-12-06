'use strict';

const chai = require('chai');
const expect = require('chai').expect;
var yaml = require('js-yaml');

const RamlServerless = require('../src/index.js');
const ServerlessBuilder = require('./support/ServerlessBuilder.js');

describe('RAML-Serverless', () => {

  describe('.getRaml', function() {

    let serverless, plugin;

    beforeEach(() => {
      serverless = new ServerlessBuilder({ service: { custom: {} } });
      plugin = new RamlServerless(serverless.serverless, serverless.config);
    });

    it('writes "#%RAML 1.0" to the first line', function() {

      let out = plugin.getRaml();
      expect(out).to.match(/^#%RAML 1.0\n/);

    });

    it('writes the contents of custom.documentation.raml to output as is', function() {

      serverless.addCustom('documentation',{
        raml: {
          title:   'My Awesome API',
          version: 'v1.0',
        },
      });

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);
      expect(outObj).to.contain.all.keys('title','version')
      expect(outObj.title).to.equal('My Awesome API');
      expect(outObj.version).to.equal('v1.0');

    });

    it('creates a object for each HTTP event path', function() {

      serverless.addFunction('func1',{
        events: [
          {http: {
            method: 'get',
            path:   '/one',
          }},
        ],
      });

      serverless.addFunction('func2',{
        events: [
          {http: {
            method: 'post',
            path:   '/one',
          }},
          {http: {
            method: 'get',
            path:   '/two',
          }},
          {http: {
            method: 'get',
            path:   '/three',
          }},
        ],
      });

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);
      expect(outObj).to.contain.all.keys('/one','/two','/three')
      expect(outObj['/one']).to.have.keys('get','post');
      expect(outObj['/two']).to.have.keys('get');
      expect(outObj['/three']).to.have.keys('get');

    });

    it('splits paths', function() {

      serverless.addFunction('func1',{
        events: [
          {http: {
            method: 'get',
            path:   '/one',
          }},
        ],
      });

      serverless.addFunction('func2',{
        events: [
          {http: {
            method: 'get',
            path:   '/one/two',
          }},
          {http: {
            method: 'get',
            path:   '/one/two/three',
          }},
        ],
      });

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);
      expect(outObj).to.contain.all.keys('/one')
      expect(outObj['/one']).to.have.keys('get','/two');
      expect(outObj['/one']['/two']).to.have.keys('get','/three');
      expect(outObj['/one']['/two']['/three']).to.have.keys('get');

    });

    it('works with root path [/]', function() {

      serverless.addFunction('func1',{
        events: [
          {http: {
            method: 'get',
            path:   '/',
          }},
        ],
      });

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);
      expect(outObj).to.contain.all.keys('/')
      expect(outObj['/']).to.have.keys('get');

    });

    it('defaults to protocol = HTTPS', function() {

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);

      expect(outObj.protocols).to.deep.equal(['HTTPS']);

    });

    it('defaults to mediaType = application/json', function() {

      let out = plugin.getRaml();
      let outObj = yaml.safeLoad(out);

      expect(outObj.mediaType).to.deep.equal('application/json');

    });

  });

});
