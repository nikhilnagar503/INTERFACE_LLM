"""
Web Search Tool - Search the internet using Serper API.

Serper (serper.dev) provides Google Search results via API.
Free tier: 2,500 searches/month

Usage:
    tool = WebSearchTool()
    tool.api_key = "your-serper-api-key"
    result = await tool.execute(query="latest news about AI")
"""

import httpx
from typing import Dict, Any, List
from .base import Tool, ToolRegistry


class WebSearchTool(Tool):
    """
    Web search tool using Serper API (Google Search).
    
    Allows LLM to search the internet for current information.
    """
    
    name = "web_search"
    description = (
        "Search the web for current information. "
        "Use this when you need up-to-date information, facts you're unsure about, "
        "or when the user asks about recent events, news, weather, prices, etc."
    )
    
    # Number of search results to return
    num_results: int = 5
    
    @property
    def parameters(self) -> Dict[str, Any]:
        """JSON Schema for web search parameters."""
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to look up on the web"
                }
            },
            "required": ["query"]
        }
    
    async def execute(self, query: str) -> Dict[str, Any]:
        """
        Execute web search via Serper API.
        
        Args:
            query: Search query string
            
        Returns:
            Dict with search results or error:
            {
                "query": "original query",
                "results": [
                    {"title": "...", "link": "...", "snippet": "..."},
                    ...
                ]
            }
        """
        if not self.api_key:
            return {
                "error": "Web search API key not configured",
                "query": query
            }
        
        if not query or not query.strip():
            return {
                "error": "Empty search query",
                "query": query
            }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://google.serper.dev/search",
                    headers={
                        "X-API-KEY": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "q": query.strip(),
                        "num": self.num_results
                    }
                )
                
                if response.status_code == 401:
                    return {
                        "error": "Invalid Serper API key",
                        "query": query
                    }
                
                if response.status_code == 429:
                    return {
                        "error": "Serper API rate limit exceeded",
                        "query": query
                    }
                
                if response.status_code != 200:
                    return {
                        "error": f"Search failed with status {response.status_code}",
                        "query": query
                    }
                
                data = response.json()
                
                # Extract organic search results
                results = []
                for item in data.get("organic", [])[:self.num_results]:
                    results.append({
                        "title": item.get("title", ""),
                        "link": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    })
                
                # Also include answer box if available (direct answer)
                answer_box = data.get("answerBox")
                if answer_box:
                    answer_text = answer_box.get("answer") or answer_box.get("snippet", "")
                    if answer_text:
                        results.insert(0, {
                            "title": "Direct Answer",
                            "link": "",
                            "snippet": answer_text
                        })
                
                # Include knowledge graph if available
                knowledge_graph = data.get("knowledgeGraph")
                if knowledge_graph:
                    kg_description = knowledge_graph.get("description", "")
                    if kg_description:
                        results.insert(0, {
                            "title": knowledge_graph.get("title", "Knowledge Graph"),
                            "link": knowledge_graph.get("website", ""),
                            "snippet": kg_description
                        })
                
                return  {
                    "query": query,
                    "results": results[:self.num_results],  # Limit total results
                    "total_found": len(data.get("organic", []))
                }
                
                # final_response = {
                #                     "query": query,
                #                     "results": results[:self.num_results],
                #                     "total_found": len(data.get("organic", []))
                #                 }

                # print("\n[WebSearchTool] Final response returned:")
                # print(final_response)

                # return final_response
                
        except httpx.TimeoutException:
            return {
                "error": "Search request timed out",
                "query": query
            }
        except httpx.RequestError as e:
            return {
                "error": f"Search request failed: {str(e)}",
                "query": query
            }
        except Exception as e:
            return {
                "error": f"Unexpected error during search: {str(e)}",
                "query": query
            }
    
    def format_results_for_llm(self, results: Dict[str, Any]) -> str:
        """
        Format search results as text for LLM consumption.
        
        Args:
            results: Results from execute()
            
        Returns:
            Formatted string for LLM
        """
        if "error" in results:
            return f"Search error: {results['error']}"
        
        output = f"Search results for: {results['query']}\n\n"
        
        for i, result in enumerate(results.get("results", []), 1):
            output += f"{i}. {result['title']}\n"
            if result['link']:
                output += f"   URL: {result['link']}\n"
            output += f"   {result['snippet']}\n\n"
        
        if not results.get("results"):
            output += "No results found."
        
        return output


# Register the tool automatically when module is imported
ToolRegistry.register(WebSearchTool())
