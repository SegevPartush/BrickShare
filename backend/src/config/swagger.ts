import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BrickShare API',
      version: '1.0.0',
      description: 'API documentation for BrickShare - LEGO Social Network',
      contact: {
        name: 'BrickShare Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            profileImage: { type: 'string', example: '/uploads/profiles/avatar.jpg' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            text: { type: 'string', example: 'My awesome LEGO build!' },
            image: { type: 'string', example: '/uploads/posts/build.jpg' },
            author: { $ref: '#/components/schemas/User' },
            likes: {
              type: 'array',
              items: { type: 'string' }
            },
            commentCount: { type: 'number', example: 5 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            text: { type: 'string', example: 'Great build!' },
            author: { $ref: '#/components/schemas/User' },
            post: { type: 'string', example: '507f1f77bcf86cd799439011' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: [
    path.join(process.cwd(), 'src', 'routes', '*.ts'),
    path.join(__dirname, '..', 'routes', '*.js')
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
