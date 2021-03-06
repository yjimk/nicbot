const Bluebird = require('bluebird');

const DynamoService = require('./DynamoService');
const Utils = require('./Utils');

module.exports = {
  MainBranchRes: function (session = {}, clearCompleted = false) {
    console.log('LexService.MainBranchRes...');

    return DynamoService.findDynamic('mainBranch')
      .then(r => Utils.isJson(r.messages))
      .tap(console.log)
      .then(messages => Object.assign({}, {
        sessionAttributes: Object.assign({}, session, {
          completedDistractions: JSON.stringify(clearCompleted ? [] : Utils.returnArray(session.completedDistractions))
        }),
        dialogAction: {
          type: 'ElicitSlot',
          intentName: 'MainBranch',
          slots: {
            StressLevel: null
          },
          slotToElicit: 'StressLevel',
          message: {
            contentType: 'PlainText',
            content: messages[Utils.rdmKey(messages)]
          }
        }
      }));
  },

  NextActionRes: function (event, nextAction) {
    console.log('LexService.NextActionRes...');

    if (!nextAction) {
      return Bluebird.reject(new Error('nextAction is required'));
    }

    if (nextAction === 'end') {
      return this.endSession(true);
    }

    const session = event.sessionAttributes || {};

    return Bluebird.resolve(Object.assign({}, {
      sessionAttributes: Object.assign({}, session, {
        completedDistractions: JSON.stringify(nextAction.clearCompleted ? [] : [ nextAction.intentKey, ...Utils.returnArray(session.completedDistractions) ]),
        StressLevel: event.currentIntent.slots.StressLevel || session.StressLevel || null
      }),
      dialogAction: Object.assign({
        type: 'ElicitSlot',
        intentName: nextAction.intentName,
        slots: Utils.isJson(nextAction.slots),
        slotToElicit: nextAction.slotToElicit
      }, this.genEllicitMsg(nextAction.ellicitMsg))
    }));
  },

  endSession: function (sendMsg = false) {
    console.log('LexService.endSession...');

    const endMsg = {
      contentType: 'PlainText',
      content: 'We are always here for you, I hope we can be of more help next time.'
    };

    return Bluebird.resolve({
      dialogAction: Object.assign({}, {
        type: 'Close',
        fulfillmentState: 'Fulfilled',
        message: {
          contentType: 'PlainText',
          content: 'We are always here for you, I hope we can be of more help next time.'
        }
      }, sendMsg ? endMsg : {})
    });
  },

  genEllicitMsg: function (ellicitMsg) {
    console.log('LexService.genEllicitMsg...');

    if (!ellicitMsg) {
      return {};
    }

    return {
      message: {
        content: `${ellicitMsg}`,
        contentType: 'PlainText'
      }
    };
  }
};
