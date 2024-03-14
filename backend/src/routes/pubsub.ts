// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as express from 'express';
import { WebPubSubServiceClient } from '@azure/web-pubsub';
import { getWebPubSubConnectionString, getWebPubSubHub } from '../lib/envHelper';


const router = express.Router();

/**
 * route: /refreshToken/[id]
 *
 * purpose: Get a new token for the given user id.
 *
 * @param id: id of the user
 *
 * @returns the user object with token details
 *
 */

router.post('/:id', async function (req, res, next) {
  if (!req.params['id']) {
    res.sendStatus(404);
  }

  let userId = req.params['id'];

  let service = new WebPubSubServiceClient(getWebPubSubConnectionString(), getWebPubSubHub());
  let token = await service.getClientAccessToken({ userId: userId })

  res.send(token.url);
});

export default router;
