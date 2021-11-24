const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    input InputAddress {
        address: String!
        zip: String!
    }

    type Address {
        address: String!
        zip: String!
    }

    input InputLocation {
        type: String!
        coordinates: [Float!]!
    }

    type Location {
        type: String!
        coordinates: [Float!]!
    }

    input ProjectInputData {
        title: String!
        description: String!
        projectType: String!
        projectImages: [String!]!
        deadline: String!
        address: InputAddress!
        location: InputLocation!
    }

    type Project {
        _id: ID!
        title: String!
        description: String!
        projectType: String!
        deadline: String!
        address: Address!
        location: Location!
        distance: Float!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        firstName: String!
        lastName: String!
        profileImage: String!
        deviceToken: String!
        address: Address!
        projects: [Project]
        email: String!
        password: String
    }

    type AuthResult {
        _id: ID!
        jwt: String!
    }

    input UserInputData {
        firstName: String!
        lastName: String!
        profileImage: String
        deviceToken: String!
        address: InputAddress!
        phone: String!
        email: String!
        password: String!
    }

    type RootQuery {
        singleUser(id: String!) : User!
        signinUser(email: String!, password: String!) : AuthResult!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createProject(projectInput: ProjectInputData): Project!
    }
    


    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);