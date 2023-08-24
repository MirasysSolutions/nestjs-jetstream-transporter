# nestjs-jetstream-transporter
A custom transporter for integrating NATS with NestJS microservices. It provides an implementation for receiving and sending messages using the NATS messaging system.

## NestJS NATS Config

In app.module.ts, import the NatsService from the lib, provide NAST connection options and NAST consumer options, then put these into the App providers.

```
@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: 'NATS_CONNECTION_OPTIONS',
      useValue: <ConnectionOptions>
        servers: ['nats://eventbus: 4222'],
        name: `${process.env.npm_package_name}`,
        noEcho: true,
        debug: false,
    },
    {
      provide: 'NATS_CONSUMER_OPTIONS',
      useValue: <ConsumerConfig>{
        deliver_group: process.env.npm_package_name,
        max_ack_pending: 100,
        ack_policy: AckPolicy. Explicit,
      }б
    },
    AppService,
    NatsService,
  ]
})
export class AppModule {}
```


In main.ts, connect the microservice with NATS strategy, like so:

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NatsService } from './nats-streaming';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.connectMicroservice({
    strategy: app.get (NatsService).strategy,
  });
  await app.startAllMicroservices();
  await app.listen (3000, ¹0.0.0.0¹);
} 
bootstrap();

```

## NestJS Producer example

To publish events, we inject the NatsService and call the publish method with the event topic and event data:

```
constructor(
    private readonly natsService: NatsService,
) {}

async someFunction() {
  const data = {
    name: 'Mirasys Oy',
    address: 'Vaisalantie 2, 02130 Espoo, Finland',
  };
  
  await this.orgService.save(data);
  
  this.natsService.publish('organization.added', JSON.stringify(data));
}

```

## NestJS Consumer example

To subscribe to events, we use the @EventPattern decorator, note that we need to call the ack() method when finish processing the event.

```
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { JsMsg } from 'nats';
import { NatsService } from './nats-streaming';

@EventPattern('organization.fetched')
handleOrgFetched(@Payload() data: any, @Ctx() context: JsMsg) {
    console.log('data:', data);
    context.ack();
}

```
