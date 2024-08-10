import WebCrwaler from "./webcrawler";
import { SearchParser, SearchPattern } from "./searchParser";

import fs from 'fs';
import path from 'path';

export class NewsManager {
    private feeds: Feed[];
    private parser: SearchParser;
    private webCrawler: WebCrwaler;

    constructor(feeds: Feed[], environment?: string) {
        this.feeds = feeds;
        this.parser = new SearchParser();
        this.webCrawler = new WebCrwaler(environment);
    }

    update() {
        this.webCrawler.open().then(async () => {
            await Promise.all(this.feeds.map( async (feed) => {
                await Promise.all(feed.getSources().map( async (source) => {
                    await this.webCrawler.fetch(source.getURL()).then( async (content) => {
                        let newsArray: News[] = (content && source.getSearchPattern()) ? this.parser.getNews(content, source.getSearchPattern(), source.getURL()) : [];
                        let newsArrayFiltered: News[] = feed.filter(newsArray);
                        
                        console.log(`[update] found ${newsArrayFiltered.length} new entries (total ${newsArray.length}) in ${source.getURL()}`);

                        for (let news of newsArrayFiltered.reverse()) {
                            await feed.publish(news);
                        }
                    })
                }))
            }))
            this.webCrawler.close();
        });
    }

    getFeeds(): Feed[] {
        return this.feeds;
    }
}

export class Feed {
    private title: string;
    private webhook: URL;
    private colors: Colors;
    private sources: Source[];
    private posted: News[];
    private logfile: string;
    private retention: number;

    constructor(title: string, webhook: string, colors: Colors, sources: Source[], logfile: string, retention?: number) {
        this.title = title;
        this.colors = colors;
        this.sources = sources;
        this.webhook = new URL(webhook);
        this.logfile = path.join(__dirname, '..', 'data', 'log_' + logfile + '.json');
        this.retention = retention ?? 25;

        this.load();
    }

    load() {
        try {
            this.posted = JSON.parse(fs.readFileSync(this.logfile, {encoding: 'utf8'})).map((news: any) => {
                return new News(
                    news.title,
                    news.category,
                    news.desciption,
                    new URL(news.image),
                    new URL(news.url)
                )
            });
        }
        catch (error) {
            this.posted = [];
            console.log(`Failed to load log file ${this.logfile}`);
            console.log(error);
        }
    }

    save() {
        try {
            fs.writeFileSync(this.logfile, JSON.stringify(this.posted), { encoding: 'utf8', flag: 'w' });
        }
        catch (error) {
            console.log(`Failed to save log file ${this.logfile}`);
            console.log(error)
        }
    }

    filter(news: News[]): News[] {
        return news.filter( element => !this.posted.some( send => element.getTitle() === send.getTitle() && element.getURL() === send.getURL()));
    }

    async publish(news: News) {        
        let flags: number = 1 << 12 // Surpress Notifications
        let color: number = news.isExternal(this.sources) ? this.colors.getExternal() : this.colors.getInternal();
        let content: string = (news.getCategory()) ? '***' + news.getCategory() + '*** ' : '';
        content += '*' + news.getURL() + '*';

        fetch(this.webhook + "?" + new URLSearchParams({wait: "true"}).toString(), {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'miscos/discord-web-crawler'
            },
            body: JSON.stringify({
                content,
                embeds: [
                    {
                        "type": "rich",
                        "title": news.getTitle(),
                        "description": news.getDescription(),
                        color,
                        "image": {
                            "url": news.getImage(),
                            "height": 0,
                            "width": 0
                        },
                        "url": news.getURL()
                    }
                ],
                flags,
                username: this.title
            })
        }).then((response) => {
            if (response.status == 200) this.success(news);
            console.log(`[response] ${response.status}: ${response.statusText} | ${this.title} | ${news.getTitle()}`);
        }).catch((error) => console.log(error) );
    }

    success(news: News) {
        if (this.posted.push(news) > this.retention)
            this.posted.shift();

        this.save();
    }

    getSources(): Source[] {
        return this.sources;
    }
}

export class Colors {
    private internal: number;
    private external: number;

    constructor(internal: string, external: string){
        this.internal = parseInt(internal, 16);
        this.external = parseInt(external, 16);
    }

    getInternal(): number {
        return this.internal;
    }

    getExternal(): number {
        return this.external;
    }
}

export class Source {
    private url?: URL;
    private searchPattern?: SearchPattern;

    constructor(url?: string, searchPattern?: SearchPattern) {
        this.url = url ? new URL(url) : undefined;
        this.searchPattern = searchPattern;
    }

    getSearchPattern(): SearchPattern {
        return this.searchPattern;
    }

    getURL(): URL {
        return this.url;
    }
}

export class News {
    private title?: string;
    private category?: string;
    private description?: string;
    private image?: URL;
    private url?: URL;

    constructor(title?: string, category?: string, description?: string, image?: URL, url?: URL) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.image = image;
        this.url = url;
    }

    isExternal(sources: Source[]): boolean {
        for (let source of sources) {
            if(source.getURL().origin == this.url.origin) return false;
        }
        return true;
    }

    getTitle(): string {
        return this.title;
    }

    getCategory(): string {
        return this.category;
    }

    getDescription(): string {
        return this.description;
    }

    getImage(): string {
        return this.image.origin + this.image.pathname
    }

    getURL(): string {
        return this.url.href;
    }
}

export default NewsManager