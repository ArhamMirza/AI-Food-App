from groq import Groq
import json
import httpx
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# Import your existing models (assuming they're in a separate file)
from app.models.recipe import RecipeSearchRequest, RecipeSearchResponse

class ChatService:
    def __init__(self, groq_api_key: str, recipe_api_url: str = "http://localhost:8000/api/v1/recipe/search", model: str = "llama-3.3-70b-versatile"):
        """
        Initialize the ChatService
        
        Args:
            groq_api_key: API key for Groq
            recipe_api_url: URL for the recipe search API
            model: Groq model to use
        """
        self.groq_client = Groq(api_key=groq_api_key)
        self.recipe_api_url = recipe_api_url
        self.model = model
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        
        # Tool definition for Groq
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_recipes",
                    "description": (
                        "Searches for recipes by calling the recipe API. "
                        "Use this ONLY when the user is asking for recipes, cooking instructions, or food-related searches. "
                        "Supports filters for cuisine, meal type, diet, and health restrictions. "
                        "Do not make up your own filters, only extract meaningful data from the user input. "
                        "Do NOT use this for general questions, greetings, or non-food related queries."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "recipe_query": {
                                "type": "string",
                                "description": "The name of the dish to search for (e.g., 'chicken curry', 'pasta')"
                            },
                            "cuisine_type": {
                                "type": "string",
                                "description": "Optional cuisine filter (e.g., 'indian', 'italian', 'mexican')"
                            },
                            "meal_type": {
                                "type": "string",
                                "description": "Optional meal type filter (e.g., 'breakfast', 'lunch', 'dinner')"
                            },
                            "diet": {
                                "type": "string",
                                "description": "Optional diet filter (e.g., 'balanced', 'high-protein', 'low-carb')"
                            },
                            "health": {
                                "type": "string",
                                "description": "Optional health filter (e.g., 'low-sodium', 'dairy-free', 'gluten-free')"
                            },
                            "multiple": {
                                "type": "boolean",
                                "description": "Whether to return multiple recipes (default: false)"
                            }
                        },
                        "required": ["recipe_query"]
                    }
                }
            }
        ]

    def get_system_message(self) -> Dict[str, str]:
        """Get the system message for conversation initialization"""
        return {
            "role": "system",
            "content": (
                "You are a helpful AI cooking and recipe assistant that can handle both general questions and recipe searches. "
                "For recipe-related queries (cooking, food recipes, ingredients, meal planning), use the search_recipes function. "
                "Only add filters that the user specifically mentions and don't make them up - leave them blank such as cuisine_type, meal_type, diet, health. "
                "The recipe_query should only contain the name of the dish and not the region. "
                "For all other queries (general knowledge, conversations, non-food topics), respond normally without using any tools. "
                "Be friendly, helpful, and conversational. When providing recipes, format them nicely for easy reading with all details mentioned in the content. "
                "Do not hallucinate anything when searching for recipes, only provide information fetched. "
                "Do not output any code or gibberish, only human-like text."
            )
        }

    async def call_recipe_api(self, params: RecipeSearchRequest) -> str:
        """
        Call the recipe search API
        
        Args:
            params: Recipe search parameters
            
        Returns:
            Recipe data or error message
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.recipe_api_url,
                    json=params.dict(exclude_none=True),
                    timeout=30.0
                )
                response.raise_for_status()
                
                # Parse the response as RecipeSearchResponse model
                response_data = response.json()
                recipe_response = RecipeSearchResponse(**response_data)
                
                if recipe_response.success:
                    return recipe_response.data
                else:
                    return recipe_response.message or "Recipe search failed"
                    
        except httpx.HTTPError as e:
            return f"Error calling recipe API: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"

    async def handle_tool_calls(self, tool_calls, conversation_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Handle tool calls and return updated conversation history
        
        Args:
            tool_calls: Tool calls from Groq response
            conversation_history: Current conversation history
            
        Returns:
            Updated conversation history
        """
        # Add the assistant's response (with tool calls) to conversation
        conversation_history.append({
            "role": "assistant",
            "tool_calls": [
                {
                    "id": tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                } for tool_call in tool_calls
            ]
        })
        
        # Process each tool call
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            
            if function_name == "search_recipes":
                try:
                    function_args = json.loads(tool_call.function.arguments)
                    params = RecipeSearchRequest(**function_args)
                    function_response = await self.call_recipe_api(params)
                except json.JSONDecodeError:
                    function_response = "Invalid arguments provided for recipe search."
                except Exception as e:
                    function_response = f"Error processing recipe request: {str(e)}"
            else:
                function_response = f"Unknown function: {function_name}"
            
            # Add tool response to conversation
            conversation_history.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": str(function_response)
            })
        
        return conversation_history

    def get_conversation(self, conversation_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get conversation history by ID
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Conversation history or None if not found
        """
        return self.conversations.get(conversation_id)

    def create_conversation(self, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Create a new conversation
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            New conversation history with system message
        """
        conversation_history = [self.get_system_message()]
        self.conversations[conversation_id] = conversation_history
        return conversation_history

    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            True if deleted, False if not found
        """
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            return True
        return False

    def list_conversations(self) -> List[str]:
        """
        List all conversation IDs
        
        Returns:
            List of conversation IDs
        """
        return list(self.conversations.keys())

    async def process_message(self, message: str, conversation_id: Optional[str] = None) -> tuple[str, str]:
        """
        Process a user message and return AI response
        
        Args:
            message: User message
            conversation_id: Optional conversation ID
            
        Returns:
            Tuple of (ai_response, conversation_id)
        """
        # Initialize or get conversation history
        print(conversation_id)
        if conversation_id and conversation_id in self.conversations:
            conversation_history = self.conversations[conversation_id]
        else:
            conversation_id = f"{len(self.conversations)+1}"
            conversation_history = self.create_conversation(conversation_id)
        
        # Add user message to conversation
        conversation_history.append({
            "role": "user",
            "content": message,
        })
        
        # Get AI response
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=conversation_history,
            tools=self.tools,
            tool_choice="auto",
            max_tokens=4096
        )
        
        response_message = response.choices[0].message
        
        # Check if the model wants to use tools
        tool_calls = response_message.tool_calls
        if tool_calls:
            # Handle tool calls
            conversation_history = await self.handle_tool_calls(tool_calls, conversation_history)
            
            # Get final response after tool execution
            second_response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=conversation_history
            )
            
            final_content = second_response.choices[0].message.content
            
            # Add final response to conversation history
            conversation_history.append({
                "role": "assistant",
                "content": final_content
            })
            
            return final_content, conversation_id
        else:
            # No tools needed, just respond normally
            assistant_response = response_message.content
            
            # Add response to conversation history
            conversation_history.append({
                "role": "assistant",
                "content": assistant_response
            })
            
            return assistant_response, conversation_id