const { z } = require('zod');

const nameSchema = z
  .string({ required_error: 'Dieses Feld ist erforderlich.' })
  .trim()
  .min(1, 'Dieses Feld darf nicht leer sein.')
  .max(255, 'Die maximale Länge beträgt 255 Zeichen.');

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

const optionalString = (max) =>
  z
    .preprocess(
      normalizeOptionalString,
      z.union([z.string().max(max, `Die maximale Länge beträgt ${max} Zeichen.`), z.null()])
    )
    .optional();

const employeeBaseSchema = z
  .object({
    first_name: nameSchema,
    last_name: nameSchema,
    email: z
      .preprocess(
        normalizeOptionalString,
        z.union([z.string().email('Die E-Mail-Adresse ist ungültig.'), z.null()])
      )
      .optional(),
    phone: optionalString(50),
    role: optionalString(100),
    is_field_worker: z.coerce.boolean().optional(),
    color: optionalString(50)
  })
  .strict();

const createEmployeeSchema = employeeBaseSchema;
const updateEmployeeSchema = employeeBaseSchema;

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema
};
