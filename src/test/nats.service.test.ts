import { Test, TestingModule } from '@nestjs/testing';
import { NatsService } from '../index';

describe('NatsService', () => {
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
