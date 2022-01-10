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

    input CompanyInputData {
        name: String!
        description: String!
        cvr: String!
        email: String!
        phone: String!
        employees: Int!
        established: String!
        address: InputAddress!
        coordinates: [Float!]!
    }

    type OutreachMember {
        userId: ID!
        role: String!
        firstName: String!
        profileImage: String!
        totalUnread: Int!
    }

    type OutreachRep {
        projectId: ID!
        outreachId: ID!
    }

    type Outreach {
        _id: ID
        projectId: ID!
        projectTitle: String
        initialMessage: String!
        company: Company!
        consumerId: ID!
        totalMessages: Int!
        messages: [Message]
        members: [OutreachMember!]!
        createdAt: String!
    }

    type Message {
        outreachId: ID!
        message: String!
        senderId: ID!
        createdAt: String!
        senderName: String!
    }



    input OutreachInputData {
        projectId: ID!
        initialMessage: String!
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
        outreaches: [OutreachRep!]
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
        companyId: String
    }

    type GetVerkerResult {
        verker: Verker!
        hasCompany: Boolean!
        company: Company
    }

    type AuthResult {
        _id: ID!
        jwt: String!
    }

    input VerkerInputData {
        firstName: String!
        lastName: String!
        profileImage: String
        deviceToken: String
        address: InputAddress!
        phone: String!
        email: String!
        password: String!
    }

    type Project {
        _id: ID!
        consumerId: String!
        title: String!
        description: String!
        projectType: String!
        projectImages: [String!]!
        deadline: String!
        address: Address!
        distance: Float
        location: Location!
        createdAt: String!
    }


    input MessageInput {
        outreachId: ID!
        socketNotification: [ID!]!
        message: String!
        senderName: String!
    }


    type RootQuery {
        getMessages(outreachId: ID, page: Int!) : [Message!]
        getProject(projectId: ID!) : Project!
        getOutreaches(companyId: ID!) : [Outreach!]
        getProjects(maxDistance: Int, type: String, coordinates: [Float!]): [Project!]
        getCompany(companyId: String!) : Company!
        getVerker(email: String) : GetVerkerResult!
        signinVerker(email: String!, password: String!) : AuthResult!
    }

    type RootMutation {
        sendMessage(messageInput: MessageInput!) : Message!
        createOutreach(outreachInput: OutreachInputData!) : Outreach!
        inviteVerker(email: String!) : String!
        createCompany(companyInput: CompanyInputData): Company!
        createVerker(verkerInput: VerkerInputData): Verker!
    }
    


    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);