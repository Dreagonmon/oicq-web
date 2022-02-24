//https://github.com/enisdenjo/graphql-ws
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";
import { setTimeout } from "timers/promises";

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 * type Subscription {
 *   greetings: String
 * }
 */
export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "Query",
        fields: {
            hello: {
                type: GraphQLString,
                resolve: () => {
                    return "world";
                },
            },
        },
    }),
    subscription: new GraphQLObjectType({
        name: "Subscription",
        fields: {
            greetings: {
                type: GraphQLString,
                subscribe: async function *() {
                    for (let i = 0; i < 3600; i++) {
                        for (const hi of ["Hi", "Bonjour", "Hola", "Ciao", "Zdravo"]) {
                            yield { greetings: hi };
                            await setTimeout(1000);
                        }
                    }
                },
            },
        },
    }),
});
