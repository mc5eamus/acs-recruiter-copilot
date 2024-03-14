import { GroupCallLocator } from '@azure/communication-calling';
import { v1 as createGUID } from 'uuid';
import { CallAndChatLocator } from '@azure/communication-react';

export interface CredentialsResponse {
    endpoint: string;
    token: string;
    expiresOn: Date;
    user: {
        communicationUserId: string;
    };
}

declare var API_BASE_URL: any;
const negotiateBaseUrl = API_BASE_URL

export const createAnonymousCredentials = async () : Promise<CredentialsResponse> => {
    const endpoint_response = await fetch(`${negotiateBaseUrl}/getEndpointUrl`);
    const endpoint = await endpoint_response.text()
    const token_response = await fetch(`${negotiateBaseUrl}/token`, {method: 'POST'});
    const token_payload = await token_response.json();
    return {...token_payload, endpoint};
}

export const getPubSubToken = async (userId: string): Promise<string> => {
  const response = await fetch(`${negotiateBaseUrl}/pubsub/${userId}`, { method: 'POST' });
  if (response.status === 200) {
    return await response.text();
  } else {
    throw new Error('Failed at retrieving a pubsub url ' + response.status);
  }

}


export const createThread = async (): Promise<string> => {
  try {
    const requestOptions = {
      method: 'POST'
    };
    const response = await fetch(`${negotiateBaseUrl}/createThread`, requestOptions);
    if (response.status === 200) {
      return await response.text();
    } else {
      throw new Error('Failed at creating thread ' + response.status);
    }
  } catch (error) {
    console.error('Failed creating thread, Error: ', error);
    throw new Error('Failed at creating thread');
  }
};

export const joinThread = async (threadId: string, userId: string, displayName: string): Promise<boolean> => {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Id: userId, DisplayName: displayName })
    };
    const response = await fetch(`${negotiateBaseUrl}/addUser/${threadId}`, requestOptions);
    if (response.status === 201) {
      return true;
    }
  } catch (error) {
    console.error('Failed at adding user, Error: ', error);
  }
  return false;
};

export const getExistingThreadIdFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const threadId = urlParams.get('threadId');
  return threadId;
};

export const getExistingGroupIdFromURL = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId');
  return groupId;
};

export const createExternalUserCallWithChat = async (displayName: string)
    : Promise<{endpointUrl: string, token: string, userId: string, locator: CallAndChatLocator}> => {
        const credentials = await createAnonymousCredentials();
        const callWithChatLocator = await createCallWithChat(
            credentials.user.communicationUserId, 
            displayName);
        return {
            endpointUrl: credentials.endpoint,
            token: credentials.token,
            userId: credentials.user.communicationUserId,
            locator: callWithChatLocator
        };
    }

export const createCallWithChat = async (
  userId: string,
  displayName: string
): Promise<{ callLocator: GroupCallLocator; chatThreadId: string }> => {
  const locator = { groupId: getExistingGroupIdFromURL() ?? createGUID() };
  
  let threadId = getExistingThreadIdFromURL();

  if(!threadId) {
    threadId = await createThread( );
  }
  const joined = await joinThread(threadId, userId, displayName);
  if (!joined) {
    throw 'Server could not add participants to the chat thread';
  }
  
  // get the window location up to the url path
  const basePageUrl = window.location.href.split('?')[0];
  
  return {
    callLocator: locator,
    chatThreadId: threadId
  };
};