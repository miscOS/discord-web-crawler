
import Cron from 'node-cron';
import * as dotenv from 'dotenv';

import { NewsManager, Feed, Source, Colors } from './news.js';
import { SearchPattern } from './searchParser.js';
import config from './data/config.json';

// Environment
dotenv.config();

// JSON Mapping / LOAD config.json
let newsConfig: Feed[] = [];

try {
    newsConfig = config.feeds.map((feed: any) => {
        let sources: Source[] = feed.sources.map((source: any) => {
            let searchPattern: SearchPattern = new SearchPattern(source.searchPattern.section, source.searchPattern.title, source.searchPattern.category, source.searchPattern.description, source.searchPattern.image, source.searchPattern.url);
            return new Source(source.url, searchPattern);
        })
        let colors: Colors = new Colors(feed.colors.internal, feed.colors.external);
        return new Feed(feed.title, feed.webhook, colors, sources, feed.logfile, feed.retention);
    });
} catch (error) {
    console.log(`[config] failed to map config.json`);
    console.log(error);
}

// News Manager
function update() {
    try {
        let newsManager: NewsManager = new NewsManager(newsConfig, process.env.ENVIRONMENT);
        console.log(`[update] running update with ${newsManager.getFeeds().length} feeds`);

        newsManager.update();
    } catch (error) {
        console.log(error);
    }
}

//update();
Cron.schedule('*/5 * * * *', update);