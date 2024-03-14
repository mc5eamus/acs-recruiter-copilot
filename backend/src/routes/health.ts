import * as express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => res.send('i am fine, thx'));

export default router;
