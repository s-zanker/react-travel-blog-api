import { ObjectId } from 'mongodb';
import { getClientPromise } from '../database/clientService.mjs';

async function getAuthorsCollection() {
  const { database } = await getClientPromise();
  const authors = database.collection('authors');
  return authors;
}

export const authorsService = {
  async findAll() {
    const authors = await getAuthorsCollection();
    const result = await authors.find({}).toArray();
    console.log(JSON.stringify(result, null, 2));
    return result;
  },
  async findById(id) {
    const authors = await getAuthorsCollection();
    const query = { _id: ObjectId.createFromHexString(id) };
    const result = await authors.findOne(query);
    return result ?? undefined;
  },
  async create(author) {
    const authors = await getAuthorsCollection();
    const { acknowledged, insertedId } = await authors.insertOne(author);
    return acknowledged ? insertedId.toHexString() : undefined;
  },
  async update(updateAuthor, id) {
    const authors = await getAuthorsCollection();
    const filter = { _id: ObjectId.createFromHexString(id) };
    const updateDoc = {
      $set: {
        ...updateAuthor,
      },
    };
    delete updateDoc.$set._id; //always send mongodb a new doc without an _id
    const { acknowledged, modifiedCount } = await authors.updateOne(
      filter,
      updateDoc
    );
    return acknowledged && modifiedCount ? true : false;
    //returns true or false
  },
  async remove(id) {
    const authors = await getAuthorsCollection();
    const filter = { _id: ObjectId.createFromHexString(id) };
    const { acknowledged, deletedCount } = await authors.deleteOne(filter);
    return acknowledged && deletedCount ? true : false;
  },
};
