"use strict";

var getOrfsFromSequence = require("./getOrfsFromSequence.js");
module.exports = function findOrfsInPlasmid(sequence, circular, minimumOrfSize, useAdditionalOrfStartCodons) {
  //tnr, we should do the parsing down of the orfs immediately after they're returned from this sequence
  // const orfs1Forward = eliminateCircularOrfsThatOverlapWithNonCircularOrfs(getOrfsFromSequence(0, doubleForwardSequence, minimumOrfSize, true), maxLength);
  var forwardOrfs = getOrfsFromSequence({
    sequence: sequence,
    minimumOrfSize: minimumOrfSize,
    forward: true,
    circular: circular,
    useAdditionalOrfStartCodons: useAdditionalOrfStartCodons
  });
  var reverseOrfs = getOrfsFromSequence({
    sequence: sequence,
    minimumOrfSize: minimumOrfSize,
    forward: false,
    circular: circular,
    useAdditionalOrfStartCodons: useAdditionalOrfStartCodons
  });
  return forwardOrfs.concat(reverseOrfs);
};