const success = (message, data = null) => {
  return {
    success: true,
    message: message,
    data: data,
  };
};

const failure = (message, error = null) => {
  return {
    success: false,
    message: message,
    error: error,
  };
};

const generateRandomCode = (length) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

module.exports = { success, failure, generateRandomCode };
