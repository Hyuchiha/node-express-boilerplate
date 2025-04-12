import Joi from 'joi';
import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = {};

  ['params', 'query', 'body'].forEach((key) => {
    if (validSchema[key]) {
      object[key] = req[key] ?? {};
    }
  });

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  // Instead of reassigning, safely mutate the existing objects
  if (value.params) Object.assign(req.params ?? {}, value.params);
  if (value.query) Object.assign(req.query ?? {}, value.query);
  if (value.body) Object.assign(req.body ?? {}, value.body);

  return next();
};

export default validate;
