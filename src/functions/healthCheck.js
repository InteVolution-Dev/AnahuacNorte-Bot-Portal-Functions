const { app } = require('@azure/functions');
const { ok } = require('../utils/response');


app.http('healthCheck', {
    route: 'health',
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        console.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';

        data = { body: `Hello, ${name}!` };
        
        return ok(data);
    }
});
