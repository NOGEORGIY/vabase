from dotenv import load_dotenv

from backend.app.services.llm_client import LLMClient
import os

load_dotenv()
cred = os.getenv('GIGACHAT_API_TOKEN')

llm_client = LLMClient(cred, "gigachat-2")
llm_client.get_balance()

print (249748736.0-249743950.0)
