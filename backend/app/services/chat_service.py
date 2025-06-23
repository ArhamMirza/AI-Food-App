from groq import Groq
import json
import httpx
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Import your existing models (assuming they're in a separate file)
from app.models.recipe import RecipeSearchRequest, RecipeSearchWebResponse
from app.schemas.chat_schema import ChatSchema  # Make sure this import is valid
from app.config import settings
import uuid


class ChatService:
    def __init__(self, groq_api_key: str, recipe_api_url: str = settings.RECIPE_API_URL, model: str = "meta-llama/llama-4-maverick-17b-128e-instruct"):
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
                    "description": "Search for recipe information based on user query",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "recipe_query": {
                                "type": "string",
                                "description": "The name of the dish to search for (e.g., 'chicken curry', 'pasta')"
                            },
                            "cuisine_type": {
                                "type": "string",
                                "description": "Optional cuisine filter. Use lowercase values like: 'indian', 'italian', 'mexican', 'chinese', 'thai', etc.",
                                "enum": ["indian", "italian", "mexican", "chinese", "thai", "american", "french", "japanese", "korean", "mediterranean"]
                            },
                            "meal_type": {
                                "type": "string", 
                                "description": "Optional meal type filter. Use lowercase values.",
                                "enum": ["breakfast", "lunch", "dinner", "snack", "dessert"]
                            },
                            "diet": {
                                "type": "string",
                                "description": "Optional diet filter. Use lowercase values.",
                                "enum": ["balanced", "high-protein", "low-carb", "low-fat", "high-fiber", "halal", "kosher", "vegetarian", "vegan"]
                            },
                            "health": {
                                "type": "string",
                                "description": "Optional health filter. Use lowercase values.",
                                "enum": ["low-sodium", "dairy-free", "gluten-free", "sugar-conscious", "egg-free", "peanut-free", "tree-nut-free"]
                            },
                            "multiple": {
                                "type": "boolean",
                                "description": "Set to true to return multiple recipes, false for single recipe",
                                "default": False
                            }
                        },
                        "required": ["recipe_query"],
                        "additionalProperties": False
                    }
                }
            }
        ]

    def get_system_message(self) -> Dict[str, str]:
        """Get the system message for conversation initialization"""
        return {
            "role": "system",
            "content": (
                "You are a helpful highly knowledgeable and professional AI cooking and recipe assistant that can handle questions related to food and cooking and recipe searches only. Do not answer queries that are not related to food or cooking. Answer concisely addressing the query and dont give extra info. "
                "Be friendly, helpful, and conversational with personality. When providing recipes, format them nicely for easy reading in list form with all details such as serving, ingredients, instructions etc. Dont use asteriks (*). "
                "Make sure to consider user preferences, user cooking level and dietary restrictions and adjust recipes accordingly. "
                "Do not hallucinate anything when searching for recipes, only provide information fetched. "
                "Do not output any code or gibberish, only human-like text. "
                "Make sure your response is accurate and do not mix up or make up ingredients or steps. "
                "Make sure your measurements are accurate. "
                "Make sure to mention ingredients in your recipes under ###Ingredients: and instructions under ###Instructions: "
                "Make sure to only give detailed recipes if user specifically asks. "
                "If user asks for food ideas, simply list them and give brief description rather than full recipes. "
                "Make sure all lists are numbered. "
                "\nWhen using the call_recipe_api function:"
                "- Use lowercase values for cuisine_type, meal_type, diet, and health parameters"
                "- Use boolean true/false (not strings) for the multiple parameter"
                "- Only include parameters that are relevant to the user's request"
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
                recipe_response = RecipeSearchWebResponse(**response_data)
                print(f"Recipe API Response: {recipe_response}")
                
                if recipe_response.success:
                    return recipe_response.data
                else:
                    return recipe_response.message or "Recipe search failed"
                    
        except httpx.HTTPError as e:
            error_msg = f"Error calling recipe API: {str(e)}"
            print(error_msg)
            return error_msg
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(error_msg)
            return error_msg

    async def handle_tool_calls(self, tool_calls, conversation_history: List[Dict[str, Any]], search_type: str, conversation_id: str) -> List[Dict[str, Any]]:
        """
        Handle tool calls and return updated conversation history
        
        Args:
            tool_calls: Tool calls from Groq response
            conversation_history: Current conversation history
            search_type: Type of search being performed
            conversation_id: ID of the conversation
            
        Returns:
            Updated conversation history
        """
        try:
            # Create the assistant message with tool calls
            assistant_msg_with_tools = {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": str(tool_call.id),  # Ensure ID is string
                        "type": "function",
                        "function": {
                            "name": str(tool_call.function.name),
                            "arguments": str(tool_call.function.arguments)
                        }
                    } for tool_call in tool_calls
                ]
            }
            
            # Add to conversation history
            conversation_history.append(assistant_msg_with_tools)
            
            # Try to save to database with error handling
            try:
                await ChatSchema.append_message(conversation_id, assistant_msg_with_tools)
                print("Successfully saved assistant message with tool calls to DB")
            except Exception as db_error:
                print(f"Failed to save assistant message to DB: {str(db_error)}")
                # Continue processing even if DB save fails
            
            # Process each tool call
            for tool_call in tool_calls:
                function_name = str(tool_call.function.name)
                tool_call_id = str(tool_call.id)
                print(f"Processing tool call: {function_name} with ID: {tool_call_id}")
                
                if function_name == "call_recipe_api":
                    try:
                        function_args = json.loads(tool_call.function.arguments)
                        print(f"Tool call arguments: {function_args}")
                        
                        # Fix parameter types - convert string booleans to actual booleans
                        if "multiple" in function_args:
                            if isinstance(function_args["multiple"], str):
                                function_args["multiple"] = function_args["multiple"].lower() == "true"
                        
                        # Create RecipeSearchRequest with search_type
                        params = RecipeSearchRequest(**function_args, search_type=search_type)
                        function_response = await self.call_recipe_api(params)
                        print(f"Recipe API response length: {len(str(function_response))}")
                        
                    except json.JSONDecodeError as e:
                        function_response = f"Invalid arguments provided for recipe search: {str(e)}"
                        print(function_response)
                    except Exception as e:
                        function_response = f"Error processing recipe request: {str(e)}"
                        print(function_response)
                else:
                    function_response = f"Unknown function: {function_name}"
                    print(function_response)
                
                # Create tool response message with explicit string conversion
                tool_response_msg = {
                    "tool_call_id": tool_call_id,
                    "role": "tool",
                    "name": function_name,
                    "content": str(function_response)[:10000]  # Limit content length
                }
                
                # Add tool response to conversation history
                conversation_history.append(tool_response_msg)
                
                # Try to save to database with error handling
                try:
                    await ChatSchema.append_message(conversation_id, tool_response_msg)
                    print(f"Successfully saved tool response to DB for call ID: {tool_call_id}")
                except Exception as db_error:
                    print(f"Failed to save tool response to DB: {str(db_error)}")
                    # Continue processing even if DB save fails
            
            return conversation_history
            
        except Exception as e:
            print(f"Error in handle_tool_calls: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Add error message to conversation
            error_msg = {
                "role": "assistant",
                "content": f"I encountered an error while searching for recipes. Please try again."
            }
            conversation_history.append(error_msg)
            
            # Try to save error message
            try:
                await ChatSchema.append_message(conversation_id, error_msg)
            except:
                pass  # Ignore DB errors when saving error messages
                
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
        """Generate a unique conversation ID"""
        while True:
            new_id = str(uuid.uuid4())
            existing = await ChatSchema.find_by_conversation_id(new_id)
            if not existing:
                return new_id

    def sanitize_messages(self, messages: list[dict]) -> list[dict]:
        """
        Sanitize messages for Groq API by keeping only allowed keys
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            Sanitized list of messages
        """
        allowed_keys = {"role", "content", "name", "tool_calls", "tool_call_id"}
        sanitized = []
        
        for msg in messages:
            sanitized_msg = {k: v for k, v in msg.items() if k in allowed_keys}
            # Ensure required fields are present
            if "role" in sanitized_msg:
                sanitized.append(sanitized_msg)
        
        return sanitized

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
            search_type: Type of search to perform

        Returns:
            Tuple of (AI response, conversation_id)
        """
        try:
            # Load conversation (must already exist)
            chat_doc = await ChatSchema.find_by_conversation_id(conversation_id)
            if not chat_doc:
                raise ValueError("Conversation does not exist. Create it before sending messages.")

            conversation_history = chat_doc["messages"]

            # Modify user message when search is enabled
            if search:
                enhanced_message = f"{message}\n\nIMPORTANT: Please only provide information from the fetched recipe content and include reference URL links where available. Do not add information from your general knowledge."
                user_msg = {"role": "user", "content": enhanced_message}
            else:
                user_msg = {"role": "user", "content": message}
            
            conversation_history.append(user_msg)
            await ChatSchema.append_message(conversation_id, user_msg)

            # Sanitize conversation history for Groq API
            sanitized_history = self.sanitize_messages(conversation_history)
            
            print(f"Sanitized history length: {len(sanitized_history)}")
            if search:
                print("Search mode enabled - forcing tool call")

            # Call Groq model
            try:
                if search:
                    print("Making Groq API call with tool choice")
                    response = self.groq_client.chat.completions.create(
                        model=self.model,
                        messages=sanitized_history,
                        tools=self.tools,
                        tool_choice={"type": "function", "function": {"name": "call_recipe_api"}},
                        max_tokens=4096
                    )
                else:
                    print("Making regular Groq API call")
                    response = self.groq_client.chat.completions.create(
                        model=self.model,
                        messages=sanitized_history,
                        max_tokens=4096
                    )
                    
            except Exception as e:
                print(f"Groq API error: {e}")
                print(f"Last few messages sent to Groq: {json.dumps(sanitized_history[-3:], indent=2)}")
                raise e

            response_message = response.choices[0].message
            print(f"Got response from Groq. Has tool calls: {response_message.tool_calls is not None}")

            # Handle tool calls if present
            tool_calls = response_message.tool_calls
            if tool_calls:
                print(f"Processing {len(tool_calls)} tool calls")
                
                # Handle tool calls and update conversation history
                conversation_history = await self.handle_tool_calls(
                    tool_calls, conversation_history, search_type, conversation_id
                )
                
                # Sanitize updated history for second API call
                sanitized_history = self.sanitize_messages(conversation_history)
                
                print("Making second Groq API call after tool execution")
                try:
                    second_response = self.groq_client.chat.completions.create(
                        model=self.model,
                        messages=sanitized_history,
                        max_tokens=4096
                    )
                    
                    final_content = second_response.choices[0].message.content
                    
                    # Add final assistant response
                    assistant_msg = {"role": "assistant", "content": final_content}
                    conversation_history.append(assistant_msg)
                    await ChatSchema.append_message(conversation_id, assistant_msg)
                    
                    return final_content, conversation_id
                    
                except Exception as e:
                    print(f"Error in second Groq API call: {e}")
                    print(f"Messages sent: {json.dumps(sanitized_history[-5:], indent=2)}")
                    raise e
            else:
                # No tool calls, just return the regular response
                final_content = response_message.content
                assistant_msg = {"role": "assistant", "content": final_content}
                conversation_history.append(assistant_msg)
                await ChatSchema.append_message(conversation_id, assistant_msg)
                
                return final_content, conversation_id
                
        except Exception as e:
            print(f"Error in process_message: {str(e)}")
            # Return error message to user
            error_response = "I apologize, but I encountered an error while processing your request. Please try again."
            
            # Try to save error message to conversation if possible
            try:
                error_msg = {"role": "assistant", "content": error_response}
                await ChatSchema.append_message(conversation_id, error_msg)
            except:
                pass  # If we can't save to DB, at least return the error message
                
            return error_response, conversation_id