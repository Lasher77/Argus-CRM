const { z } = require('zod');

const canvasSchema = z
  .object({
    width: z.number().min(100).max(2000).default(595),
    height: z.number().min(100).max(3000).default(842)
  })
  .partial();

const elementSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  content: z.any().optional(),
  style: z.record(z.any()).optional(),
  data: z.record(z.any()).optional()
});

const layoutSchema = z
  .object({
    canvas: canvasSchema.optional(),
    elements: z.array(elementSchema).default([])
  })
  .partial();

const metadataSchema = z.record(z.any());

const baseTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['invoice', 'offer', 'custom']).default('invoice'),
  htmlContent: z.string().default(''),
  cssContent: z.string().default(''),
  headerHtml: z.string().default(''),
  footerHtml: z.string().default(''),
  layout: layoutSchema.optional(),
  versionLabel: z.string().optional().nullable(),
  metadata: metadataSchema.optional()
});

const templatePayloadSchema = baseTemplateSchema;

const templateUpdateSchema = baseTemplateSchema;

const renderRequestSchema = z.object({
  data: z.record(z.any()).optional().default({})
});

const previewTemplateSchema = z.object({
  template: baseTemplateSchema,
  data: z.record(z.any()).optional()
});

module.exports = {
  templatePayloadSchema,
  templateUpdateSchema,
  renderRequestSchema,
  previewTemplateSchema
};
