import * as cheerio from 'cheerio'
import { News } from './news'

export class SearchParser {

    getNews(html: string, searchPattern: SearchPattern, source: URL): News[] {

        let news: News[] = [];
        let $: cheerio.CheerioAPI = cheerio.load(html);

        $(searchPattern.getSection()).each( (i: number, element: cheerio.AnyNode) => {

            let category: string = ($(element).find(searchPattern.getCategory()).text()) ?? undefined;
            let url: string = ($(element).is('a')) ? $(element).attr('href') : $(element).find(searchPattern.getURL()).attr('href');

            news.push(new News(
                $(element).find(searchPattern.getTitle()).text(),
                category,
                $(element).find(searchPattern.getDescription()).text(),
                new URL($(element).find(searchPattern.getImage()).attr('src')),
                new URL(url, source)
            ))
        })
        return news;
    }
}

export class SearchPattern {
    private section: string;
    private title: string;
    private category: string;
    private desciption: string;
    private image: string;
    private url?: string;

    constructor(section: string, title: string, category: string, desciption: string, image: string, url?: string) {
        this.section = section;
        this.title = title;
        this.category = category;
        this.desciption = desciption;
        this.image = image;
        this.url = url;
    }

    getSection(): string {
        return this.section;
    }

    getTitle(): string {
        return this.title;
    }

    getCategory(): string {
        return this.category;
    }

    getDescription(): string {
        return this.desciption;
    }

    getImage(): string {
        return this.image;
    }

    getURL(): string {
        return this.url;
    }
}