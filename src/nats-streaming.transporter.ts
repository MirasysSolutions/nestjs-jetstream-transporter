import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import {
  ConnectionOptions,
  ConsumerConfig,
  NatsConnection,
  RetentionPolicy,
  StorageType,
  StringCodec,
  connect,
} from 'nats';

export class NatsStreamingTransporter extends Server implements CustomTransportStrategy {
  constructor(private readonly connectionOptions: ConnectionOptions, private readonly consumerOptions: ConsumerConfig) {
    super();
  }

  private stan?: NatsConnection;

  public getClient(): NatsConnection {
    return this.stan;
  }

  public async listen(callback: () => void) {
    this.stan = await connect(this.connectionOptions);
    this.bindEventHandlers();
    callback();
  }

  public close() {
    this.stan && this.stan.close();
  }

  // Implement other necessary methods here
  private async bindEventHandlers() {
    const registerdPatterns = Array.from(this.messageHandlers.keys());
    if (!registerdPatterns) {
      console.log('No message handlers registered');
    } else {
      const js = this.stan.jetstream();
      const jsm = await this.stan.jetstreamManager();

      registerdPatterns.forEach(async (subject) => {
        // add stream
        const streamName = subject.split('.')[0];
        await jsm.streams.add({
          name: streamName,
          subjects: [`${streamName}.*`],
          retention: RetentionPolicy.Interest,
          storage: StorageType.Memory,
        });

        // add a new durable consumer
        const hashName = btoa(`${this.connectionOptions.name}.${subject}`);

        const cinfo = await jsm.consumers.add(streamName, {
          ...this.consumerOptions,
          durable_name: this.consumerOptions.durable_name ?? hashName,
          filter_subject: subject,
        });

        const c = await js.consumers.get(streamName, cinfo.name);

        // consume
        await c.consume({
          callback: async (msg) => {
            const handler = this.getHandlerByPattern(subject);
            const sc = StringCodec();
            const data = JSON.parse(sc.decode(msg.data)) as {
              pattern: string;
              data: any;
            };
            this.transformToObservable(await handler(data, msg));
          },
        });
        console.log(`Subscribed to ${subject} event with consumer ${cinfo.name} in stream ${cinfo.stream_name}`);
      });
    }
  }
}
