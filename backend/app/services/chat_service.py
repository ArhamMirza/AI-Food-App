from groq import Groq
import json
import httpx
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Import your existing models (assuming they're in a separate file)
from app.models.recipe import RecipeSearchRequest, RecipeSearchResponse
from app.schemas.chat_schema import ChatSchema  # Make sure this import is valid
import uuid


class ChatService:
    def __init__(self, groq_api_key: str, recipe_api_url: str = "http://localhost:8000/api/v1/recipe/search", model: str = "meta-llama/llama-4-maverick-17b-128e-instruct"):
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
                    "name": "call_recipe_api",
                    "description": (
                        "Searches the web for information. "
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
                "You are a helpful highly knowledgable and professional AI cooking and recipe assistant that can handle questions related to food and cooking and recipe searches only. Do not answer queries that are not related to food or cooking"
                # "The recipe_query should contain the user query formatted as a concise google search query"
                "Be friendly, helpful, and conversational with personality. When providing recipes, format them nicely for easy reading in list form with all details such as serving,ingredients, instructions etc. Dont use asteriks (*) "
                "Make sure to consider user preferences, user cooking level and dietery restrictions and adjust recipes accordingly."
                "Do not hallucinate anything when searching for recipes, only provide information fetched. "
                "Do not output any code or gibberish, only human-like text."
                "Make sure your response is accurate and do not mix up or make up ingredients or steps"
                "Make sure your measurements are accurate"
                
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
                print(recipe_response)
                
                if recipe_response.success:
                    return recipe_response.data
                else:
                    return recipe_response.message or "Recipe search failed"
                    
        except httpx.HTTPError as e:
            return f"Error calling recipe API: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"

    async def handle_tool_calls(self, tool_calls, conversation_history: List[Dict[str, Any]], search_type) -> List[Dict[str, Any]]:
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
            
            if function_name == "call_recipe_api":
                try:
                    function_args = json.loads(tool_call.function.arguments)
                    params = RecipeSearchRequest(**function_args, search_type=search_type)
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
    
    async def generate_unique_conversation_id(self) -> str:
        while True:
            new_id = str(uuid.uuid4())
            existing = await ChatSchema.find_by_conversation_id(new_id)
            if not existing:
                return new_id


    async def process_message(
        self, message: str, user_id: str, conversation_id: str, search: bool = False, search_type: str = ""
    ) -> tuple[str, str]:
        """
        Process a user message and return AI response.

        Args:
            message: User's message
            user_id: User identifier
            conversation_id: Existing conversation ID
            search: Whether to force tool call

        Returns:
            Tuple of (AI response, conversation_id)
        """

        def sanitize_messages(messages: list[dict]) -> list[dict]:
            allowed_keys = {"role", "content", "name", "tool_calls", "tool_call_id"}
            return [{k: v for k, v in msg.items() if k in allowed_keys} for msg in messages]

        # Load conversation (must already exist)
        chat_doc = await ChatSchema.find_by_conversation_id(conversation_id)
        if not chat_doc:
            raise ValueError("Conversation does not exist. Create it before sending messages.")

        conversation_history = chat_doc["messages"]

        # Add user message
        user_msg = {"role": "user", "content": message}
        conversation_history.append(user_msg)
        await ChatSchema.append_message(conversation_id, user_msg)

        # Sanitize conversation history
        sanitized_history = sanitize_messages(conversation_history)

        # Call model
        if search:
            print("Searching")
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=sanitized_history,
                tools=self.tools,
                tool_choice={"type": "function", "function": {"name": "call_recipe_api"}},
                max_tokens=4096
            )
        else:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=sanitized_history,
                max_tokens=4096
            )

        response_message = response.choices[0].message

        # Tool call handling
        tool_calls = response_message.tool_calls
        if tool_calls:
            conversation_history = await self.handle_tool_calls(tool_calls, conversation_history, search_type)
            sanitized_history = sanitize_messages(conversation_history)
            second_response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=sanitized_history,
                max_tokens=4096
            )
            final_content = second_response.choices[0].message.content
            assistant_msg = {"role": "assistant", "content": final_content}
            conversation_history.append(assistant_msg)
            await ChatSchema.append_message(conversation_id, assistant_msg)
            return final_content, conversation_id
        else:
            assistant_msg = {"role": "assistant", "content": response_message.content}
            conversation_history.append(assistant_msg)
            await ChatSchema.append_message(conversation_id, assistant_msg)
            return response_message.content, conversation_id
