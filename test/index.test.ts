import { Test, TestingModule } from '@nestjs/testing';
import { NatsService, NatsStreamingTransporter } from '../src/index';
import {
  AckPolicy,
  ConsumerConfig,
  DeliverPolicy,
  ReplayPolicy,
} from 'nats/lib/jetstream/jsapi_types';
import { ConnectionOptions } from 'nats';

describe.skip('NatsService', () => {
  let natsService: NatsService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        NatsService,
        {
          provide: 'NATS_CONNECTION_OPTIONS',
          useValue: {},
        },
        {
          provide: 'NATS_CONSUMER_OPTIONS',
          useValue: {},
        },
      ],
    }).compile();

    natsService = testingModule.get(NatsService);
  });

  it('should be defined', () => {
    expect(natsService).toBeDefined();
  });

  it('should publish a message', async () => {
    const topic = 'example.topic';
    const data = JSON.stringify({ message: 'Hello, world!' });

    const clientMock = {
      jetstream: jest.fn(() => ({
        publish: jest.fn(),
      })),
      jetstreamManager: jest.fn(() => ({
        streams: {
          add: jest.fn(),
        },
      })),
    };

    natsService['transporter'] = {
      getClient: jest.fn(() => clientMock),
    } as any;

    await natsService.publish(topic, data);

    expect(clientMock.jetstream).toHaveBeenCalled();
    expect(clientMock.jetstreamManager).toHaveBeenCalled();
  });
});

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

    transporter = new NatsStreamingTransporter(
      connectionOptions,
      consumerOptions
    );
  });

  it('should be defined', () => {
    expect(transporter).toBeDefined();
  });
  
  it('should call the getClient method and return a valid client', () => {
    const mockStan = {
      jetstream: jest.fn(),
    };

    transporter['stan'] = mockStan as any;

    const client = transporter.getClient();

    expect(client).toBeDefined();
    expect(client).toBe(mockStan);
  });
});
