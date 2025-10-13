const { renderTemplateString } = require('./handlebarsEngine');
const { buildMockData } = require('./templateMockData');

const baseStyles = `
  @page {
    size: A4;
    margin: 20mm;
  }

  body {
    margin: 0;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1f2933;
    font-size: 12pt;
    line-height: 1.5;
  }

  main {
    display: block;
    width: 100%;
  }

  header, footer {
    width: 100%;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 8px;
    border-bottom: 1px solid #d2d6dc;
    text-align: left;
  }
`;

const mergeDeep = (base, patch) => {
  if (patch == null || typeof patch !== 'object') {
    return base;
  }

  const result = { ...base };
  Object.keys(patch).forEach((key) => {
    const baseValue = base[key];
    const patchValue = patch[key];

    if (Array.isArray(baseValue) && Array.isArray(patchValue)) {
      result[key] = patchValue;
      return;
    }

    if (baseValue && typeof baseValue === 'object' && patchValue && typeof patchValue === 'object') {
      result[key] = mergeDeep(baseValue, patchValue);
      return;
    }

    result[key] = patchValue;
  });

  return result;
};

const buildContext = (data = {}) => {
  const mockData = buildMockData();
  const context = mergeDeep(mockData, data);
  context.page = data.page ?? mockData.page ?? 1;
  context.totalPages = data.totalPages ?? mockData.totalPages ?? 1;
  if (!context.today) {
    context.today = mockData.today;
  }
  return context;
};

const normalizeTemplate = (template) => ({
  htmlContent: template.htmlContent || template.html || '',
  cssContent: template.cssContent || template.css || '',
  headerHtml: template.headerHtml || template.header || '',
  footerHtml: template.footerHtml || template.footer || ''
});

const resolveTemplateSections = (template, data = {}) => {
  const context = buildContext(data);
  const normalized = normalizeTemplate(template);

  const bodyHtml = renderTemplateString(normalized.htmlContent, context);
  const headerHtml = renderTemplateString(normalized.headerHtml, context);
  const footerHtml = renderTemplateString(normalized.footerHtml, context);

  return {
    context,
    bodyHtml,
    headerHtml,
    footerHtml,
    css: `${baseStyles}\n${normalized.cssContent || ''}`
  };
};

const buildInlineHtmlDocument = ({ bodyHtml, headerHtml, footerHtml, css }) => `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>Template Vorschau</title>
    <style>
      ${css}
      body { padding: 24px; box-sizing: border-box; }
      header, footer { margin-bottom: 16px; }
      footer { margin-top: 32px; }
    </style>
  </head>
  <body>
    <header>${headerHtml || ''}</header>
    <main>${bodyHtml}</main>
    <footer>${footerHtml || ''}</footer>
  </body>
</html>`;

const replacePageTokens = (html) =>
  html
    .replace(/{{\s*page\s*}}/gu, '<span class="pageNumber"></span>')
    .replace(/{{\s*totalPages\s*}}/gu, '<span class="totalPages"></span>');

const buildPdfPayload = (template, data = {}) => {
  const sections = resolveTemplateSections(template, data);
  return {
    html: `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${sections.css}</style></head><body>${sections.bodyHtml}</body></html>`,
    header: replacePageTokens(sections.headerHtml || ''),
    footer: replacePageTokens(sections.footerHtml || '')
  };
};

module.exports = {
  baseStyles,
  buildContext,
  resolveTemplateSections,
  buildInlineHtmlDocument,
  buildPdfPayload
};
