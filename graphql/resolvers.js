const Hero = require('../models/Hero');
const mongoose = require('mongoose');
const  { PubSub } =require('graphql-subscriptions');
// let documents = [];
module.exports = {
    Query: {
        async pullHero(_, { checkpoint, limit }) {
            const lastId = checkpoint ? checkpoint.id : '';
            const minUpdatedAt = checkpoint
                ? checkpoint.updatedAt
                : 0;

            // get all documents FROM MONGODB
            const documents = await Hero.find().sort({ createdAt: -1 })

            // sorted by updatedAt first and the id as second
            const sortedDocuments = documents.sort((a, b) => {
                if (a.updatedAt > b.updatedAt) return 1;
                if (a.updatedAt < b.updatedAt) return -1;
                if (a.updatedAt === b.updatedAt) {
                    if (a.id > b.id) return 1;
                    if (a.id < b.id) return -1;
                    else return 0;
                }
            });

            // only return documents newer than the input document
            const filterForMinUpdatedAtAndId = sortedDocuments.filter(doc => {
                if (doc.updatedAt < minUpdatedAt) return false;
                if (doc.updatedAt > minUpdatedAt) return true;
                if (doc.updatedAt === minUpdatedAt) {
                    // if updatedAt is equal, compare by id
                    if (doc.id > lastId) return true;
                    else return false;
                }
            });
            // only return some documents in one batch
            const limitedDocs = filterForMinUpdatedAtAndId.slice(0, limit);
            // use the last document for the checkpoint
            const lastDoc = limitedDocs[limitedDocs.length - 1];
            
            // return the documents FROM MONGODB and the checkpoint
            return {
                documents: limitedDocs,
                checkpoint: lastDoc
                    ? {
                        id: lastDoc.id,
                        updatedAt: lastDoc.updatedAt
                    }
                    : {
                        id: lastId,
                        updatedAt: minUpdatedAt,
                    },
            }
        },
        async hero(_, { ID }) {
            try {
                const recipe = await Hero.findById(ID);
                return recipe;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getHeroes(_, { amount }) {
            try {
                const recipes = await Hero.find().sort({ createdAt: -1 }).limit(amount);
                return recipes;
            } catch (err) {
                throw new Error(err);
            }
        }
    },
    Mutation: {
        async createHero(_, {
            heroInput: {
                name,
                color } }) {

            const newRecipe = new Hero({
                name,
                color,
                updatedAt: Date.now(),
                deleted: false,
            });
            const recipe = await newRecipe.save();
            return {
                id: recipe.id,
                ...recipe._doc,
            };
        },
        async deleteHero(_, { ID }) {
            try {
                const wasDeleted = (await Hero.deleteOne({ _id: ID })).deletedCount;
                return wasDeleted;
            } catch (err) {
                throw new Error(err);
            }
        },
        async editHero(_, { ID,
            heroInput: {
                name,
                color,
                updatedAt, } }) {
            try {
                console.log('isUpdate')
                const wasEdited = (await Hero.updateOne({ _id: ID },
                    {
                        name,
                        color,
                        updatedAt,
                    })).modifiedCount;
                return wasEdited;
            } catch (err) {
                throw new Error(err);
            }
        },
        async pushHero(_, { row }) {
            // const pubsub = new PubSub();
            let documents = await Hero.find().sort({ createdAt: -1 })
            // new data from client side database
            const rows = row;
            let lastCheckpoint = {
                id: '',
                updatedAt: 0,
            };

            const conflicts = [];
            const writtenDocs = [];
            console.log('---------------New Data pushed-----------------------', row)
            
            rows.forEach(async (row) => {
                const docId = row.newDocumentState.id;
                const docCurrentMaster = documents.find((d) => d.id === docId);
                /**
                 * Detect conflicts.
                 */
                if (
                    docCurrentMaster &&
                    row.assumedMasterState &&
                    docCurrentMaster.updatedAt !==
                    row.assumedMasterState.updatedAt
                ) {
                    conflicts.push(docCurrentMaster);
                    return;
                }

                let doc = row.newDocumentState;
                documents = documents.filter((d) => d.id !== doc.id);

                // query from mongodb
                const mongoQuery = await Hero.findById(docId)
                
                // if id exist in mongodb, update it
                if (mongoQuery) {
                   await Hero.findByIdAndUpdate(docId, {
                        name: doc.name,
                        color: doc.color,
                        updatedAt: doc.updatedAt
                   })
                } else {
                    console.log('saved to mongodb:', docId)
                    const newRecipe = new Hero({
                        _id: mongoose.Types.ObjectId(doc.id),
                        name: doc.name,
                        color: doc.color,
                        updatedAt: doc.updatedAt,
                        deleted: doc.deleted,
                    });
                    await newRecipe.save();
                }

                // save the new checkpoint
                lastCheckpoint.id = doc.id;
                lastCheckpoint.updatedAt = doc.updatedAt;
                writtenDocs.push(doc);
            });

            // console.log('documents',documents)
            // pubsub.publish('streamHero', {
            //     streamHero: {
            //         documents: writtenDocs,
            //         checkpoint: lastCheckpoint,
            //     },
            // });

            // console.log('## current documents:');
            // console.log(JSON.stringify(documents, null, 4));
            // console.log('## conflicts:');
            // console.log(JSON.stringify(conflicts, null, 4));
            // console.log('conflicts',conflicts)
            return conflicts;
        },

    },
    Subscription: {
        streamHero: async (args) => {
            // log('## streamHero()');
            // const authHeaderValue = args.headers.Authorization;
            // const bearerToken = authHeaderValue.split(' ')[1];

            // validateBearerToken(bearerToken);
            const documents = await Hero.find().sort({ createdAt: -1 })
            // return pubsub.asyncIterator('streamHero');
            return {
                checkpoint: {
                    id: documents[0].id,
                    updatedAt: documents[0].updatedAt,
                },
                documents
            }
        },
    }
}