exports.sendErrorMessage = (message, code = 400) => {
  return {
    code, message: `${message || 'Bad Request'}`
  }
}

exports.sendSuccessMessage = (message, code = 200) => {
  return {
    code: `${code}`, message
  }
}