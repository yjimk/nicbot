'use strict';

const Bluebird = require('bluebird');
const DynamoService = require('./DynamoService');
const MessengerService = require('./MessengerService');
const Utils = require('./Utils');

module.exports = {
  findNext: function (completedDistractions = null, distractions) {
    console.log('DistractionService.findNext...');

    const completed = Utils.returnArray(completedDistractions);

    return this.removeCompleted(completed, distractions)
      .then(distMap => {
        if (!distMap || distMap.length === 0) {
          return Object.assign({}, distractions[Utils.rdmKey(distractions)], {
            clearCompleted: true
          });
        }

        return Object.assign({}, distMap[Utils.rdmKey(distMap)]);
      });
  },

  removeCompleted: function (completed = [], distractions) {
    console.log('DistractionService.removeCompleted...');

    if (!Array.isArray(distractions) || distractions.length === 0) {
      return Bluebird.reject(new Error('No distractions were found'));
    }

    return Bluebird.filter(distractions, distraction => {
      if (!completed.includes(distraction.intentKey)) {
        return distraction;
      }
    });
  },

  pickRdm: function (event) {
    console.log('DistractionService.pickRdm...');

    if (!event) {
      return Bluebird.reject(new Error('event was not supplied'));
    }

    return DynamoService.findAllDistractions(event)
      .then(distractions => {
        if (!Array.isArray(distractions) || distractions.length === 0) {
          return Bluebird.reject(new Error('No distractions were found'));
        }

        return this.findNext(this.returnCompleted(event.sessionAttributes), distractions);
      })
      .tap(distraction => MessengerService.sendMsgArray(distraction.messages, event.userId));
  },

  returnCompleted: function (sessionAttributes) {
    console.log('DistractionService.returnCompleted...');

    if (!sessionAttributes) {
      return [];
    }

    return Utils.isJson(sessionAttributes.completedDistractions) || [];
  }
};
