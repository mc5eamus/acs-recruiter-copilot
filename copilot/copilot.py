import uvicorn
import dotenv
import json
import logging
import os
import sys
from fastapi import Request, FastAPI
from azure.messaging.webpubsubservice import WebPubSubServiceClient
from azure.identity import DefaultAzureCredential
from dapr.clients import DaprClient
from completions import ChatCompletions

dotenv.load_dotenv()

DAPR_STORE_NAME = "statestore"

PROMPT = '''You analyze a job interview conversation and provide a neutral summary on the exchange, 
as well as a tone assessment. The summary must be detailed and analytical, using bullet points.
The tone is scored from 1 to 10, 1 being the most negative sentiment and 10 the most positive one. 
Provide a succinct reasoning on the tone scoring.
The output format is json with the following properties:
{
    "summary": "",
    "tone_score": 1-10,
    "tone": "Very friendly and constructive",
    "reasoning": "succint reasoning on the tone"
}'''

app = FastAPI()

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler(sys.stdout))


pubsub_enpoint = os.getenv("WebPubSubEndpoint")
pubsub_hub = os.getenv("WebPubSubHub")

if (os.getenv("WebPubSubConnectionString")) is not None:
    logger.info("Using connection string for authentication")
    service = WebPubSubServiceClient.from_connection_string(os.getenv("WebPubSubConnectionString"), hub=os.getenv("WebPubSubHub"))
else:
    logger.info("Using DefaultAzureCredential for authentication")
    credential = DefaultAzureCredential()
    service = WebPubSubServiceClient(endpoint=pubsub_enpoint, hub=pubsub_hub, credential=credential)

chat_completions = ChatCompletions( 
    api_endpoint=os.getenv("OpenAiEndpoint"), 
    api_key=os.getenv("OpenAiAPIKey"), 
    engine=os.getenv("OpenAiCompletionsModel"))

@app.post("/conversation")
async def on_conversation_event(request: Request):
    event_data = await request.json()
    logger.info(f"Received event: {event_data}")
    
    data = event_data["data"]
    ctxId = data["contextId"]
    sender = data["sender"]
    if(data["type"] == "chat"):
        content = data["content"]["message"]
    else:
        content = data["content"]

    # if content is of type dict, extract the message 

    logger.info(f"Received conversation event with contextId: {ctxId}")
    logger.info(f"Content: {content}")
    logger.info(f"Type: {type(content)}")

    with DaprClient() as client:
    
        #client.delete_state(DAPR_STORE_NAME, ctxId)
        
        state_response = client.get_state(DAPR_STORE_NAME, ctxId)
        
        if len(state_response.data) > 0:
            convo = json.loads(state_response.data)
        else:
            convo = []

        logger.info(f"Convo: {convo}")
        
        # each convo entry is a dictionary with sender and content
        # if the last sender is the same as the current sender, append the content to the last entry
        # otherwise, append a new entry
        change_of_speaker = False
        if len(convo) > 0 and convo[-1]["sender"] == sender:
            convo[-1]["content"] += " " + content
            logger.info("change of speaker")
        else:
            change_of_speaker = True
            convo.append({"sender": sender, "content": content})
    
        client.save_state(DAPR_STORE_NAME, ctxId, json.dumps(convo))

        if len(convo) > 2 and change_of_speaker:
            logger.info("Generating summary")
            # generate a text out of the convo by joining the content of each entry with a newline
            convo_history = "\n".join( ("- " + entry["sender"] + ": " + entry["content"]) for entry in convo)
            logger.info(f"Convo history: {convo_history}")

            try: 
                output = await chat_completions.generate(PROMPT, convo_history, 2500)
                logger.info(f"Output:\n {output}")
            except Exception as e:
                logger.error(f"Error generating summary: {e}")

            try:
                service.send_to_user(user_id=ctxId + "-recruiter", message=output)
            except Exception as e:
                logger.error(f"Error sending summary: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)