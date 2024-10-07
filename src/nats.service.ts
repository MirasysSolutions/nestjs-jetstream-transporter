import { Inject, Injectable } from '@nestjs/common';
import { NatsStreamingTransporter } from './nats-streaming.transporter';
import { ConnectionOptions, ConsumerConfig, RetentionPolicy, StorageType, StringCodec } from 'nats';

interface PublisherClient {
  publish(topic: string, data: string): Promise<void>;
}

@Injectable()
export class NatsService implements PublisherClient {
  private transporter: NatsStreamingTransporter;

  constructor(
    @Inject('NATS_CONNECTION_OPTIONS')
    private connectionOptions: ConnectionOptions,
    @Inject('NATS_CONSUMER_OPTIONS')
    private consumerOptions: ConsumerConfig
  ) {
    this.transporter = new NatsStreamingTransporter(this.connectionOptions, this.consumerOptions);
  }

  get strategy() {
    return this.transporter;
  }

  async publish(topic: string, data: string): Promise<void> {
    try {
      const client = this.transporter.getClient();
      const js = client.jetstream();
      const sc = StringCodec();

      // create stream
      const jsm = await client.jetstreamManager();
      const streamName = topic.split('.')[0];

      try {
        await jsm.streams.add({
          name: streamName,
          subjects: [`${streamName}.*`],
          retention: RetentionPolicy.Limits,
          storage: StorageType.Memory,
        });
      } catch (streamError) {
        console.error(`Error adding stream: ${streamName}`, streamError);
        throw streamError;
      }

      // publish
      try {
        await js.publish(topic, sc.encode(data));
      } catch (publishError) {
        console.error(`Error publishing message to topic: ${topic}`, publishError);
        throw publishError;
      }
    } catch (error) {
      console.error('Error in publish function', error);
      throw error;
    }
  }
}
