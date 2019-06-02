const { htm } = require('@zeit/integration-utils');

const averageOf = (arr, key) => {
  const filteredArr = arr.filter(elt => elt[key] !== undefined);

  return Math.round(
    filteredArr.reduce((prev, next) => prev + next[key], 0) /
      Math.max(filteredArr.length, 1)
  );
};

module.exports = (arr, key, text, preffix) =>
  htm`<Box display="flex" flexDirection="column" borderRadius="10px" border="1px solid #eaeaea" background="#fff" padding="10px" width="23%" height="150px" textAlign="center" justifyContent="center" alignItems="center" margin="20px 0"><H1>${averageOf(
    arr,
    key
  )}${preffix}</H1><H2>${text}</H2></Box>`;
