import requests
import json
import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class WebRecipeScraper:
    """
    Web-based recipe scraper that searches across multiple cooking websites
    and extracts recipe details using web scraping techniques.
    """
    
    def __init__(self):
        """Initialize the web recipe scraper."""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        # Popular recipe websites to search
        self.recipe_sites = [
            'food.com',
        ]
    
    def search_recipes(self, query: str, limit: int = 10, **filters) -> List[Dict]:
        """
        Search for recipes using Google search across recipe websites.
        
        Args:
            query: Recipe search term
            limit: Number of results to return
            **filters: Additional filters (cuisine_type, meal_type, etc.)
        
        Returns:
            List of recipe dictionaries
        """
        recipes = []
        search_query = self._build_search_query(query, **filters)
        
        try:
            # Search Google for recipes
            recipe_urls = self._google_search_recipes(search_query, limit)
            print(recipe_urls)
            
            # Scrape each recipe URL
            for url in recipe_urls[:limit]:
                print(url)
                try:
                    recipe = self._scrape_recipe(url)
                    if recipe:
                        recipes.append(recipe)
                    time.sleep(random.uniform(1, 2))  # Be respectful to servers
                except Exception as e:
                    print(f"Error scraping {url}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error searching recipes: {e}")
        
        return recipes
    
    def get_recipe(self, recipe_query: str, detailed: bool = True, **filters) -> str:
        """
        Get the best matching recipe for a query with formatted output.
        
        Args:
            recipe_query: Search term for the recipe
            detailed: Whether to return full recipe details or summary
            **filters: Additional search filters
        
        Returns:
            Formatted recipe string
        """
        recipes = self.search_recipes(recipe_query, limit=5, **filters)
        
        if not recipes:
            return f"No recipes found for '{recipe_query}'. Please try a different search term."
        
        # Return the best match (first result)
        best_recipe = recipes[0]
        
        if detailed:
            return self._format_detailed_recipe(best_recipe)
        else:
            return self._format_summary_recipe(best_recipe)
    
    def get_multiple_recipes(self, recipe_query: str, count: int = 3, **filters) -> str:
        """
        Get multiple recipe options for a query.
        
        Args:
            recipe_query: Search term
            count: Number of recipes to return
            **filters: Additional search filters
        
        Returns:
            Formatted string with multiple recipe options
        """
        recipes = self.search_recipes(recipe_query, limit=count, **filters)
        
        if not recipes:
            return f"No recipes found for '{recipe_query}'."
        
        output = [f"# Recipe Options for '{recipe_query}'\n"]
        
        for i, recipe in enumerate(recipes, 1):
            output.append(f"## Option {i}: {recipe['title']}")
            if recipe['cuisine_type']:
                output.append(f"**Cuisine:** {recipe['cuisine_type']}")
            if recipe['prep_time']:
                output.append(f"**Prep Time:** {recipe['prep_time']}")
            if recipe['servings']:
                output.append(f"**Servings:** {recipe['servings']}")
            if recipe['calories']:
                output.append(f"**Calories:** {recipe['calories']} per serving")
            output.append(f"**Source:** {recipe['source']}")
            output.append(f"**URL:** {recipe['url']}")
            output.append("")
        
        return "\n".join(output)
    
    def _build_search_query(self, query: str, **filters) -> str:
        """Build a Google search query with filters."""
        search_terms = [query]
        
        # Add filter terms
        if filters.get('cuisine_type'):
            search_terms.append(filters['cuisine_type'])
        if filters.get('meal_type'):
            search_terms.append(filters['meal_type'])
        if filters.get('diet'):
            search_terms.append(filters['diet'])
        if filters.get('health'):
            health_terms = {
                'vegetarian': 'vegetarian',
                'vegan': 'vegan',
                'gluten-free': 'gluten free',
                'dairy-free': 'dairy free',
                'keto-friendly': 'keto',
                'paleo': 'paleo',
                'low-carb': 'low carb'
            }
            if filters['health'] in health_terms:
                search_terms.append(health_terms[filters['health']])
        
        # Add site restrictions for better recipe results
        
        return '+'.join(search_terms)
    
    def _google_search_recipes(self, query: str, limit: int = 10) -> List[str]:
        """
        Search for recipe URLs using direct site searches.
        This approach is more reliable than trying to scrape Google search results.
        """
        recipe_urls = []
        
        # Search multiple sites directly
        sites_to_search = ['food.com']
        
        for site in sites_to_search:
            if len(recipe_urls) >= limit:
                break
                
            try:
                # Calculate how many recipes to get from each site
                no_recipes = 5
                
                urls = self._search_site_directly(site, query, limit=no_recipes)
                recipe_urls.extend(urls)
                
                # Add small delay between site searches
                time.sleep(1)
                
            except Exception as e:
                print(f"Failed to search {site}: {e}")
                continue
        
        return recipe_urls[:limit]

    def _search_site_directly(self, site: str, query: str, limit: int = 2) -> List[str]:
        """Search a specific recipe site directly using Selenium for dynamic content."""
        try:
            search_urls = {
                'food.com': f'https://www.food.com/search/{query.replace(" ", "+")}',
            }

            if site not in search_urls:
                return []

            print(f"Searching {site} for '{query}'...")
            url = search_urls[site]
            print(url)

            # Setup Selenium with headless Chrome
            options = Options()
            options.add_argument('--headless')  # Run browser in headless mode
            options.add_argument('--disable-gpu')
            options.add_argument('--no-sandbox')
            driver = webdriver.Chrome(options=options)

            # Open the search URL
            driver.get(url)

            # Wait until the search results container loads (adjust timeout as needed)
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div.search-results'))
            )

            # Get the fully rendered page source after JavaScript has run
            html = driver.page_source
            driver.quit()

            soup = BeautifulSoup(html, 'html.parser')
            with open("page_source_prettified.txt", "w", encoding="utf-8") as file:
                file.write(soup.prettify())


            recipe_links = []

            if site == 'food.com':
                # Find all recipe tiles inside the container
                recipe_tiles = soup.select('div.fd-tile.fd-recipe, div.fd-tile.fd-recipe.fd-nophoto')
                print(f"Found {len(recipe_tiles)} recipe tiles")

                for tile in recipe_tiles:
                    url = tile.get('data-url', '')
                    if url and url not in recipe_links:
                        recipe_links.append(url)
                        if len(recipe_links) >= limit:
                            break

                print("Food.com links:", recipe_links)

            print(f"Found {len(recipe_links)} recipe links from {site}")
            return recipe_links

        except Exception as e:
            print(f"Error searching {site}: {e}")
            return []

    
    def _is_recipe_url(self, url: str, site: str) -> bool:
        """Check if a URL looks like a recipe page."""
        recipe_indicators = [
            '/recipe/', '/recipes/', 'recipe-', 'recipes-',
            'dish', 'cook', 'bake', 'make'
        ]
        
        url_lower = url.lower()
        return any(indicator in url_lower for indicator in recipe_indicators)
    
    def _scrape_recipe(self, url: str) -> Optional[Dict]:
        """Scrape recipe details from a URL."""
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to extract JSON-LD structured data first (most reliable)
            recipe_data = self._extract_jsonld_recipe(soup)
            if recipe_data:
                recipe_data['url'] = url
                recipe_data['source'] = urlparse(url).netloc
                return recipe_data
            
            # Fallback to HTML parsing
            return self._extract_html_recipe(soup, url)
            
        except Exception as e:
            print(f"Error scraping recipe from {url}: {e}")
            return None
    
    def _extract_jsonld_recipe(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract recipe from JSON-LD structured data."""
        try:
            # Find JSON-LD script tags
            json_scripts = soup.find_all('script', type='application/ld+json')
            
            for script in json_scripts:
                try:
                    data = json.loads(script.string)
                    
                    # Handle single object or array
                    if isinstance(data, list):
                        data = data[0] if data else {}
                    
                    # Look for Recipe type
                    if data.get('@type') == 'Recipe' or 'Recipe' in str(data.get('@type', '')):
                        return self._parse_jsonld_recipe(data)
                    
                    # Sometimes recipe is nested in other structures
                    if '@graph' in data:
                        for item in data['@graph']:
                            if item.get('@type') == 'Recipe':
                                return self._parse_jsonld_recipe(item)
                                
                except json.JSONDecodeError:
                    continue
                    
        except Exception as e:
            print(f"Error extracting JSON-LD: {e}")
        
        return None
    
    def _parse_jsonld_recipe(self, data: Dict) -> Dict:
        """Parse JSON-LD recipe data into standardized format."""
        # Extract nutrition info
        nutrition = data.get('nutrition', {})
        calories = 0
        if isinstance(nutrition, dict):
            calories = nutrition.get('calories', 0)
        
        # Extract time (convert ISO duration to minutes)
        prep_time = self._parse_duration(data.get('prepTime', ''))
        cook_time = self._parse_duration(data.get('cookTime', ''))
        total_time = self._parse_duration(data.get('totalTime', '')) or (prep_time + cook_time)
        
        # Extract instructions
        instructions = []
        recipe_instructions = data.get('recipeInstructions', [])
        for instruction in recipe_instructions:
            if isinstance(instruction, dict):
                text = instruction.get('text', '')
            elif isinstance(instruction, str):
                text = instruction
            else:
                text = str(instruction)
            
            if text:
                instructions.append(text.strip())
        
        # Extract ingredients
        ingredients = []
        recipe_ingredients = data.get('recipeIngredient', [])
        for ingredient in recipe_ingredients:
            if isinstance(ingredient, str):
                ingredients.append(ingredient.strip())
            else:
                ingredients.append(str(ingredient).strip())
        
        return {
            'title': data.get('name', 'Unknown Recipe'),
            'source': '',  # Will be set by caller
            'url': '',     # Will be set by caller
            'servings': self._extract_number(data.get('recipeYield', '')),
            'prep_time': f"{total_time} minutes" if total_time else '',
            'calories': self._extract_number(calories),
            'cuisine_type': self._extract_cuisine(data),
            'meal_type': '',
            'dish_type': data.get('recipeCategory', ''),
            'diet_labels': [],
            'health_labels': self._extract_diet_info(data),
            'ingredients': ingredients,
            'instructions': '\n'.join(f"{i+1}. {inst}" for i, inst in enumerate(instructions)),
            'image': self._extract_image(data),
            'description': data.get('description', ''),
            'author': self._extract_author(data),
            'rating': self._extract_rating(data)
        }
    
    def _extract_html_recipe(self, soup: BeautifulSoup, url: str) -> Dict:
        """Fallback HTML parsing for recipe extraction with site-specific selectors."""
        site = urlparse(url).netloc.lower()
        print("Web link: "+ site)
        
        # Site-specific selectors for better accuracy
        selectors = {
            'allrecipes.com': {
                'title': ['h1.entry-title', 'h1', '.recipe-summary__h1'],
                'ingredients': ['.recipe-ingred_txt', '.ingredients-item-name', '.recipe-ingredient'],
                'instructions': ['.recipe-directions__list--item', '.instructions-section li', '.recipe-instruction']
            },
            'food.com': {
                'title': ['h1.recipe-title', 'h1', '.fn'],
                'ingredients': ['.recipe-ingredients li', '.ingredients li'],
                'instructions': ['.recipe-directions li', '.instructions li']
            },
            'simplyrecipes.com': {
                'title': ['h1.entry-title', 'h1', '.recipe-title'],
                'ingredients': ['.recipe-ingredient', '.ingredients li'],
                'instructions': ['.recipe-instruction', '.instructions li']
            },
            'default': {
                'title': ['h1.recipe-title', 'h1', '.recipe-name', '.entry-title', 'h1'],
                'ingredients': ['.recipe-ingredient', '.ingredient', '.recipe-ingredients li', '.ingredients li', '[class*="ingredient"]'],
                'instructions': ['.recipe-instruction', '.instruction', '.recipe-instructions li', '.instructions li', '.directions li', '[class*="instruction"]']
            }
        }
        
        # Get selectors for this site or use default
        site_selectors = selectors.get(site, selectors['default'])
        
        # Extract title
        title = ''
        for selector in site_selectors['title']:
            element = soup.select_one(selector)
            if element:
                title = element.get_text(strip=True)
                break
        
        # Extract ingredients
        ingredients = []
        for selector in site_selectors['ingredients']:
            elements = soup.select(selector)
            if elements:
                ingredients = [elem.get_text(strip=True) for elem in elements if elem.get_text(strip=True)]
                if ingredients:  # Only break if we found actual ingredients
                    break
        
        # Extract instructions
        instructions = []
        for selector in site_selectors['instructions']:
            elements = soup.select(selector)
            if elements:
                instructions = [elem.get_text(strip=True) for elem in elements if elem.get_text(strip=True)]
                if instructions:  # Only break if we found actual instructions
                    break
        
        # Try to extract other details
        prep_time = self._extract_time_from_html(soup)
        servings = self._extract_servings_from_html(soup)
        
        return {
            'title': title or 'Recipe from ' + site,
            'source': site,
            'url': url,
            'servings': servings,
            'prep_time': prep_time,
            'calories': '',
            'cuisine_type': '',
            'meal_type': '',
            'dish_type': '',
            'diet_labels': [],
            'health_labels': [],
            'ingredients': ingredients,
            'instructions': '\n'.join(f"{i+1}. {inst}" for i, inst in enumerate(instructions)) if instructions else "Instructions not available - please check original recipe",
            'image': self._extract_image_from_html(soup),
            'description': self._extract_description_from_html(soup),
            'author': '',
            'rating': ''
        }
    
    def _extract_time_from_html(self, soup: BeautifulSoup) -> str:
        """Extract prep/cook time from HTML."""
        time_selectors = [
            '[class*="time"]', '[class*="prep"]', '[class*="cook"]',
            '.recipe-time', '.prep-time', '.cook-time', '.total-time'
        ]
        
        for selector in time_selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text(strip=True)
                if any(word in text.lower() for word in ['min', 'hour', 'hr']):
                    return text
        return ''
    
    def _extract_servings_from_html(self, soup: BeautifulSoup) -> str:
        """Extract serving size from HTML."""
        serving_selectors = [
            '[class*="serving"]', '[class*="yield"]', '.recipe-yield',
            '.servings', '.serves'
        ]
        
        for selector in serving_selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text(strip=True)
                numbers = re.findall(r'\d+', text)
                if numbers:
                    return numbers[0]
        return ''
    
    def _extract_image_from_html(self, soup: BeautifulSoup) -> str:
        """Extract recipe image from HTML."""
        # Try to find recipe images
        img_selectors = [
            '.recipe-image img', '.recipe-photo img', '.hero-image img',
            'img[class*="recipe"]', 'img[alt*="recipe"]'
        ]
        
        for selector in img_selectors:
            img = soup.select_one(selector)
            if img:
                src = img.get('src') or img.get('data-src')
                if src:
                    return src
        return ''
    
    def _extract_description_from_html(self, soup: BeautifulSoup) -> str:
        """Extract recipe description from HTML."""
        desc_selectors = [
            '.recipe-description', '.recipe-summary', '.entry-summary',
            '[class*="description"]', '.recipe-intro'
        ]
        
        for selector in desc_selectors:
            element = soup.select_one(selector)
            if element:
                desc = element.get_text(strip=True)
                if len(desc) > 50:  # Only return substantial descriptions
                    return desc
        return ''
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration or time string to minutes."""
        if not duration_str:
            return 0
        
        # Handle ISO 8601 format (PT30M, PT1H30M, etc.)
        if duration_str.startswith('PT'):
            minutes = 0
            # Extract hours
            hours_match = re.search(r'(\d+)H', duration_str)
            if hours_match:
                minutes += int(hours_match.group(1)) * 60
            
            # Extract minutes
            minutes_match = re.search(r'(\d+)M', duration_str)
            if minutes_match:
                minutes += int(minutes_match.group(1))
            
            return minutes
        
        # Handle plain numbers or "30 minutes" format
        numbers = re.findall(r'\d+', duration_str)
        if numbers:
            return int(numbers[0])
        
        return 0
    
    def _extract_number(self, value) -> int:
        """Extract numeric value from various formats."""
        if isinstance(value, (int, float)):
            return int(value)
        
        if isinstance(value, str):
            numbers = re.findall(r'\d+', value)
            if numbers:
                return int(numbers[0])
        
        return 0
    
    def _extract_cuisine(self, data: Dict) -> str:
        """Extract cuisine type from recipe data."""
        cuisine_fields = ['recipeCuisine', 'cuisine']
        for field in cuisine_fields:
            if field in data:
                cuisine = data[field]
                if isinstance(cuisine, list) and cuisine:
                    return cuisine[0]
                elif isinstance(cuisine, str):
                    return cuisine
        return ''
    
    def _extract_diet_info(self, data: Dict) -> List[str]:
        """Extract dietary information."""
        diet_info = []
        suitable_for_diet = data.get('suitableForDiet', [])
        
        if isinstance(suitable_for_diet, list):
            for diet in suitable_for_diet:
                if isinstance(diet, str):
                    diet_info.append(diet.replace('http://schema.org/', ''))
        
        return diet_info
    
    def _extract_image(self, data: Dict) -> str:
        """Extract recipe image URL."""
        image = data.get('image', '')
        if isinstance(image, list) and image:
            return image[0] if isinstance(image[0], str) else image[0].get('url', '')
        elif isinstance(image, dict):
            return image.get('url', '')
        elif isinstance(image, str):
            return image
        return ''
    
    def _extract_author(self, data: Dict) -> str:
        """Extract recipe author."""
        author = data.get('author', '')
        if isinstance(author, dict):
            return author.get('name', '')
        elif isinstance(author, list) and author:
            first_author = author[0]
            if isinstance(first_author, dict):
                return first_author.get('name', '')
            return str(first_author)
        elif isinstance(author, str):
            return author
        return ''
    
    def _extract_rating(self, data: Dict) -> str:
        """Extract recipe rating."""
        rating = data.get('aggregateRating', {})
        if isinstance(rating, dict):
            rating_value = rating.get('ratingValue', '')
            rating_count = rating.get('ratingCount', '')
            if rating_value:
                return f"{rating_value}/5 ({rating_count} reviews)" if rating_count else f"{rating_value}/5"
        return ''
    
    def _format_detailed_recipe(self, recipe: Dict) -> str:
        """Format a complete recipe with all details."""
        output = []
        
        # Title
        output.append(f"# {recipe['title']}\n")
        
        # Basic info
        info_lines = []
        if recipe['author']:
            info_lines.append(f"**Author:** {recipe['author']}")
        if recipe['cuisine_type']:
            info_lines.append(f"**Cuisine:** {recipe['cuisine_type']}")
        if recipe['dish_type']:
            info_lines.append(f"**Dish Type:** {recipe['dish_type']}")
        if recipe['prep_time']:
            info_lines.append(f"**Total Time:** {recipe['prep_time']}")
        if recipe['servings']:
            info_lines.append(f"**Servings:** {recipe['servings']}")
        if recipe['calories']:
            info_lines.append(f"**Calories:** {recipe['calories']} per serving")
        if recipe['rating']:
            info_lines.append(f"**Rating:** {recipe['rating']}")
        
        if info_lines:
            output.append("## Recipe Information")
            output.extend(info_lines)
            output.append("")
        
        # Description
        if recipe['description']:
            output.append("## Description")
            output.append(recipe['description'])
            output.append("")
        
        # Dietary Information
        if recipe['health_labels']:
            output.append("## Dietary Information")
            output.append(f"**Health Labels:** {', '.join(recipe['health_labels'])}")
            output.append("")
        
        # Ingredients
        if recipe['ingredients']:
            output.append("## Ingredients")
            for ingredient in recipe['ingredients']:
                output.append(f"- {ingredient}")
            output.append("")
        
        # Instructions
        if recipe['instructions']:
            output.append("## Instructions")
            output.append(recipe['instructions'])
            output.append("")
        
        # Source
        output.append("## Recipe Source")
        output.append(f"**From:** {recipe['source']}")
        output.append(f"**Original Recipe:** {recipe['url']}")
        
        return "\n".join(output)
    
    def _format_summary_recipe(self, recipe: Dict) -> str:
        """Format a brief recipe summary."""
        summary = [
            f"**{recipe['title']}**",
            f"Cuisine: {recipe['cuisine_type'] or 'Various'}",
            f"Time: {recipe['prep_time']} | Servings: {recipe['servings']} | Calories: {recipe['calories']}/serving",
            f"Source: {recipe['source']}",
            f"Recipe: {recipe['url']}"
        ]
        return "\n".join(summary)


# --- Function schema for integration ---
tools = [
    {
        "name": "get_recipe",
        "description": (
            "Scrapes recipes from popular cooking websites using web search. "
            "Supports filters for cuisine, meal type, diet, and health restrictions."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "recipe_query": {
                    "type": "string",
                    "description": "Search term for the recipe (e.g., 'chicken curry', 'vegan tacos')."
                },
                "cuisine_type": {
                    "type": "string",
                    "description": "Filter by cuisine type",
                    "enum": [
                        "american", "asian", "british", "caribbean", "central europe", "chinese", 
                        "eastern europe", "french", "indian", "italian", "japanese", "kosher", 
                        "mediterranean", "mexican", "middle eastern", "nordic", "south american", "south east asian", "pakistani"
                    ]
                },
                "meal_type": {
                    "type": "string",
                    "description": "Filter by meal type",
                    "enum": ["breakfast", "lunch", "dinner", "snack", "teatime"]
                },
                "diet": {
                    "type": "string",
                    "description": "Filter by diet label",
                    "enum": ["balanced", "high-fiber", "high-protein", "low-carb", "low-fat", "low-sodium"]
                },
                "health": {
                    "type": "string",
                    "description": "Filter by health label",
                    "enum": [
                        "vegetarian", "vegan", "gluten-free", "dairy-free", "keto-friendly", 
                        "paleo", "low-carb", "sugar-free"
                    ]
                },
                "multiple": {
                    "type": "boolean",
                    "description": "If true, returns multiple recipe options (default: false)",
                    "default": False
                }
            },
            "required": ["recipe_query"]
        }
    }
]


# --- Enhanced function call handler ---
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


# --- Example usage ---
if __name__ == "__main__":
    # Test cases demonstrating web scraping flexibility
    test_queries = [
        {"recipe_query": "handi", "multiple": True},
    ]
    
    print("=== Testing Web Recipe Scraper ===\n")
    print("Note: This scraper extracts recipes from popular cooking websites\n")
    
    scraper = WebRecipeScraper()
    
    for query_args in test_queries:
        query = query_args["recipe_query"]
        print(f"Searching for: '{query}' with filters: {query_args}")
        print("-" * 60)
        
        args_json = json.dumps(query_args)
        result = handle_function_call("get_recipe", args_json)
        print(result)
        print("\n" + "="*80 + "\n")
    