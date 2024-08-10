
import puppeteer, { Browser, Page } from 'puppeteer';

class WebCrwaler {
    private browser: Browser
    private environment: string;

    constructor(environment?: string) {
        this.browser = null;
        this.environment = environment;
    }

    async open() {
        await this.browser?.close();

        if(this.environment == 'DOCKER'){
            this.browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: [
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                ],
                headless: true
            });
        } else {
            this.browser = await puppeteer.launch();
        }        
    }

    async close() {
        await this.browser?.close();
    }

    async fetch(url: URL): Promise<string> {

        if(url) {
            let page: Page = await this.browser.newPage();

            await page.goto(url.href);
            await page.waitForNetworkIdle({idleTime: 5000});

            let content: string = await page.content();
            page.close();

            return content;
        }
        return null;
    }
}

export default WebCrwaler