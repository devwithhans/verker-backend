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

    type Owner {
        ownerId: ID!
        firstName: String!
        lastName: String!
        profileImage: String!
    }

    input CompanyInputData {
        name: String!
        description: String!
        cvr: String!
        email: String!
        phone: String!
        employees: Int!
        established: String!
        address: InputAddress!
    }

    type Company {
        _id: ID!
        name: String!
        description: String!
        cvr: String!
        owner: Owner!
        email: String!
        phone: String!
        employees: Int!
        established: String!
        address: Address!
    }

    type Verker {
        _id: ID!
        firstName: String!
        lastName: String!
        profileImage: String!
        deviceToken: String!
        address: Address!
        email: String!
        phone: String!
        password: String
    }

    type AuthResult {
        _id: ID!
        jwt: String!
    }

    input VerkerInputData {
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
        singleVerker(id: String!) : Verker!
        signinVerker(email: String!, password: String!) : AuthResult!
    }

    type RootMutation {
        inviteVerker(email: String!) : String!
        createCompany(companyInput: CompanyInputData): Company!
        createVerker(verkerInput: VerkerInputData): Verker!
    }
    


    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);