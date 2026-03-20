module.exports = {
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/test.pdf' }),
  printAsync: jest.fn().mockResolvedValue(undefined),
};
