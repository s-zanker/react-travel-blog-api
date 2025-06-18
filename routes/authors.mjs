import express from 'express';
import { authorsService } from '../services/authorsService.mjs';

export const authorsRouter = express.Router();

//findAll
authorsRouter.get('/', async (req, res) => {
  console.log('[GET] /authors route is being called');
  const authors = await authorsService.findAll();
  res.json(authors); //express will send status 200 automatically
});

//findById
authorsRouter.get('/:id', async (req, res) => {
  const { id } = req.params; //destructering from the objekt re.params
  const author = await authorsService.findById(id); //id is here just a string
  if (!author) {
    res.status(404).send({ message: 'author not found' });
    return;
  }
  res.json(author);
});

//create
authorsRouter.post('/', async (req, res) => {
  const newAuthor = req.body;
  const id = await authorsService.create(newAuthor);

  res.status(201).json({ _id: id }); //sending an json object
});

//update
authorsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const newAuthor = req.body;
  const result = await authorsService.update(newAuthor, id);
  if (!result) {
    res.status(404).send({ message: 'author not found for update' });
    return;
  }
  res.json({ _id: id }); //sending JS Object, best practice für REST-APIs after create and update
});
//delete
authorsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await authorsService.remove(id);
  if (!result) {
    res.status(404).send({ message: 'author not found for deletion' });
    return;
  }
  res.status(204).send(); //204 means, it worked, but i am sending no body
});
