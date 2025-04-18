'use strict';

var getAminoAcidStringFromSequenceString = require('./getAminoAcidStringFromSequenceString');
var getReverseComplementSequenceString = require('./getReverseComplementSequenceString');

module.exports = function getReverseComplementAminoAcidStringFromSequenceString(sequenceString) {
  return getAminoAcidStringFromSequenceString(getReverseComplementSequenceString(sequenceString));
};