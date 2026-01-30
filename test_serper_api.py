import sys
import os
import asyncio
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Explicit path to backend/src
SRC_DIR = r"c:\Users\nagar\Desktop\LLM_INTERFACE\INTERFACE_LLM\backend\src"
sys.path.insert(0, SRC_DIR)

from tools.web_search import WebSearchTool


async def test_web_search():
    tool = WebSearchTool()

    # Read API key from environment
    tool.api_key = os.getenv("SERPER_API_KEY")

    if not tool.api_key:
        raise RuntimeError("SERPER_API_KEY not found in .env file")

    query = "What happened in AI today?"
    print("\n[Test] Query:", query)

    result = await tool.execute(query=query)

    print("\n[Test] Raw result:")
    print(result)

    print("\n[Test] Formatted for LLM:")
    print(tool.format_results_for_llm(result))


if __name__ == "__main__":
    asyncio.run(test_web_search())
