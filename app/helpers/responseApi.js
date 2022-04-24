/**
 * @desc    This file contain Success and Error response for sending to client / user
 * @author  Malith Dulan Kuruwita
 * @since   2022
 */

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
exports.success = (message, data, statusCode) => {
  return {
    message,
    error: false,
    code: statusCode,
    data,
  };
};

/**
 * @desc    Send any error response
 *
 * @param   {string} errorResult
 * @param   {number} statusCode
 */
exports.error = (message, data, statusCode) => {
  // List of common HTTP request code
  const codes = [200, 201, 400, 401, 404, 403, 422, 500];

  // Get matched code
  const findCode = codes.find((code) => code == statusCode);

  if (!findCode) statusCode = 500;
  else statusCode = findCode;

  return {
    message,
    error: true,
    code: statusCode,
    data,
  };
};

/**
 * @desc    Send any validation response
 *
 * @param   {object | array} errors
 */
exports.validation = (data) => {
  return {
    message: "Validation errors",
    error: true,
    code: 422,
    data,
  };
};
