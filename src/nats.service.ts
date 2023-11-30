import { Inject, Injectable } from '@nestjs/common';
import { NatsStreamingTransporter } from './nats-streaming.transporter';
import { ConnectionOptions, ConsumerConfig, RetentionPolicy, StorageType, StringCodec } from 'nats';

@Injectable()
export class NatsService {
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
    const client = this.transporter.getClient();
    const js = client.jetstream();
    const sc = StringCodec();
    // create stream
    const jsm = await client.jetstreamManager();
    const streamName = topic.split('.')[0];
    await jsm.streams.add({
      name: streamName,
      subjects: [`${streamName}.*`],
      retention: RetentionPolicy.Limits,
      storage: StorageType.Memory,
    });
    // publish
    js.publish(topic, sc.encode(data));
  }
}
