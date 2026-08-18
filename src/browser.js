import path from "path";
import {fileURLToPath} from "url";
import {connect as puppeteerConnect} from "puppeteer-real-browser";
import puppeteer from "puppeteer";
import {promises as fs} from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function realConnect() {
    const userDataDir = path.resolve(__dirname, "../tmp");

    return await puppeteerConnect({
        args: [],
        customConfig: {userDataDir},
        connectOption: {defaultViewport: null},
        disableXvfb: false,
        headless: false,
        ignoreAllFlags: false,
        turnstile: true,
    });
}

export async function testConnect() {
    return  await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 86400_000,
    });
}


export async function injectCookies(browser) {
    const cookiesPath = path.resolve(__dirname, '../cookies.json');
    const cookiesString = await fs.readFile(cookiesPath, 'utf8');
    const cookies = JSON.parse(cookiesString);

    await browser.setCookie(...cookies);

    return browser;
}