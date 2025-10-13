const Handlebars = require('handlebars');
const dayjs = require('dayjs');

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
});

Handlebars.registerHelper('date', (value, format = 'DD.MM.YYYY') => {
  if (!value) {
    return '';
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return value;
  }

  return parsed.format(format);
});

Handlebars.registerHelper('currency', (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value ?? '';
  }

  return currencyFormatter.format(numeric);
});

Handlebars.registerHelper('multiply', (a, b) => {
  const result = Number(a) * Number(b);
  if (Number.isNaN(result)) {
    return '';
  }

  return result;
});

const renderTemplateString = (template, data = {}) => {
  if (!template) {
    return '';
  }

  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(data);
};

module.exports = {
  Handlebars,
  renderTemplateString
};
