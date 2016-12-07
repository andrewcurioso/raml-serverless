'use strict';

/*
 * ServerlessBulder origionally copied from the serverless-offline project
 * Date:    2016-12-06
 * Url:     https://github.com/dherault/serverless-offline/blob/c21b332f99c73ffda7caa7a1108f30b93d89fa42/test/support/ServerlessBuilder.js
 * License: MIT
 */

const _ = require('lodash');
const sinon = require('sinon');

module.exports = class ServerlessBuilder {
  constructor(serverless) {
    const serverlessDefaults = {
      service: {
        provider: {
          name: 'aws',
          stage: 'dev',
          region: 'us-east-1',
          runtime: 'nodejs4.3',
        },
        functions: {},
        getFunction(functionName) {
          return this.functions[functionName];
        },
        getAllFunctions() {
          return Object.keys(this.functions);
        },
      },
      cli: {
        log: sinon.stub(),
      },
      version: '1.0.2',
      config: {
        servicePath: '',
      },
      getProvider() {
        return null;
      },
    };
    this.serverless = _.merge(serverlessDefaults, serverless);

    this.serverless.service.getFunction = this.serverless.service.getFunction.bind(this.serverless.service);
    this.serverless.service.getAllFunctions = this.serverless.service.getAllFunctions.bind(this.serverless.service);
    this.serverless.getProvider = this.serverless.getProvider.bind(this.serverless.service);

  }

  addApiKeys(keys) {
    this.serverless.service.provider = Object.assign(this.serverless.service.provider, { apiKeys: keys });
  }

  addFunction(functionName, functionConfig) {
    this.serverless.service.functions[functionName] = functionConfig;
  }

  addCustom(prop, value) {
    const newCustomProp = {};
    newCustomProp[prop] = value;
    this.serverless.service.custom = Object.assign(this.serverless.service.custom || {}, newCustomProp);
  }

  toObject() {
    return this.serverless;
  }
};
