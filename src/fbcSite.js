export async function login(page) {

    try {
        await page.goto(process.env.SITE_URL, {
            waitUntil: 'networkidle2',
        });

        const inputs = await page.$$("input");

        await inputs[0].type(process.env.SITE_USERNAME);
        await inputs[1].type(process.env.SITE_PASSWORD);

        await page.click("button[key=login]");
        console.log("✅ Login successful");
    } catch (error) {
        console.error(error);
    }
}