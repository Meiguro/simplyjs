/**
 * This file provides an easy way to switch the actual implementation used by all the
 * ui objects.
 *
 * simply.impl provides the actual communication layer to the hardware.
 */

var simply = {};

// Override this with the actual implementation you want to use.
simply.impl = undefined;

module.exports = simply;
