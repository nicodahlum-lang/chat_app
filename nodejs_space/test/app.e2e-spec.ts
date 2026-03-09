import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module';

describe('Chat Application E2E Tests', () => {
  let app: INestApplication;
  let authToken1: string;
  let authToken2: string;
  let userId1: string;
  let userId2: string;
  let conversationId: string;
  let messageId: string;
  const testEmail1 = `test${Date.now()}@example.com`;
  const testEmail2 = `test${Date.now() + 1}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('POST /auth/signup - should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: testEmail1,
          password: 'password123',
          name: 'Test User 1',
          avatarUrl: 'https://i.ytimg.com/vi/o84Y8MYo08o/maxresdefault.jpg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testEmail1);
      expect(response.body.user.name).toBe('Test User 1');

      authToken1 = response.body.token;
      userId1 = response.body.user.id;
    });

    it('POST /auth/signup - should create another user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: testEmail2,
          password: 'password123',
          name: 'Test User 2',
        })
        .expect(201);

      authToken2 = response.body.token;
      userId2 = response.body.user.id;
    });

    it('POST /auth/login - should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail2,
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('GET /auth/me - should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.id).toBe(userId1);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('createdAt');
    });
  });

  describe('Users', () => {
    it('GET /users/search - should search users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?query=User')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('PUT /users/profile - should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });
  });

  describe('Conversations', () => {
    it('POST /conversations/one-on-one - should create one-on-one conversation', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversations/one-on-one')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          participantId: userId2,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('ONE_ON_ONE');
      expect(response.body.participants).toHaveLength(2);

      conversationId = response.body.id;
    });

    it('GET /conversations - should get all conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/conversations')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('conversations');
      expect(Array.isArray(response.body.conversations)).toBe(true);
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('GET /conversations/:id - should get conversation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.id).toBe(conversationId);
      expect(response.body).toHaveProperty('participants');
    });
  });

  describe('Messages', () => {
    it('POST /conversations/:conversationId/messages - should send a text message', async () => {
      const response = await request(app.getHttpServer())
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'Hello, this is a test message!',
          messageType: 'TEXT',
          isDisappearing: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Hello, this is a test message!');
      expect(response.body.messageType).toBe('TEXT');

      messageId = response.body.id;
    });

    it('POST /conversations/:conversationId/messages - should send a disappearing message', async () => {
      const response = await request(app.getHttpServer())
        .post(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'This message will disappear!',
          messageType: 'TEXT',
          isDisappearing: true,
          disappearDurationSeconds: 30,
        })
        .expect(201);

      expect(response.body.isDisappearing).toBe(true);
      expect(response.body.disappearDurationSeconds).toBe(30);
    });

    it('GET /conversations/:conversationId/messages - should get messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}/messages?limit=10`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);
    });

    it('POST /messages/:messageId/view - should mark message as viewed', async () => {
      const response = await request(app.getHttpServer())
        .post(`/messages/${messageId}/view`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('viewedAt');
    });

    it('PUT /conversations/:conversationId/read - should mark conversation as read', async () => {
      const response = await request(app.getHttpServer())
        .put(`/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('lastReadAt');
    });
  });
});
