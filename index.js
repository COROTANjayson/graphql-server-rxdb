const {ApolloServer} = require('apollo-server');
const mongoose = require('mongoose');

const MONGODB = "mongodb+srv://jayson123:jayson123@scholar.wk9t5.mongodb.net/heroesdb?retryWrites=true&w=majority"

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const server = new ApolloServer({
    typeDefs,
    resolvers
});

mongoose.connect(MONGODB, {useNewUrlParser: true})
    .then(() => {
        console.log('MongoDB connected');
        return server.listen({port: 5000});
    })
    .then(res => {
        console.log(`Server running at ${res.url}`);
    });