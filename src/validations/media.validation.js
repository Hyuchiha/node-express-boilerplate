const Joi = require('joi');

const getMediaFile = {
  params: Joi.object().keys({
    filename: Joi.string(),
  }),
};

module.exports = {
  getMediaFile,
};
