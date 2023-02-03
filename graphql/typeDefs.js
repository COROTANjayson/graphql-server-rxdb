const { gql } = require('apollo-server');

module.exports = gql`
  type Hero {
    id: String
    name: String
    color: String!
    updatedAt: Float
    deleted: Boolean
  }
  type HeroCheckpoint {
    id: String!
    updatedAt: Float!
  }
  type Checkpoint {
    id: String!,
    updatedAt: Float!
  }
  type HeroPullBulkT0DocumentsT0T0 {
    id: String!
    name: String
    color: String!
    updatedAt: Float!
    deleted: Boolean!
  }
  type HeroPullBulkT0CheckpointT0 {
    id: String!
    updatedAt: Float!
  }
  type HeroPullBulk {
    documents: [HeroPullBulkT0DocumentsT0T0]!
    checkpoint: HeroPullBulkT0CheckpointT0!
  }
  input HeroInput {
    id: String
    name: String
    color: String
    updatedAt: Float
    deleted: Boolean
  }
  input HeroInputPushRowT0AssumedMasterStateT0 {
    id: String!
    name: String
    color: String!
    updatedAt: Float!
    deleted: Boolean!
  }
  input HeroInputPushRowT0NewDocumentStateT0 {
    id: String!
    name: String
    color: String!
    updatedAt: Float!
    deleted: Boolean!
  }
  input HeroInputPushRow {
    assumedMasterState: HeroInputPushRowT0AssumedMasterStateT0
    newDocumentState: HeroInputPushRowT0NewDocumentStateT0!
  }
  input HeroInputCheckpoint {
    id: String!
    updatedAt: Float!
  }
  input HeroInputHeaders {
    Authorization: String!
  }

  type Query {
    pullHero(checkpoint: HeroInputCheckpoint, limit: Int!): HeroPullBulk!
    hero(ID: ID!): Hero!
    getHeroes(amount: Int): [Hero]
  }
  type Mutation {
        createHero(heroInput: HeroInput): Hero!
        deleteHero(ID: ID!): Boolean!
        editHero(ID: ID!, heroInput: HeroInput): Boolean!
        pushHero(row: [HeroInputPushRow]): [Hero!]!
      }
  type Subscription {
    streamHero(headers: HeroInputHeaders): HeroPullBulk!
  }
    
`

