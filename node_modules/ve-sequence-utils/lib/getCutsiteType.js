"use strict";

module.exports = function getCutsiteType(restrictionEnzyme) {
  var topSnipOffset = restrictionEnzyme.topSnipOffset,
      bottomSnipOffset = restrictionEnzyme.bottomSnipOffset;

  if (topSnipOffset === bottomSnipOffset) {
    return "blunt";
  } else if (topSnipOffset < bottomSnipOffset) {
    return "5' overhang";
  } else {
    return "3' overhang";
  }
};