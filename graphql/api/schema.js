

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
        status: String!
        description: String!
        projectType: String!
        projectImages: [String!]!
        deadline: String!
        outreaches: [ID!]!
        address: Address!
        location: Location!
        distance: Float!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        verker: Boolean!
        firstName: String!
        lastName: String!
        profileImage: String!
        deviceToken: String!
        address: Address!
        projects: [Project]
        streamToken: ID!
        email: String!
        phone: String!
        password: String
    }

    type AuthResult {
        user: User!
        verker: Boolean!
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

    input OfferInputData {
        status: String!
        offerId: ID
        projectId: ID!
        outreachId: ID!
        verkerId: ID!
        consumerId: ID!
        consumerName: String!
        consumerAddress: InputAddress!
        companyId: ID!
        companyName: String!
        cvr: Int!
        companyAddress: InputAddress!
        companyEmail: String!
        description: String
        materials: [MaterialInputData]
        hours: Float
        hourlyRate: Float
        startDate: String
        offerExpires: String
    }

    input MaterialInputData {
        name: String!
        price: Float!
        quantity: Float!
    }

    type Company {
        _id: ID!
        name: String!
        description: String!
        cvr: String!
        email: String!
        phone: String!
        employees: Int!
        logo: String!
        established: String!
        address: Address!
        location: Location!
        createdAt: String!
    }

    type Outreach {
        _id: ID
        status: String!
        projectId: ID!
        projectTitle: String!
        company: Company!
        consumerId: ID!
        verkerId: ID!
        createdAt: String!
    }

    type VerkerProjects {
        outreach: Outreach!
        project: Project!
    }

    type OutreachMember {
        userId: ID!
        role: String!
        firstName: String!
        profileImage: String!
        totalUnread: Int!
    }

    input OutreachInputData {
        projectId: ID!
        initialMessage: String!
    }



    type RootQuery {
        isTyping( socketNotification: [ID!]!, name: String!, outreachId: ID!, isTyping: Boolean!): Boolean!
        getOutreaches(non: String) : [Outreach]!
        getProjects(non: String) : [Project!]!
        browseProjects(maxDistance: Int, type: String, coordinates: [Float!], skip: Int!, limit: Int!): [Project!]
        getUser(email: String!) : User!
        signinUser(email: String!, password: String!, verker: Boolean!) : AuthResult!
        verkerGetProjects : [VerkerProjects!]
    }

    type RootMutation {
        createOutreach(outreachInput: OutreachInputData!) : Outreach!
        createUser(userInput: UserInputData!): User!
        createProject(projectInput: ProjectInputData): Project!
        updateOffer(offerInput: OfferInputData) : String!
    }
    


    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);