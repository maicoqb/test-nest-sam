import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const express = require('express');

const binaryMimeTypes: string[] = [];

let cachedServer : Server;

async function bootstrapServer(): Promise<Server> {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp))
  nestApp.use(eventContext());
  
  await nestApp.init();

  cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  return cachedServer;
}


// // If runtime environment is not serverless
// // then start bootstrap manually
// const { RUNTIME_ENVIRONMENT: runtimeEnv } = process.env;
// if (runtimeEnv !== 'serverless') {
//   console.log('mannualy started bootstrap');
//   bootstrapServer();
// }

// Export lamda handler
export async function handler(event: any, context: Context) : Promise<Handler> {
  console.log('lambda handler');
  const server = await bootstrapServer();
  return proxy(server, event, context, 'PROMISE').promise;
}




