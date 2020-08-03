# chat-operator

## Description

`chat-operator` is a server that helps route messages between chat service providers (Slack, Wechat, etc) to Chatbot services (Rasa, Bot Framework, etc) or even to each other.

## Support Matrix

Currently support:

- Wechat Public Account / Mini-App Chat
- Rasa

Planning to support:

- Wechat for Work (Greetings API)
- Wechaty
- Slack
- Telegram
- a generic WebSocket service spun up to accept custom website / app chat widgets.

## Installation

```bash
docker-compose up -d

npm install
```

## Configuration

Please copy `example.env` to `.env.development` and fill in the environment variables shown where applicable. Please also see `src/config` and check out any configuration variables you would like to update.

Also please check [the database seeder README](src/seeds/README.md).

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

<!--
## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
-->

## License

[MIT](LICENSE).
