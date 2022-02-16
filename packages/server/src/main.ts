import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import bodyParser from 'body-parser';
import xmlBodyParser from 'body-parser-xml';

xmlBodyParser(bodyParser);

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule);
  const express: Express = app.getHttpAdapter().getInstance();
  express.use(
    bodyParser.xml({
      limit: '1mb',
      xmlParseOptions: {
        explicitArray: false,
        normalize: false,
      },
    }),
  );
  app.enableCors();
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  const configService: ConfigService = app.get(ConfigService);

  const port = configService.get('server.port');
  await app.listen(port, '0.0.0.0');
  logger.log(`server started listening at 0.0.0.0:${port}`);
}

bootstrap();