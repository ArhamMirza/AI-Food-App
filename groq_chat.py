from groq import Groq 
import json 
from recipe_retrevier import WebRecipeScraper

groq = Groq(api_key="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") 
client = groq 

MODEL = "llama-3.3-70b-versatile"
# MODEL = "llama3-70b-8192"
APP_ID = "51bdbf67"
APP_KEY = "7303a30626516c6708e55e3059625e4b"
USER_ID = "Arham123"  # Optional: only needed for v2 API

tools = [
    {
        "type": "function",
        "function": {
            "name": "handle_function_call",
            "description": (
                "Handles recipe search by calling the Edamam API through the `handle_function_call`. "
                "Use this ONLY when the user is asking for recipes, cooking instructions, or food-related searches. "
                "Supports filters for cuisine, meal type, diet, and health restrictions. "
                "Do not make up your own filters, only extract meaningful data from the user input"
                "Do NOT use this for general questions, greetings, or non-food related queries."
                
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "arguments_json": {
                        "type": "string",
                        "description": (
                            "A JSON string containing recipe search arguments: "
                            "{'recipe_query': 'chicken curry', 'cuisine_type': 'indian', 'meal_type': 'dinner', 'diet': 'balanced', 'health': 'low-sodium', 'multiple': true}. "
                            "Only recipe_query is required, others are optional filters."
                            "Extract the parameters from the user's input into the json string accordingly"
                        )
                    }
                },
                "required": ["arguments_json"]
            }
        }
    }
]

def handle_function_call(function_name: str, arguments_json: str) -> str:
    """
    Handles function calls with web scraping integration.
    
    Args:
        function_name: Name of the function to call
        arguments_json: JSON string with function arguments
    
    Returns:
        Formatted recipe result
    """
    if function_name == "get_recipe":
        try:
            args = json.loads(arguments_json)
            recipe_query = args.get("recipe_query", "")
            
            if not recipe_query:
                return "Please provide a recipe search term."
            
            # Initialize scraper
            scraper = WebRecipeScraper()
            
            # Extract optional parameters
            filters = {}
            for key in ['cuisine_type', 'meal_type', 'diet', 'health']:
                if key in args and args[key]:
                    filters[key] = args[key]
            
            # Get recipe(s)
            if args.get('multiple', False):
                return scraper.get_multiple_recipes(recipe_query, count=3, **filters)
            else:
                return scraper.get_recipe(recipe_query, detailed=True, **filters)
                
        except json.JSONDecodeError:
            return "Invalid JSON arguments provided."
        except Exception as e:
            return f"Error processing recipe request: {str(e)}"
    else:
        return f"Unknown function: {function_name}"

def main():
    print("🍳 Welcome to your AI Assistant! I can help with recipes and general questions.")
    print("Type 'quit' or 'exit' to end the conversation.\n")
    
    # Initialize conversation history
    conversation_history = [
        {
            "role": "system",
            "content": (
                "You are a helpful AI cokking and recipe assistant that can handle both general questions and recipe searches. "
                "For recipe-related queries (cooking, food recipes, ingredients, meal planning), use the handle_function_call function. Only add filters that the user specifically mentions and dont make them up and leave them blank such as cuisine_type,meal_type,diet,health."
                "the recipe_query should only contain the name of the dish and not the region"
                "For all other queries (general knowledge, conversations, non-food topics), respond normally without using any tools. "
                "Be friendly, helpful, and conversational. When providing recipes, format them nicely for easy reading in the same format as the retrieved recipe with all details mentioned in the content. and also provide url link for reference only if the url is available in the fetched data"
                "Do not hallucinate anything when searching for recipes, only provide information fetched"
                "Do not output any code or giberish, only human like text"
            )
        }
    ]
    
    while True:
        try:
            user_prompt = input("You: ").strip()
            
            if user_prompt.lower() in ['quit', 'exit', 'bye']:
                print("👋 Goodbye! Happy cooking!")
                break
                
            if not user_prompt:
                continue
            
            # Add user message to conversation
            conversation_history.append({
                "role": "user",
                "content": user_prompt,
            })
            
            # Get AI response
            response = client.chat.completions.create(
                model=MODEL,
                messages=conversation_history,
                tools=tools,
                tool_choice="auto",  # Let the model decide when to use tools
                max_tokens=4096
            )
            
            response_message = response.choices[0].message
            
            # Check if the model wants to use tools
            tool_calls = response_message.tool_calls
            if tool_calls:
                # Add the assistant's response (with tool calls) to conversation
                conversation_history.append(response_message)
                
                available_functions = {
                    "handle_function_call": handle_function_call,
                }
                
                # Process each tool call
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_to_call = available_functions.get(function_name)
                    
                    if function_to_call:
                        function_args = json.loads(tool_call.function.arguments)
                        print(function_args)
                        
                        if function_name == "handle_function_call":
                            function_response = function_to_call(
                                arguments_json=function_args.get("arguments_json"), 
                                function_name="get_recipe",
                                app_id=APP_ID,
                                app_key=APP_KEY, 
                                user_id=USER_ID
                            ) 
                        print(function_response)                       
                        # Add tool response to conversation
                        conversation_history.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": str(function_response)  # Convert to string for consistency
                        })
                
                # Get final response after tool execution
                second_response = client.chat.completions.create(
                    model=MODEL,
                    messages=conversation_history
                )
                
                final_content = second_response.choices[0].message.content
                print(f"Assistant: {final_content}")
                
                # Add final response to conversation history
                conversation_history.append({
                    "role": "assistant",
                    "content": final_content
                })
                
            else:
                # No tools needed, just respond normally
                assistant_response = response_message.content
                print(f"Assistant: {assistant_response}")
                
                # Add response to conversation history
                conversation_history.append({
                    "role": "assistant",
                    "content": assistant_response
                })
            
            print()  # Add blank line for readability
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye! Happy cooking!")
            break
        except Exception as e:
            print(f"❌ An error occurred: {e}")
            print("Please try again.\n")

if __name__ == "__main__":
    main()