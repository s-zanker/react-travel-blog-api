import { after, before, beforeEach, describe, it } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';

import { MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { postsService } from './postsService.mjs';

describe('postsService', () => {
  let config;
  /** @type {MongoMemoryServer} */
  let mongoServer;
  /** @type {MongoClient} */
  let client;

  /** @type {import('mongodb').InsertManyResult<import('mongodb').Document>} */
  let insertManyResults;

  before(async () => {
    config = await import(
      `../config/${process.env.REACT_TRAVEL_BLOG_ENV}.env.mjs`
    );
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: config.MONGO_PORT,
        ip: config.MONGO_HOST,
      },
    });
    client = await MongoClient.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoServer.stop();
    await client.close();
  });

  beforeEach(async () => {
    const db = client.db(config.MONGO_DBNAME);
    const posts = await db.createCollection('posts');

    await posts.deleteMany({});
    //The Image URLs and authorId's do not exist. Its just for testing!
    insertManyResults = await posts.insertMany([
      {
        title: 'Discover Salzburg',
        country: 'Austria',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/salzburg.jpg',
        authorId: '1234567890abcdef12345601',
      },
      {
        title: 'Malcesine at Lake Garda',
        country: 'Italy',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/malcesine.jpg',
        authorId: '1234567890abcdef12345602',
      },
      {
        title: 'Experience Graz',
        country: 'Austria',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/graz.jpg',
        authorId: '1234567890abcdef12345603',
      },
      {
        title: 'Explore Gallipoli',
        country: 'Italy',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/gallipoli.jpg',
        authorId: '1234567890abcdef12345604',
      },
    ]);
  });

  describe('findAll()', () => {
    // our actual tests are in its.
    // test() is another option for this.
    it('returns all posts', async () => {
      // arrange / act
      const posts = await postsService.findAll();

      // assert
      deepStrictEqual(posts.length, 4);
    });

    it('prevents changes by consuming code', async () => {
      // arrange / act
      const posts = await postsService.findAll();
      const originalAuthorId = posts[0].authorId;
      posts[0].authorId = 'Hacked';
      const posts_2 = await postsService.findAll();

      // assert
      strictEqual(posts_2[0].authorId, originalAuthorId);
    });
  });

  describe('findById(id)', () => {
    it('returns the matching post if it exists', async () => {
      // arrange
      const id = insertManyResults.insertedIds[0].toHexString();

      // act
      const post = await postsService.findById(id);

      // assert
      deepStrictEqual(post, (await postsService.findAll())[0]);
    });

    it('returns undefined if no post is found', async () => {
      // arrange
      const id = ObjectId.createFromTime(new Date()).toHexString();

      // act
      const post = await postsService.findById(id);

      // assert
      strictEqual(post, undefined);
    });

    it('prevents changes by consuming code', async () => {
      // arrange
      const id = insertManyResults.insertedIds[0].toHexString();

      // act
      const post = await postsService.findById(id);
      const originalAuthorId = post.authorId;
      post.authorId = 'Hacked';
      const post_2 = await postsService.findById(id);

      // assert
      strictEqual(post_2.authorId, originalAuthorId);
    });
  });

  describe('create(post)', () => {
    let newPost;

    beforeEach(() => {
      newPost = {
        title: 'Discover Hamburg',
        country: 'Germany',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/hamburg.jpg',
        authorId: '1234567890abcdef12345605',
      };
    });

    it('creates a new post', async () => {
      // arrange / act
      await postsService.create(newPost);

      // assert
      strictEqual((await postsService.findAll()).length, 5);
    });

    it('generates and returns the new post id', async () => {
      // arrange / act
      const id = await postsService.create(newPost);
      const post = await postsService.findById(id);

      // assert
      deepStrictEqual(post, {
        ...newPost,
        _id: ObjectId.createFromHexString(id),
      });
    });

    it('can deal with deletions', async () => {
      // arrange / act
      await postsService.remove(insertManyResults.insertedIds[0].toHexString());
      const id = await postsService.create(newPost);
      const post = await postsService.findById(id);

      // assert
      deepStrictEqual(post, {
        ...newPost,
        _id: ObjectId.createFromHexString(id),
      });
    });

    it('prevents changes by consuming code', async () => {
      // arrange / act
      const id = await postsService.create(newPost);
      const originalAuthorId = newPost.authorId;
      newPost.authorId = 'Hacked';
      const post = await postsService.findById(id);

      // assert
      strictEqual(post.authorId, originalAuthorId);
    });
  });

  describe('update(post, id)', () => {
    let toBeUpdated;

    beforeEach(async () => {
      toBeUpdated = {
        _id: insertManyResults.insertedIds[2].toHexString(),
        title: 'Update Success',
        country: 'Austria',
        visitingDate: new Date().toISOString().split('T')[0],
        image: '/images/graz.jpg',
        authorId: '1234567890abcdef12345603',
      };
    });

    it('updates the post', async () => {
      // arrange / act
      const originalPost = await postsService.findById(toBeUpdated._id);
      await postsService.update(toBeUpdated, toBeUpdated._id);

      // assert
      strictEqual(
        (await postsService.findById(toBeUpdated._id)).title,
        'Update Success'
      );
      strictEqual(
        (await postsService.findById(toBeUpdated._id)).authorId,
        originalPost.authorId
      );
    });

    it('returns true if the update was successful', async () => {
      // arrange / act
      const result = await postsService.update(toBeUpdated, toBeUpdated._id);

      // assert
      strictEqual(result, true);
    });

    it('returns false if no post was found', async () => {
      // arrange / act
      const result = await postsService.update(
        toBeUpdated,
        ObjectId.createFromTime(new Date()).toHexString()
      );

      // assert
      strictEqual(result, false);
    });
  });

  describe('remove(id)', () => {
    let id;
    beforeEach(() => {
      id = insertManyResults.insertedIds[0].toHexString();
    });

    it('removes the post by id', async () => {
      // arrange / act
      await postsService.remove(id);

      // assert
      strictEqual(await postsService.findById(id), undefined);
    });

    it('returns true if the deletion was successful', async () => {
      // arrange / act
      const result = await postsService.remove(id);

      // assert
      strictEqual(result, true);
    });

    it('returns false if no post was found', async () => {
      // arrange
      id = ObjectId.createFromTime(new Date()).toHexString();

      // act
      const result = await postsService.remove(id);

      // assert
      strictEqual(result, false);
    });
  });
});
