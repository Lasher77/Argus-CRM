const { z } = require('zod');

const positiveInteger = (field) =>
  z
    .coerce
    .number({ invalid_type_error: `${field} muss eine Zahl sein.` })
    .int(`${field} muss eine ganze Zahl sein.`)
    .positive(`${field} muss größer als 0 sein.`);

const idParamSchema = z.object({
  id: positiveInteger('Die ID')
});

const accountIdParamSchema = z.object({
  accountId: positiveInteger('Die Account-ID')
});

module.exports = {
  idParamSchema,
  accountIdParamSchema
};
