import fastify from 'fastify';

const server = fastify();

server.get('/', async (request, reply) => {
    return { hello: 'world' };
});

server.listen({ port: 3000 }, () => console.log('Server is running on port 3000'));
