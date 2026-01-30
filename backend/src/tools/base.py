"""
Base classes for tool system.

Tools are external capabilities that LLMs can call during conversations.
Each tool has:
- name: Unique identifier (e.g., "web_search")
- description: What the tool does (helps LLM decide when to use it)
- parameters: JSON Schema defining the inputs the tool accepts
- execute(): Method that runs the tool and returns results
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json


class Tool(ABC):
    """
    Abstract base class for all tools.
    
    Subclasses must implement:
    - name (str): Unique tool identifier
    - description (str): What the tool does
    - parameters (property): JSON Schema for tool parameters
    - execute(): Async method to run the tool
    """
    
    name: str = ""
    description: str = ""
    
    # API key injected at runtime (if tool needs external API)
    api_key: Optional[str] = None
    
    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """
        Return JSON Schema for tool parameters.
        
        Example:
        {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                }
            },
            "required": ["query"]
        }
        """
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the tool with given parameters.
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            Dict with tool results or error
        """
        pass
    
    def to_openai_tool(self) -> Dict[str, Any]:
        """
        Convert tool to OpenAI function calling format.
        
        Returns:
            Dict in OpenAI tools format
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }
    
    def to_anthropic_tool(self) -> Dict[str, Any]:
        """
        Convert tool to Anthropic tool use format.
        
        Returns:
            Dict in Anthropic tools format
        """
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.parameters
        }
    
    def __repr__(self) -> str:
        return f"<Tool: {self.name}>"


class ToolRegistry:
    """
    Registry of available tools.
    
    Provides methods to:
    - Register tools
    - Get tools by name
    - Get all registered tools
    - Get enabled tools based on user config
    """
    
    _tools: Dict[str, Tool] = {}
    
    @classmethod
    def register(cls, tool: Tool) -> None:
        """
        Register a tool in the registry.
        
        Args:
            tool: Tool instance to register
        """
        if not tool.name:
            raise ValueError("Tool must have a name")
        cls._tools[tool.name] = tool
        print(f"[ToolRegistry] Registered tool: {tool.name}")
    
    @classmethod
    def get(cls, name: str) -> Optional[Tool]:
        """
        Get a tool by name.
        
        Args:
            name: Tool name
            
        Returns:
            Tool instance or None if not found
        """
        return cls._tools.get(name)
    
    @classmethod
    def get_all(cls) -> List[Tool]:
        """
        Get all registered tools.
        
        Returns:
            List of all Tool instances
        """
        return list(cls._tools.values())
    
    @classmethod
    def get_tool_names(cls) -> List[str]:
        """
        Get names of all registered tools.
        
        Returns:
            List of tool names
        """
        return list(cls._tools.keys())
    
    @classmethod
    def get_enabled_tools(cls, tool_configs: List[Dict[str, Any]]) -> List[Tool]:
        """
        Get Tool instances for enabled tools with API keys injected.
        
        Args:
            tool_configs: List of tool configurations from frontend
                         [{"name": "web_search", "api_key": "xxx"}, ...]
        
        Returns:
            List of Tool instances with API keys set
        """
        tools = []
        for config in tool_configs:
            tool_name = config.get('name')
            tool = cls.get(tool_name)
            
            if tool:
                # Create a copy to avoid modifying the registered instance
                import copy
                tool_instance = copy.copy(tool)
                tool_instance.api_key = config.get('api_key')
                tools.append(tool_instance)
            else:
                print(f"[ToolRegistry] Warning: Unknown tool '{tool_name}'")
        
        return tools
    
    @classmethod
    def clear(cls) -> None:
        """Clear all registered tools (useful for testing)."""
        cls._tools.clear()
