import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPkg = path.resolve(__dirname, '../../server/package.json');
const require = createRequire(serverPkg);
const puppeteer = require('puppeteer');

const FILES = [
  'ayala-login-dashboard.html',
  'miriam-new-wigs.html',
  'merimi-repairs.html',
  'chani-qa-wash-scan.html',
];

const pdfDir = path.join(__dirname, 'pdf');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

async function launchBrowser() {
  const executablePath = findBrowser();
  const options = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (executablePath) {
    options.executablePath = executablePath;
  }
  return puppeteer.launch(options);
}

async function generatePdf(browser, htmlFile) {
  const htmlPath = path.join(__dirname, htmlFile);
  const pdfPath = path.join(pdfDir, htmlFile.replace('.html', '.pdf'));
  const fileUrl = pathToFileURL(htmlPath).href;

  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  });
  await page.close();
  console.log(`✓ ${path.basename(pdfPath)}`);
}

async function main() {
  console.log('מייצר PDFים מתוך דפי HTML...\n');
  const browser = await launchBrowser();

  try {
    for (const file of FILES) {
      await generatePdf(browser, file);
    }
    console.log(`\nהושלם! הקבצים נשמרו ב:\n${pdfDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('שגיאה ביצירת PDF:', err);
  process.exit(1);
});
