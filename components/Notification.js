const { htm } = require('@zeit/integration-utils');

/*

Possible value for type : 

- error
- warn
- message
- success

*/

module.exports = (type, message) =>
  htm`<Notice type=${type}>${message}</Notice>`;
