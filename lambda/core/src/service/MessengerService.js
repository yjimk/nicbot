'use strict';

const Bluebird = require('bluebird');
const request = require('request-promise');

const DynamoService = require('./DynamoService');
const Utils = require('./Utils');

const DELAY_MULTIPLIER = Number(process.env.DELAY_MULTIPLIER) || 1000;
const DELAY_FLOOR = Number(process.env.DELAY_FLOOR) || 1000;
const MSG_DELAY = process.env.TEST_DELAY || Math.floor((Math.random() * DELAY_MULTIPLIER) + DELAY_FLOOR);

module.exports = {
  sendMessages: function (content, userId) {
    console.log('MessengerService.sendMessages...');

    if (process.env.NODE_ENV === 'development') {
      return;
    }

    return request.post({
      json: true,
      url: `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`,
      body: {
        recipient: { id: userId },
        message: { text: content }
      },
      headers: { 'Content-Type': 'application/json' }
    });
  },

  sendDynamic: function (type, userId) {
    console.log('MessengerService.sendDynamic...');

    return DynamoService.findDynamic(type)
      .then(dynamic => {
        if (!dynamic || !userId) return;

        const messages = Utils.isJson(dynamic.messages);

        if (!Array.isArray(messages) || messages.length === 0) {
          return;
        }

        return this.sendMessages(messages[Utils.rdmKey(messages)], userId);
      });
  },

  sendMsgArray: function (msgArr, userId) {
    console.log('MessengerService.sendMsgArray...');

    if (!userId) {
      return Bluebird.reject(new Error('userId was not supplied'));
    }

    const messages = Utils.isJson(msgArr);

    console.log('MSG_DELAY', MSG_DELAY);
    if (Array.isArray(messages) && messages.length > 0) {
      return Bluebird.each(messages, msg => Bluebird.delay(MSG_DELAY)
        .then(() => this.sendMessages(msg, userId)))
        .then(() => Bluebird.delay(MSG_DELAY));
    }

    return Bluebird.resolve();
  }
};
