import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouteType } from '@prisma/client';
import { addSeconds } from 'date-fns';

import { SessionDefinition } from 'server/route';

import { PrismaService } from '../prisma';
import { ISessionStorage } from './session-storage.interface';

export class PrismaSessionStorage implements ISessionStorage {
  private logger = new Logger(PrismaSessionStorage.name);
  private sessionExpirationSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.sessionExpirationSeconds = this.configService.get<number>(
      'storage.sessionExpiration',
    );
  }

  async getSessionDefinition(
    type: RouteType,
    namespaces: string[],
  ): Promise<SessionDefinition | undefined> {
    const sessionStorage = await this.prisma.sessionStorage.findFirst({
      where: {
        sourceType: type,
        sourceNamespaces: namespaces.join(':'),
      },
    });

    if (sessionStorage) {
      const { createdAt } = sessionStorage;
      if (addSeconds(createdAt, this.sessionExpirationSeconds) >= new Date()) {
        return {
          id: sessionStorage.id,
          source: {
            type: sessionStorage.sourceType,
            namespaces: sessionStorage.sourceNamespaces.split(':'),
          },
          destination: {
            type: sessionStorage.destinationType,
            namespaces: sessionStorage.destinationNamespaces.split(':'),
          },
          isDestination: false,
        }
      } else {
        // expired, should create new session
        return undefined;
      }
    }

    const destSessionStorage = await this.prisma.sessionStorage.findFirst({
      where: {
        destinationType: type,
        destinationNamespaces: namespaces.join(':'),
      },
    });

    if (destSessionStorage) {
      const { createdAt: destCreatedAt } = destSessionStorage;
      if (addSeconds(destCreatedAt, this.sessionExpirationSeconds) > new Date()) {
        return {
          id: destSessionStorage.id,
          source: {
            type: destSessionStorage.sourceType,
            namespaces: destSessionStorage.sourceNamespaces.split(':'),
          },
          destination: {
            type: destSessionStorage.destinationType,
            namespaces: destSessionStorage.destinationNamespaces.split(':'),
          },
          isDestination: true,
        }
      } else {
        // expired, should create new session
        return undefined;
      }
    }

    // couldn't find session
    return undefined;
  }

  async storeSessionDefinition(definition: SessionDefinition): Promise<void> {
    await this.prisma.sessionStorage.create({
      data: {
        id: definition.id,
        sourceType: definition.source.type,
        sourceNamespaces: definition.source.namespaces.join(':'),
        destinationType: definition.destination.type,
        destinationNamespaces: definition.destination.namespaces.join(':'),
      },
    });
  }
}