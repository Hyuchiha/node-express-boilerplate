import validate from '../../../src/middlewares/validate';
import ApiError from '../../../src/utils/ApiError';
import httpStatus from 'http-status';
import Joi from 'joi';

describe('Validate middleware', () => {
  const mockNext = jest.fn();
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    mockNext.mockClear();
  });

  test('should call next with no error when schema is valid', () => {
    mockReq.body = { name: 'John' };

    const schema = {
      body: Joi.object({
        name: Joi.string().required(),
      }),
    };

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(); // no error
    expect(mockReq.body.name).toBe('John');
  });

  test('should call next with ApiError when validation fails', () => {
    mockReq.body = {};

    const schema = {
      body: Joi.object({
        name: Joi.string().required(),
      }),
    };

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(httpStatus.BAD_REQUEST);
    expect(error.message).toMatch(/"name" is required/);
  });

  test('should validate and mutate query params', () => {
    mockReq.query = { limit: '5' };

    const schema = {
      query: Joi.object({
        limit: Joi.number().integer().min(1).required(),
      }),
    };

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.query.limit).toBe(5); // type-cast by Joi
  });

  test('should validate route params and throw on invalid type', () => {
    mockReq.params = { id: 'abc' };

    const schema = {
      params: Joi.object({
        id: Joi.number().required(),
      }),
    };

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toMatch(/"id" must be a number/);
  });

  test('should validate and mutate all three sources', () => {
    mockReq.params = { id: '1' };
    mockReq.query = { page: '2' };
    mockReq.body = { email: 'test@example.com' };

    const schema = {
      params: Joi.object({
        id: Joi.number().required(),
      }),
      query: Joi.object({
        page: Joi.number().required(),
      }),
      body: Joi.object({
        email: Joi.string().email().required(),
      }),
    };

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.params.id).toBe(1);
    expect(mockReq.query.page).toBe(2);
    expect(mockReq.body.email).toBe('test@example.com');
  });

  test('should mutate req.params/query/body when values are provided', () => {
    const originalParams = {};
    const originalQuery = {};
    const originalBody = {};

    mockReq.params = originalParams;
    mockReq.query = originalQuery;
    mockReq.body = originalBody;

    const schema = {
      params: Joi.object({ id: Joi.number().required() }),
      query: Joi.object({ page: Joi.number().required() }),
      body: Joi.object({ total: Joi.number().required() }),
    };

    mockReq.params.id = '123';
    mockReq.query.page = '1';
    mockReq.body.total = '100.5';

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.params).toBe(originalParams);
    expect(mockReq.query).toBe(originalQuery);
    expect(mockReq.body).toBe(originalBody);
    expect(mockReq.params.id).toBe(123);
    expect(mockReq.query.page).toBe(1);
    expect(mockReq.body.total).toBe(100.5);
  });

  test('should trigger all Object.assign lines with transformed values', () => {
    mockReq.params = undefined;
    mockReq.query = undefined;
    mockReq.body = undefined;

    const schema = {
      params: Joi.object({
        id: Joi.number().required(),
      }),
      query: Joi.object({
        page: Joi.number().required(),
      }),
      body: Joi.object({
        price: Joi.number().required(),
      }),
    };

    mockReq = {
      params: undefined,
      query: undefined,
      body: undefined,
    };

    const reqInput = {
      params: { id: '10' },
      query: { page: '3' },
      body: { price: '99.99' },
    };

    // assign raw values before calling middleware
    mockReq.params = reqInput.params;
    mockReq.query = reqInput.query;
    mockReq.body = reqInput.body;

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.params.id).toBe(10);
    expect(mockReq.query.page).toBe(3);
    expect(mockReq.body.price).toBe(99.99);
  });
});
