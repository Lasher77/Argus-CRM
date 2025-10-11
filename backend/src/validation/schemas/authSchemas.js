const { z } = require('zod');

const loginSchema = z
  .object({
    username: z
      .string({ required_error: 'Benutzername oder E-Mail ist erforderlich.' })
      .trim()
      .min(1, 'Benutzername oder E-Mail ist erforderlich.'),
    password: z
      .string({ required_error: 'Passwort ist erforderlich.' })
      .min(1, 'Passwort ist erforderlich.')
  })
  .strict();

const refreshSchema = z
  .object({
    refreshToken: z
      .string({ required_error: 'Refresh Token ist erforderlich.' })
      .trim()
      .min(1, 'Refresh Token ist erforderlich.')
  })
  .strict();

const logoutSchema = refreshSchema;

module.exports = {
  loginSchema,
  refreshSchema,
  logoutSchema
};
