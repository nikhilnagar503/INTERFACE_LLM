"""
Tool Executor - Handles executing tool calls from LLM responses.

This module processes tool_calls from LLM responses, executes the appropriate
tools, and formats results to send back to the LLM.
"""

import json
from typing import Dict, Any, List, Optional
from .base import Tool, ToolRegistry


async def execute_tool_call(
    tool_call: Dict[str, Any],
    tools: List[Tool]
) -> Dict[str, Any]:
    """
    Execute a single tool call from LLM response.
    
    Args:
        tool_call: Tool call from LLM, format:
            {
                "id": "call_abc123",
                "function": {
                    "name": "web_search",
                    "arguments": '{"query": "..."}'
                }
            }
        tools: List of available Tool instances
        
    Returns:
        Tool result message for LLM:
        {
            "tool_call_id": "call_abc123",
            "role": "tool",
            "content": '{"results": [...]}'
        }
    """
    tool_call_id = tool_call.get("id", "")
    function_data = tool_call.get("function", {})
    tool_name = function_data.get("name", "")
    
    # Parse arguments
    try:
        arguments_str = function_data.get("arguments", "{}")
        arguments = json.loads(arguments_str) if isinstance(arguments_str, str) else arguments_str
    except json.JSONDecodeError as e:
        return {
            "tool_call_id": tool_call_id,
            "role": "tool",
            "content": json.dumps({
                "error": f"Invalid tool arguments: {str(e)}"
            })
        }
    
    # Find the tool
    tool = None
    for t in tools:
        if t.name == tool_name:
            tool = t
            break
    
    if not tool:
        return {
            "tool_call_id": tool_call_id,
            "role": "tool",
            "content": json.dumps({
                "error": f"Unknown tool: {tool_name}"
            })
        }
    
    # Execute the tool
    try:
        result = await tool.execute(**arguments)
        return {
            "tool_call_id": tool_call_id,
            "role": "tool",
            "name": tool_name,
            "content": json.dumps(result)
        }
    except Exception as e:
        return {
            "tool_call_id": tool_call_id,
            "role": "tool",
            "name": tool_name,
            "content": json.dumps({
                "error": f"Tool execution failed: {str(e)}"
            })
        }


async def execute_all_tool_calls(
    tool_calls: List[Dict[str, Any]],
    tools: List[Tool]
) -> List[Dict[str, Any]]:
    """
    Execute all tool calls from LLM response.
    
    Args:
        tool_calls: List of tool calls from LLM
        tools: List of available Tool instances
        
    Returns:
        List of tool result messages
    """
    results = []
    for tool_call in tool_calls:
        result = await execute_tool_call(tool_call, tools)
        results.append(result)
    return results


def get_tools_for_provider(
    tools: List[Tool],
    provider: str
) -> List[Dict[str, Any]]:
    """
    Convert tools to format required by specific LLM provider.
    
    Args:
        tools: List of Tool instances
        provider: Provider name ('openai', 'anthropic', 'gemini', 'groq')
        
    Returns:
        List of tool definitions in provider's format
    """
    if not tools:
        return []
    
    if provider in ['openai', 'groq']:
        # OpenAI and Groq use the same format
        return [tool.to_openai_tool() for tool in tools]
    
    elif provider == 'anthropic':
        return [tool.to_anthropic_tool() for tool in tools]
    
    elif provider == 'gemini':
        # Gemini uses a slightly different format
        return [{
            "function_declarations": [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters
                }
                for tool in tools
            ]
        }]
    
    else:
        # Default to OpenAI format
        return [tool.to_openai_tool() for tool in tools]


def parse_tool_calls_from_response(
    response: Any,
    provider: str
) -> Optional[List[Dict[str, Any]]]:
    """
    Parse tool calls from LLM response based on provider format.
    
    Args:
        response: Raw response from LLM provider
        provider: Provider name
        
    Returns:
        List of tool calls in standardized format, or None if no tool calls
    """
    # This will be implemented per-provider in llm_providers.py
    # Just a placeholder for documentation
    pass
