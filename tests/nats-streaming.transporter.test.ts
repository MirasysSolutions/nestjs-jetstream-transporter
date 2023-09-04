import { ConnectionOptions, ConsumerConfig, AckPolicy, DeliverPolicy, ReplayPolicy } from 'nats';
import { NatsStreamingTransporter } from '../src/index';

describe('NatsStreamingTransporter', () => {
  let transporter: NatsStreamingTransporter;

  beforeEach(() => {
    const connectionOptions: ConnectionOptions = {
      authenticator: undefined,
      debug: false,
      maxPingOut: undefined,
      maxReconnectAttempts: 10,
      name: undefined,
      noEcho: false,
      noRandomize: false,
      pass: undefined,
      pedantic: false,
      pingInterval: 120000,
      port: undefined,
      reconnect: true,
      reconnectDelayHandler: undefined,
      reconnectJitter: 100,
      reconnectJitterTLS: 1000,
      reconnectTimeWait: 2000,
      servers: ['127.0.0.1:4222'],
      timeout: 20000,
      tls: null,
      token: undefined,
      user: undefined,
      verbose: false,
      waitOnFirstConnect: false,
      ignoreClusterUpdates: false,
      inboxPrefix: undefined,
      ignoreAuthErrorAbort: undefined,
    };
    const consumerOptions: ConsumerConfig = {
      ack_policy: AckPolicy.All,
      deliver_policy: DeliverPolicy.Last,
      replay_policy: ReplayPolicy.Instant,
    };

    transporter = new NatsStreamingTransporter(connectionOptions, consumerOptions);
  });

  it('should be defined', () => {
    expect(transporter).toBeDefined();
  });
});
