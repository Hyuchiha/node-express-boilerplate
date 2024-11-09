import Joi from 'joi';

const getMediaFile = {
  params: Joi.object().keys({
    filename: Joi.string(),
  }),
};

export default { getMediaFile };
