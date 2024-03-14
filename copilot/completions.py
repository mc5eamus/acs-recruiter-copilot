from openai import AsyncAzureOpenAI

class ChatCompletions:
    """
    A helper to call the OpenAI chat completions endpoint. 
    """
    def __init__(self, api_endpoint, api_key, engine):
        self.engine = engine

        self.client = AsyncAzureOpenAI(
            azure_endpoint=api_endpoint,
            api_key = api_key,
            api_version = "2023-12-01-preview")


    async def generate(self, prompt: str, text: str, max_tokens: int = 1000):
        content = [ {"type": "text", "text": text} ]

        response = await self.client.chat.completions.create(
            model=self.engine,
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },  
                {
                    "role": "user",
                    "content": content,
                }
            ],
            max_tokens=max_tokens,
            )
        return response.choices[0].message.content