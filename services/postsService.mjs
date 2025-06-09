import { ObjectId } from 'mongodb';
import { getClientPromise } from '../database/clientService.mjs';

async function getPostsCollection() {
  const { database } = await getClientPromise();
  const posts = database.collection('posts');
  return posts;
}

export const postsService = {
  //methoden syntax -> alternative arrow syntax: findAll: async () => {}
  async findAll() {
    //not used
    const posts = await getPostsCollection();
    const result = await posts.find({}).toArray();
    console.log(JSON.stringify(result, null, 2));
    return result;
  },
  async findAllWithAuthors() {
    //used instead of findAll() - in posts.mjs angepasst
    //with backend aggregation with collection authors
    const posts = await getPostsCollection();
    const result = await posts
      .aggregate([
        {
          $lookup: {
            from: 'authors',
            localField: 'authorId',
            foreignField: '_id',
            as: 'authorInfo',
          },
        },
        {
          $unwind: {
            path: '$authorInfo', // Das Array-Feld, das "entpackt" werden soll
            preserveNullAndEmptyArrays: true, // Wichtig: Behält Posts bei, auch wenn kein Autor gefunden wurde (authorInfo wird dann null)
          },
        },
      ])
      .toArray();
    console.log(JSON.stringify(result, null, 2));
    return result;
  },
  async findById(id) {
    const posts = await getPostsCollection();
    const query = { _id: ObjectId.createFromHexString(id) };
    const result = await posts.findOne(query);
    return result ?? undefined;
  },
  //used instead of findById(id) - in posts.mjs angepasst
  //with backend aggregation to also get the author for a post
  async findByIdWithAuthor(id) {
    const posts = await getPostsCollection();
    const objectId = { _id: ObjectId.createFromHexString(id) };

    const result = await posts
      .aggregate([
        {
          $match: { _id: objectId },
        },
        {
          $lookup: {
            from: 'authors',
            localField: 'authorId',
            foreignField: '_id',
            as: 'authorInfo',
          },
        },
        {
          $unwind: {
            path: '$authorInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .next(); //mit next() wird das nächste Dokument vom Cursor abgerufen

    return result ?? undefined;
  },
  async create(post) {
    const posts = await getPostsCollection();
    const { acknowledged, insertedId } = await posts.insertOne(post);
    return acknowledged ? insertedId.toHexString() : undefined;
  },
  async update(updatePost, id) {
    const posts = await getPostsCollection();
    const filter = { _id: ObjectId.createFromHexString(id) };
    const updateDoc = {
      $set: {
        ...updatePost,
      },
    };
    delete updateDoc.$set._id; //always send mongodb a new doc without an _id
    const { acknowledged, modifiedCount } = await posts.updateOne(
      filter,
      updateDoc
    );
    return acknowledged && modifiedCount ? true : false;
    //returns true or false
  },
  async remove(id) {
    const posts = await getPostsCollection();
    const filter = { _id: ObjectId.createFromHexString(id) };
    const { acknowledged, deletedCount } = await posts.deleteOne(filter);
    return acknowledged && deletedCount ? true : false;
  },
};
