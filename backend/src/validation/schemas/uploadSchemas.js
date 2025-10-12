const { z } = require('zod');

const fileNameRegex = /^[A-Za-z0-9._\-]+$/u;

exports.createPresignSchema = z
  .object({
    fileName: z
      .string()
      .min(1, 'Dateiname wird benötigt')
      .max(255, 'Dateiname ist zu lang')
      .refine((value) => fileNameRegex.test(value), {
        message: 'Dateiname enthält ungültige Zeichen',
      }),
    fileType: z.string().min(1, 'Dateityp ist erforderlich'),
    fileSize: z.number().int().positive('Dateigröße muss positiv sein'),
    prefix: z
      .string()
      .max(120, 'Präfix ist zu lang')
      .optional()
      .transform((value) => (value && value.trim() ? value : undefined)),
  })
  .strict();
