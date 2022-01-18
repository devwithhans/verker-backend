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
        _id: ID!
        user: User!
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

    input MessageInput {
        outreachId: ID!
        socketNotification: [ID!]!
        message: String!
        senderName: String!

    }


    type OutreachMember {
        userId: ID!
        role: String!
        firstName: String!
        profileImage: String!
        totalUnread: Int!
    }



    type RootQuery {
        isTyping( socketNotification: [ID!]!, name: String!, outreachId: ID!, isTyping: Boolean!): Boolean!
        getMessages(outreachId: ID) : [Message!]
        getOutreaches(non: String) : [Outreach]!
        getProjects(non: String) : [Project!]!
        getUser(email: String!) : User!
        signinUser(email: String!, password: String!) : AuthResult!
    }

    type RootMutation {
        sendMessage(messageInput: MessageInput!): Message!
        createUser(userInput: UserInputData): User!
        createProject(projectInput: ProjectInputData): Project!
    }
    


    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);