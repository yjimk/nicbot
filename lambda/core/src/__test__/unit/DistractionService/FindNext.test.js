const MainFixture = require('../../fixtures/MainFixture');

const DistractionService = require('../../../service/DistractionService');

const Bluebird = require('bluebird');
const sinon = require('sinon');
const faker = require('faker');

let sandbox;

describe('#DistractionService.findNext', () => {
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => (sandbox.restore()));

  describe('#Business Logic', () => {
    it('should succeed and return a valid response object', () => {
      const completedDistractions = MainFixture.newCompletedArray();
      const distractions = [ MainFixture.newDistractionObj() ];

      return Bluebird.resolve()
        .then(() => DistractionService.findNext(completedDistractions, distractions))
        .then(response => MainFixture.validate(response));
    });

    it('should succeed with a longer array of distractions and return a valid response object', () => {
      const completedDistractions = MainFixture.newCompletedArray();
      const distractions = [
        MainFixture.newDistractionObj(),
        MainFixture.newDistractionObj(),
        MainFixture.newDistractionObj(),
        MainFixture.newDistractionObj()
      ];

      return Bluebird.resolve()
        .then(() => DistractionService.findNext(completedDistractions, distractions))
        .then(response => MainFixture.validate(response));
    });

    it('should still return an object, even if all distractions have been marked completed once', () => {
      const completeIntents = [ faker.random.word(), faker.random.word() ];
      const completedDistractions = JSON.stringify(completeIntents);
      const distractions = [
        MainFixture.newDistractionObj({ intentKey: completeIntents[0] }),
        MainFixture.newDistractionObj({ intentKey: completeIntents[1] })
      ];

      return Bluebird.resolve()
        .then(() => DistractionService.findNext(completedDistractions, distractions))
        .then(response => {
          expect(response.clearCompleted).to.equal(true);
          return MainFixture.validate(response);
        });
    });

    it('should return the only distraction that hasn\'t been completed yet', () => {
      const foundDistraction = MainFixture.newDistractionObj();
      const completeIntents = [ faker.random.word(), faker.random.word() ];
      const completedDistractions = MainFixture.newCompletedArray(completeIntents);
      const distractions = [
        MainFixture.newDistractionObj({ intentKey: completeIntents[0] }),
        MainFixture.newDistractionObj({ intentKey: completeIntents[1] }),
        foundDistraction
      ];

      return Bluebird.resolve()
        .then(() => DistractionService.findNext(completedDistractions, distractions))
        .then(response => {
          expect(response.clearCompleted).to.equal(undefined);
          expect(response.intentName).to.equal(foundDistraction.intentName);
          expect(response.intentKey).to.equal(foundDistraction.intentKey);
          expect(response.slots).to.eql(foundDistraction.slots);
          expect(response.slotToElicit).to.equal(foundDistraction.slotToElicit);
          return MainFixture.validate(response);
        });
    });
  });
});
