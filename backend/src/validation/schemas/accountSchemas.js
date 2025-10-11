const { z } = require('zod');

const nonEmptyString = z.string().trim().min(1, 'Dieses Feld darf nicht leer sein.');

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

const optionalString = (max, message) =>
  z
    .preprocess(
      normalizeOptionalString,
      z.union([
        z.string().max(max, message || `Die maximale Länge beträgt ${max} Zeichen.`),
        z.null()
      ])
    )
    .optional();

const accountBaseSchema = z
  .object({
    name: nonEmptyString.max(255, 'Der Name darf maximal 255 Zeichen enthalten.'),
    address: optionalString(500, 'Die Adresse darf maximal 500 Zeichen enthalten.'),
    phone: optionalString(50, 'Die Telefonnummer darf maximal 50 Zeichen enthalten.'),
    email: z
      .preprocess(normalizeOptionalString, z.union([z.string().email('Die E-Mail-Adresse ist ungültig.'), z.null()]))
      .optional(),
    website: optionalString(255, 'Die Website darf maximal 255 Zeichen enthalten.'),
    tax_number: optionalString(100, 'Die Steuernummer darf maximal 100 Zeichen enthalten.'),
    notes: optionalString(2000, 'Die Notizen dürfen maximal 2000 Zeichen enthalten.')
  })
  .strict();

const createAccountSchema = accountBaseSchema;
const updateAccountSchema = accountBaseSchema;

module.exports = {
  createAccountSchema,
  updateAccountSchema
};
