const puppeteer = require('puppeteer');
const { ApiError } = require('./apiError');

const DEFAULT_MARGIN = {
  top: '20mm',
  bottom: '20mm',
  left: '15mm',
  right: '15mm'
};

const launchBrowser = async () => {
  try {
    return await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (error) {
    throw new ApiError(500, 'PDF Renderer konnte nicht gestartet werden', {
      code: 'PDF_RENDERER_UNAVAILABLE',
      details: error.message
    });
  }
};

const renderHtmlToPdfBuffer = async (html, { headerTemplate, footerTemplate, margin } = {}) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: margin || DEFAULT_MARGIN,
      displayHeaderFooter: Boolean(headerTemplate || footerTemplate),
      headerTemplate: headerTemplate || '',
      footerTemplate: footerTemplate || ''
    });
    await browser.close();
    return pdf;
  } catch (error) {
    await browser.close();
    throw new ApiError(500, 'PDF konnte nicht generiert werden', {
      code: 'PDF_RENDER_FAILED',
      details: error.message
    });
  }
};

module.exports = {
  renderHtmlToPdfBuffer
};
