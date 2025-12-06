const validator = require('validator');

const validateUserInput = (user) => {
  const errors = {};
  if (!user.username || !validator.isLength(user.username, { min: 3, max: 100 })) {
    errors.username = 'Username must be 3-100 characters';
  }
  if (!user.email || !validator.isEmail(user.email)) {
    errors.email = 'Invalid email address';
  }
  if (!user.password || !validator.isLength(user.password, { min: 8 })) {
    errors.password = 'Password must be at least 8 characters';
  }
  return errors;
};

const validateCaseInput = (caseData) => {
  const errors = {};
  if (!caseData.case_number || caseData.case_number.trim() === '') {
    errors.case_number = 'Case number is required';
  }
  if (!caseData.title || !validator.isLength(caseData.title, { min: 5 })) {
    errors.title = 'Title must be at least 5 characters';
  }
  if (caseData.assigned_to && !Number.isInteger(caseData.assigned_to)) {
    errors.assigned_to = 'Invalid user ID';
  }
  return errors;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input);
  }
  return input;
};

module.exports = { validateUserInput, validateCaseInput, sanitizeInput };
