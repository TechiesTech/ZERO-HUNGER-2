import AppError from '../utils/appError.js';

const validate = (schema, source = 'body') => (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    if (error) {
        const errors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
        }));
        return next(new AppError('Validation failed', 400, errors));
    }

    if (source === 'query') {
        req.validatedQuery = value;
    } else {
        req[source] = value;
    }

    return next();
};

export default validate;