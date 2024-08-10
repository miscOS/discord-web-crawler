
# Discord-web-crawler

This web crawler based on puppeteer is designed to run in an docker environment.

## Installation

Clone the repository...

```bash
  git clone https://github.com/miscOS/discord-web-crawler.git
```
...and move to the directory to run the compose file. You might want to consider changing some configuration first.

```bash
  cd discord-web-crawler
  docker-compose up
```

## Configuration

The configuration is stored in `data/config.json`. The included example will give you an idead of what the configuration should look like. It is easiest to copy it and adapt it to your own requirements.

```bash
  cp data/example.config.json data/config.json
```

## Support

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K2OQ0GL)