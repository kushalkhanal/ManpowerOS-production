export const validate = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ message: messages });
    }

    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ message: messages });
    }

    next();
  };
};