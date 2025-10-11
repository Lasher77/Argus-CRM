const { z } = require('zod');

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const optionalString = (maxLength) =>
  z
    .preprocess(
      normalizeOptionalString,
      z.union([
        z.string().max(maxLength, `Die maximale Länge beträgt ${maxLength} Zeichen.`),
        z.null()
      ])
    )
    .optional();

const propertyBaseSchema = z
  .object({
    name: z
      .string({ required_error: 'Der Name ist erforderlich.' })
      .trim()
      .min(1, 'Der Name darf nicht leer sein.')
      .max(255, 'Der Name darf maximal 255 Zeichen enthalten.'),
    address: optionalString(500),
    city: optionalString(255),
    postal_code: optionalString(20),
    country: optionalString(255),
    account_id: z.coerce.number({ invalid_type_error: 'Die Account-ID muss eine Zahl sein.' }).int().positive(),
    contact_id: z
      .union([
        z.coerce.number({ invalid_type_error: 'Die Kontakt-ID muss eine Zahl sein.' }).int().positive(),
        z.null(),
        z.undefined(),
        z.literal('').transform(() => null)
      ])
      .optional(),
    notes: optionalString(2000),
    alt_invoice_address: optionalString(500)
  })
  .strict();

const createPropertySchema = propertyBaseSchema;
const updatePropertySchema = propertyBaseSchema.partial({ account_id: true, name: false }).extend({
  name: propertyBaseSchema.shape.name,
  account_id: propertyBaseSchema.shape.account_id.optional()
});

module.exports = {
  createPropertySchema,
  updatePropertySchema
};
