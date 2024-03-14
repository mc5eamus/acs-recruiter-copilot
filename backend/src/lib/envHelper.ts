// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const getResourceConnectionString = (): string => {
  const resourceConnectionString = process.env['CommSvcConnectionString'];

  if (!resourceConnectionString) {
    throw new Error('No ACS connection string provided');
  }

  return resourceConnectionString;
};

export const getEndpoint = (): string => {
  const uri = new URL(process.env['CommSvcEndpointUrl'] as string);
  return `${uri.protocol}//${uri.host}`;
};

export const getAdminUserId = (): string => {
  const adminUserId = process.env['CommSvcAdminUserId'];

  if (!adminUserId) {
    throw new Error('No ACS Admin UserId provided');
  }

  return adminUserId;
};

export const getWebPubSubConnectionString = (): string => {
  const connectionString = process.env['WebPubSubConnectionString'];

  if (!connectionString) {
    throw new Error('No Web PubSub Connection String provided');
  }

  return connectionString;
}

export const getWebPubSubHub = (): string => {
  const connectionString = process.env['WebPubSubHub'];

  if (!connectionString) {
    throw new Error('No Web PubSub Connection String provided');
  }

  return connectionString;
}
