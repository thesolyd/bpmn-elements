"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActivityApi = ActivityApi;
exports.DefinitionApi = DefinitionApi;
exports.ProcessApi = ProcessApi;
exports.FlowApi = FlowApi;
exports.Api = Api;

var _messageHelper = require("./messageHelper");

function ActivityApi(broker, apiMessage, environment) {
  return Api('activity', broker, apiMessage, environment);
}

function DefinitionApi(broker, apiMessage, environment) {
  return Api('definition', broker, apiMessage, environment);
}

function ProcessApi(broker, apiMessage, environment) {
  return Api('process', broker, apiMessage, environment);
}

function FlowApi(broker, apiMessage, environment) {
  return Api('flow', broker, apiMessage, environment);
}

function Api(pfx, broker, sourceMessage, environment) {
  if (!sourceMessage) throw new Error('Api requires message');
  const apiMessage = (0, _messageHelper.cloneMessage)(sourceMessage);
  const apiContent = apiMessage.content;
  const executionId = apiContent.executionId;
  const owner = broker.owner;
  environment = environment || broker.owner.environment;
  return {
    id: apiContent.id,
    type: apiContent.type,
    name: apiContent.name,
    executionId,
    environment,
    fields: apiMessage.fields,
    content: apiContent,
    messageProperties: apiMessage.properties,

    get owner() {
      return owner;
    },

    cancel() {
      sendApiMessage('cancel');
    },

    discard(message) {
      sendApiMessage('discard', {
        message
      });
    },

    signal(message, options) {
      sendApiMessage('signal', {
        message
      }, options);
    },

    stop() {
      sendApiMessage('stop');
    },

    resolveExpression(expression) {
      return environment.resolveExpression(expression, apiMessage, broker.owner);
    },

    sendApiMessage,
    createMessage,
    getPostponed
  };

  function sendApiMessage(action, content, options = {}) {
    let key = `${pfx}.${action}`;
    if (executionId) key += `.${executionId}`;
    broker.publish('api', key, createMessage(content), { ...options,
      type: action
    });
  }

  function getPostponed(...args) {
    if (owner.getPostponed) return owner.getPostponed(...args);
    if (owner.isSubProcess && owner.execution) return owner.execution.getPostponed(...args);
    return [];
  }

  function createMessage(content = {}) {
    return { ...apiContent,
      ...content
    };
  }
}