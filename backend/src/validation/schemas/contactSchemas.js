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

const contactBaseSchema = z
  .object({
    first_name: z
      .string({ required_error: 'Der Vorname ist erforderlich.' })
      .trim()
      .min(1, 'Der Vorname darf nicht leer sein.')
      .max(255, 'Der Vorname darf maximal 255 Zeichen enthalten.'),
    last_name: z
      .string({ required_error: 'Der Nachname ist erforderlich.' })
      .trim()
      .min(1, 'Der Nachname darf nicht leer sein.')
      .max(255, 'Der Nachname darf maximal 255 Zeichen enthalten.'),
    position: optionalString(255),
    email: z
      .preprocess(
        normalizeOptionalString,
        z.union([z.string().email('Die E-Mail-Adresse ist ungültig.'), z.null()])
      )
      .optional(),
    phone: optionalString(50),
    mobile: optionalString(50),
    address: optionalString(500),
    birthday: z
      .preprocess(normalizeOptionalString, z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Das Geburtsdatum muss im Format YYYY-MM-DD vorliegen.'), z.null()]))
      .optional(),
    is_primary_contact: z.coerce.boolean().optional(),
    account_id: z.coerce.number({ invalid_type_error: 'Die Account-ID muss eine Zahl sein.' }).int().positive(),
    notes: optionalString(2000)
  })
  .strict();

const createContactSchema = contactBaseSchema;
const updateContactSchema = contactBaseSchema.partial({ account_id: true }).extend({
  account_id: z
    .coerce.number({ invalid_type_error: 'Die Account-ID muss eine Zahl sein.' })
    .int()
    .positive()
    .optional()
});

module.exports = {
  createContactSchema,
  updateContactSchema
};
