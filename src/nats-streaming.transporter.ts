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
        const streamName = subject.split('.')[0].toUpperCase();
        const streamConfig = {
          name: streamName,
          subjects: [`${streamName.toLowerCase()}.*`],
          retention: RetentionPolicy.Limits,
          storage: StorageType.File,
        };
        // Check if the stream already exists
        try {
          await jsm.streams.get(streamName);
          console.log(`Stream ${streamName} already exists, skipping creation.`);
        } catch (err) {
          if (err.message.includes('stream not found')) {
            // Stream does not exist, create it
            console.log(`Stream ${streamName} does not exist, creating it.`);
            await jsm.streams.add(streamConfig);
            console.log(`Stream ${streamName} created:` + JSON.stringify(streamConfig, null, 2));
          } else {
            console.error(`Error checking stream ${streamName}:`, err);
            return;
          }
        }

        // add a new durable consumer
        console.log(`Adding consumer for subject ${subject} in stream ${streamName}.`);
        const hashName = btoa(`${this.connectionOptions.name}.${subject}`);
        try {
          const cinfo = await jsm.consumers.add(streamName, {
            ...this.consumerOptions,
            durable_name: this.consumerOptions.durable_name ?? hashName,
            filter_subject: subject,
          });

          const c = await js.consumers.get(streamName, cinfo.name);

          // consume
          console.log(`Creating consumer ${cinfo.name} in stream ${cinfo.stream_name} for subject ${subject}.`);
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
          console.log(`Subscribed to ${subject} event with consumer ${cinfo.name} in stream ${cinfo.stream_name}.`);
        } catch (err) {
          if (err.message.includes('consumer already exists')) {
            console.log(`Consumer for subject ${subject} in stream ${streamName} already exists, skipping creation.`);
            return;
          } else {
            console.error(`Error creating consumer for subject ${subject} in stream ${streamName}:`, err);
            return;
          }
        }
      });
    }
  }
}
