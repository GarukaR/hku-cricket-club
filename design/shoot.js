const { chromium } = require('playwright-core');
const path = require('path');

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const shots = [
  ['d1-matchday.html',  'd1-desktop.png', 1440, 'light'],
  ['d1-matchday.html',  'd1-mobile.png',   390, 'light'],
  ['d2-since1913.html', 'd2-desktop.png', 1440, 'light'],
  ['d2-since1913.html', 'd2-mobile.png',   390, 'light'],
  ['d3-innings.html',   'd3-light.png',   1440, 'light'],
  ['d3-innings.html',   'd3-dark.png',    1440, 'dark'],
  ['d3-innings.html',   'd3-mobile.png',   390, 'light'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [file, out, width, scheme] of shots) {
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto('file://' + path.resolve(__dirname, file));
    await page.waitForTimeout(400);

    // does the page scroll sideways? it must not.
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);

    await page.screenshot({ path: out, fullPage: true });
    console.log(`${out.padEnd(16)} overflow=${overflow}px  ${errs.length ? 'JS ERRORS: ' + errs.join('; ') : 'no js errors'}`);
    await ctx.close();
  }
  await browser.close();
})();
