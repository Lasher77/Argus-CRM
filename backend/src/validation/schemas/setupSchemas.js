const { z } = require('zod');

const setupSchema = z
  .object({
    email: z
      .string({ required_error: 'E-Mail ist erforderlich.' })
      .trim()
      .min(1, 'E-Mail ist erforderlich.')
      .email('Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
    password: z
      .string({ required_error: 'Passwort ist erforderlich.' })
      .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.'),
    companyName: z
      .string({ required_error: 'Firmenname ist erforderlich.' })
      .trim()
      .min(1, 'Firmenname ist erforderlich.')
  })
  .strict();

module.exports = {
  setupSchema
};
