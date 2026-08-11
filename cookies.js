import {promises as fs} from 'fs';
import dotenv from 'dotenv';
import {testConnect} from "./src/browser.js";
import {login} from "./src/fbcSite.js";
import sleep from "./supports/sleep.js";

dotenv.config();

(async () => {
    const browser = await testConnect();
    const page = await browser.newPage();

    await login(page)

    console.log('Opening Sport tab...');
    await page.locator('#tabasc').click();
    await sleep(10000);

    console.log('Navigating to site...');
    const topFrame = await page.$$('.ScreenSize iframe#topFrame');
    if (!topFrame) return;
    const siteUrl = process.env.SITE_BASE_URL;
    if (!siteUrl) {
        throw new Error('SITE_BASE_URL is missing from .env');
    }

    await page.goto(process.env.SITE_BASE_URL, {waitUntil: "networkidle2"});
    console.log('Site loaded.');

    await sleep(10000);
    const cookies = await page.cookies();

    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));

    await browser.close();
})();