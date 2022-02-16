import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { of, from, zip, interval } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import fetch from 'node-fetch';

import { plainToInstance } from '@senses-chat/operator-common';
import { PrismaService } from '@senses-chat/operator-database';

import { RasaResponsePayload, RasaWebhookPayload } from './models';
import { SendRasaMessageEvent } from './events';
import { NewRasaMessageCommand } from './commands';

@Injectable()
export class RasaService {
  private readonly logger = new Logger(RasaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  public async sendMessage(event: SendRasaMessageEvent): Promise<void> {
    const rasaServer = await this.prisma.rasaServer.findFirst({
      where: {
        name: event.namespace,
        isActive: true,
      },
    });

    if (!rasaServer) {
      const message = `rasa server ${event.namespace} not found or inactive or invalid configuration`;
      this.logger.error(message);
      throw new Error(message);
    }

    const payload: RasaWebhookPayload = {
      sender: event.sender,
      message: event.message,
    };

    this.logger.debug(
      `send rasa message ${JSON.stringify(payload)} to ${JSON.stringify(
        rasaServer,
      )}`,
    );

    return new Promise((resolve, reject) => {
      of(rasaServer)
        .pipe(
          tap((rasaServer) => this.logger.verbose(JSON.stringify(rasaServer))),
          concatMap((rasaServer) =>
            from(
              fetch(rasaServer.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              }),
            ),
          ),
          concatMap((response) => response.json()),
          tap((responseJson) =>
            this.logger.verbose(JSON.stringify(responseJson)),
          ),
          concatMap((messages: RasaResponsePayload[]) => {
            return zip(
              from(messages),
              interval(this.configService.get('rasa.messageDelay')),
              (payload: RasaResponsePayload, _) => {
                return payload;
              },
            );
          }),
        )
        .subscribe({
          next: (response: RasaResponsePayload) => {
            const command = plainToInstance(
              NewRasaMessageCommand,
              Object.assign(response, { namespace: rasaServer.name }),
            );
            this.logger.debug(JSON.stringify(command));
            this.commandBus.execute(command);
          },
          error: (error: Error) => {
            this.logger.error(error);
            reject(error);
          },
          complete: () => {
            resolve();
          },
        });
    });
  }
}