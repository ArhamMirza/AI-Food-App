import requests
import json
import re
import logging
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)


class SmartWebCrawler:
    """
    Smart web crawler that uses Google Search API and YouTube API
    for intelligent web content retrieval and video searches.
    """
    
    def __init__(self, google_api_key: str = None, google_cse_id: str = None):
        """
        Initialize the smart web crawler.
        
        Args:
            google_api_key: Google Custom Search API key (optional, will use settings if not provided)
            google_cse_id: Google Custom Search Engine ID (optional, will use settings if not provided)
        """
        try:
            self.google_api_key = google_api_key or settings.GOOGLE_API_KEY
            self.google_cse_id = google_cse_id or settings.GOOGLE_CSE_ID
            self.youtube_api_key = self.google_api_key
            
            self.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            # Google Custom Search API endpoint
            self.google_search_url = "https://www.googleapis.com/customsearch/v1"
            
            # YouTube Data API endpoint
            self.youtube_search_url = "https://www.googleapis.com/youtube/v3/search"
            
            logger.info("SmartWebCrawler initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize SmartWebCrawler: {str(e)}")
            raise
    
    def search_recipes(self, query: str, limit: int = 10, **filters) -> List[Dict]:
        """
        Search for web content using Google Custom Search API.
        
        Args:
            query: Search term
            limit: Number of results to return
            **filters: Additional filters (site, filetype, etc.)
        
        Returns:
            List of web content dictionaries
        """
        results = []
        
        try:
            logger.info(f"Searching recipes with query: '{query}', limit: {limit}")
            search_query = self._build_search_query(query, **filters)
            logger.debug(f"Built search query: '{search_query}'")
            
            # Search using Google Custom Search API
            search_results = self._google_search_api(search_query, limit)
            
            # Process each search result
            for i, result in enumerate(search_results[:limit]):
                try:
                    logger.debug(f"Scraping content from result {i+1}: {result.get('link', 'unknown URL')}")
                    content = self._scrape_content(result['link'])
                    if content:
                        # Combine search result metadata with scraped content
                        result.update(content)
                        results.append(result)
                        logger.debug(f"Successfully scraped content from {result.get('link')}")
                    else:
                        logger.warning(f"No content extracted from {result.get('link')}")
                    
                    time.sleep(random.uniform(0.5, 1.0))  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error scraping {result.get('link', 'unknown URL')}: {str(e)}")
                    continue
                    
            logger.info(f"Successfully processed {len(results)} recipe search results")
            
        except Exception as e:
            logger.error(f"Error searching content: {str(e)}", exc_info=True)
        
        return results
    
    def get_recipe(self, recipe_query: str, detailed: bool = True, **filters) -> str:
        """
        Get the best matching web content for a query.
        
        Args:
            recipe_query: Search term
            detailed: Whether to return full content or summary
            **filters: Additional search filters
        
        Returns:
            Formatted content string
        """
        try:
            logger.info(f"Getting recipe for query: '{recipe_query}', detailed: {detailed}")
            results = self.search_recipes(recipe_query, limit=5, **filters)
            
            if not results:
                no_results_msg = f"No content found for '{recipe_query}'. Please try a different search term."
                logger.warning(f"No results found for recipe query: '{recipe_query}'")
                return no_results_msg
            
            # Return the best match (first result)
            best_result = results[0]
            logger.info(f"Returning best match: {best_result.get('title', 'Untitled')}")
            
            if detailed:
                return self._format_detailed_content(best_result)
            else:
                return self._format_summary_content(best_result)
                
        except Exception as e:
            logger.error(f"Error getting recipe for query '{recipe_query}': {str(e)}", exc_info=True)
            return f"Error retrieving recipe information. Please try again."
    
    def get_multiple_recipes(self, recipe_query: str, count: int = 3, **filters) -> str:
        """
        Get multiple content options for a query.
        
        Args:
            recipe_query: Search term
            count: Number of results to return
            **filters: Additional search filters
        
        Returns:
            Formatted string with multiple content options
        """
        try:
            logger.info(f"Getting multiple recipes for query: '{recipe_query}', count: {count}")
            results = self.search_recipes(recipe_query, limit=count, **filters)
            
            if not results:
                no_results_msg = f"No content found for '{recipe_query}'."
                logger.warning(f"No results found for multiple recipes query: '{recipe_query}'")
                return no_results_msg
            
            output = [f"# Search Results for '{recipe_query}'\n"]
            
            for i, result in enumerate(results, 1):
                try:
                    output.append(f"## Result {i}: {result.get('title', 'Untitled')}")
                    output.append(f"**Source:** {result.get('displayLink', 'Unknown')}")
                    output.append(f"**URL:** {result.get('link', '')}")
                    if result.get('snippet'):
                        output.append(f"**Summary:** {result['snippet']}")
                    output.append("")
                except Exception as e:
                    logger.error(f"Error formatting result {i}: {str(e)}")
                    continue
            
            logger.info(f"Successfully formatted {len(results)} multiple recipe results")
            return "\n".join(output)
            
        except Exception as e:
            logger.error(f"Error getting multiple recipes for query '{recipe_query}': {str(e)}", exc_info=True)
            return f"Error retrieving multiple recipe information. Please try again."
    
    def search_youtube_videos(self, query: str, limit: int = 10, **filters) -> List[Dict]:
        """
        Search for YouTube videos using YouTube Data API.
        
        Args:
            query: Search term
            limit: Number of videos to return
            **filters: Additional filters (duration, order, etc.)
        
        Returns:
            List of video dictionaries
        """
        try:
            logger.info(f"Searching YouTube videos for query: '{query}', limit: {limit}")
            
            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'maxResults': min(limit, 50),  # API limit
                'key': self.youtube_api_key
            }
            
            # Add optional filters
            if filters.get('duration'):
                params['videoDuration'] = filters['duration']  # short, medium, long
                logger.debug(f"Added duration filter: {filters['duration']}")
            if filters.get('order'):
                params['order'] = filters['order']  # relevance, date, rating, viewCount
                logger.debug(f"Added order filter: {filters['order']}")
            if filters.get('publishedAfter'):
                params['publishedAfter'] = filters['publishedAfter']  # RFC 3339 format
                logger.debug(f"Added publishedAfter filter: {filters['publishedAfter']}")
            
            response = requests.get(self.youtube_search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for item in data.get('items', []):
                try:
                    video = {
                        'video_id': item['id']['videoId'],
                        'title': item['snippet']['title'],
                        'description': item['snippet']['description'],
                        'channel': item['snippet']['channelTitle'],
                        'published_at': item['snippet']['publishedAt'],
                        'thumbnail': item['snippet']['thumbnails']['high']['url'],
                        'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                    }
                    videos.append(video)
                except Exception as e:
                    logger.error(f"Error processing YouTube video item: {str(e)}")
                    continue
            
            logger.info(f"Successfully found {len(videos)} YouTube videos")
            return videos
            
        except Exception as e:
            logger.error(f"Error searching YouTube: {str(e)}", exc_info=True)
            return []
    
    def get_youtube_content(self, query: str, count: int = 5, **filters) -> str:
        """
        Get YouTube video search results formatted as text.
        
        Args:
            query: Search term
            count: Number of videos to return
            **filters: Additional search filters
        
        Returns:
            Formatted string with video results
        """
        try:
            logger.info(f"Getting YouTube content for query: '{query}', count: {count}")
            videos = self.search_youtube_videos(query, limit=count, **filters)
            
            if not videos:
                no_videos_msg = f"No YouTube videos found for '{query}'."
                logger.warning(f"No YouTube videos found for query: '{query}'")
                return no_videos_msg
            
            output = [f"# YouTube Videos for '{query}'\n"]
            
            for i, video in enumerate(videos, 1):
                try:
                    output.append(f"## Video {i}: {video['title']}")
                    output.append(f"**Channel:** {video['channel']}")
                    output.append(f"**Published:** {video['published_at']}")
                    output.append(f"**URL:** {video['url']}")
                    if video['description']:
                        # Truncate long descriptions
                        desc = video['description'][:200] + "..." if len(video['description']) > 200 else video['description']
                        output.append(f"**Description:** {desc}")
                    output.append("")
                except Exception as e:
                    logger.error(f"Error formatting YouTube video {i}: {str(e)}")
                    continue
            
            logger.info(f"Successfully formatted {len(videos)} YouTube video results")
            return "\n".join(output)
            
        except Exception as e:
            logger.error(f"Error getting YouTube content for query '{query}': {str(e)}", exc_info=True)
            return f"Error retrieving YouTube video information. Please try again."
    
    def _build_search_query(self, query: str, **filters) -> str:
        """Build a search query with filters."""
        try:
            search_terms = [query]
            
            # Add filter terms
            if filters.get('site'):
                search_terms.append(f"site:{filters['site']}")
            if filters.get('filetype'):
                search_terms.append(f"filetype:{filters['filetype']}")
            if filters.get('intitle'):
                search_terms.append(f"intitle:{filters['intitle']}")
            if filters.get('inurl'):
                search_terms.append(f"inurl:{filters['inurl']}")
            if filters.get('exclude'):
                search_terms.append(f"-{filters['exclude']}")
            
            built_query = ' '.join(search_terms)
            logger.debug(f"Built search query: '{built_query}' from base query: '{query}' with filters: {filters}")
            return built_query
            
        except Exception as e:
            logger.error(f"Error building search query: {str(e)}")
            return query  # Return original query as fallback
    
    def _google_search_api(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search using Google Custom Search API.
        
        Args:
            query: Search query
            limit: Number of results to return
        
        Returns:
            List of search result dictionaries
        """
        try:
            logger.info(f"Calling Google Search API with query: '{query}', limit: {limit}")
            
            params = {
                'key': self.google_api_key,
                'cx': self.google_cse_id,
                'q': query,
                'num': min(limit, 10)  # API limit per request
            }
            
            response = requests.get(self.google_search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for item in data.get('items', []):
                try:
                    result = {
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'displayLink': item.get('displayLink', ''),
                        'formattedUrl': item.get('formattedUrl', ''),
                        'kind': item.get('kind', ''),
                        'cacheId': item.get('cacheId', '')
                    }
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error processing search result item: {str(e)}")
                    continue
            
            logger.info(f"Found {len(results)} search results from Google API")
            return results
            
        except Exception as e:
            logger.error(f"Error with Google Search API: {str(e)}", exc_info=True)
            return []
    
    def _scrape_content(self, url: str) -> Optional[Dict]:
        """
        Scrape content from a URL and return raw webpage content.
        
        Args:
            url: URL to scrape
        
        Returns:
            Dictionary with webpage content
        """
        try:
            logger.debug(f"Scraping content from URL: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract basic page information
            title = self._extract_title(soup)
            text_content = self._extract_text_content(soup)
            meta_description = self._extract_meta_description(soup)
            headings = self._extract_headings(soup)
            links = self._extract_links(soup, url)
            images = self._extract_images(soup, url)
            
            content_data = {
                'url': url,
                'domain': urlparse(url).netloc,
                'page_title': title,
                'meta_description': meta_description,
                'text_content': text_content,
                'headings': headings,
                'links': links,
                'images': images,
                'html_content': str(soup),
                'content_length': len(text_content),
                'status_code': response.status_code
            }
            
            logger.debug(f"Successfully scraped content from {url}, content length: {len(text_content)}")
            return content_data
            
        except Exception as e:
            logger.error(f"Error scraping content from {url}: {str(e)}")
            return None
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title."""
        try:
            title_tag = soup.find('title')
            title = title_tag.get_text(strip=True) if title_tag else ''
            logger.debug(f"Extracted title: {title[:50]}...")
            return title
        except Exception as e:
            logger.error(f"Error extracting title: {str(e)}")
            return ''
    
    def _extract_text_content(self, soup: BeautifulSoup) -> str:
        """Extract all text content from the page."""
        try:
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            logger.debug(f"Extracted text content, length: {len(text)}")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text content: {str(e)}")
            return ''
    
    def _extract_meta_description(self, soup: BeautifulSoup) -> str:
        """Extract meta description."""
        try:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ''
            logger.debug(f"Extracted meta description: {description[:50]}...")
            return description
        except Exception as e:
            logger.error(f"Error extracting meta description: {str(e)}")
            return ''
    
    def _extract_headings(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract all headings from the page."""
        try:
            headings = []
            for i in range(1, 7):  # h1 to h6
                for heading in soup.find_all(f'h{i}'):
                    try:
                        headings.append({
                            'level': i,
                            'text': heading.get_text(strip=True)
                        })
                    except Exception as e:
                        logger.error(f"Error processing heading h{i}: {str(e)}")
                        continue
            
            logger.debug(f"Extracted {len(headings)} headings")
            return headings
            
        except Exception as e:
            logger.error(f"Error extracting headings: {str(e)}")
            return []
    
    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        """Extract all links from the page."""
        try:
            links = []
            for link in soup.find_all('a', href=True):
                try:
                    href = link['href']
                    absolute_url = urljoin(base_url, href)
                    links.append({
                        'text': link.get_text(strip=True),
                        'url': absolute_url,
                        'relative_url': href
                    })
                except Exception as e:
                    logger.error(f"Error processing link: {str(e)}")
                    continue
            
            logger.debug(f"Extracted {len(links)} links")
            return links
            
        except Exception as e:
            logger.error(f"Error extracting links: {str(e)}")
            return []
    
    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        """Extract all images from the page."""
        try:
            images = []
            for img in soup.find_all('img'):
                try:
                    src = img.get('src')
                    if src:
                        absolute_url = urljoin(base_url, src)
                        images.append({
                            'src': absolute_url,
                            'alt': img.get('alt', ''),
                            'title': img.get('title', '')
                        })
                except Exception as e:
                    logger.error(f"Error processing image: {str(e)}")
                    continue
            
            logger.debug(f"Extracted {len(images)} images")
            return images
            
        except Exception as e:
            logger.error(f"Error extracting images: {str(e)}")
            return []
    
    def _format_detailed_content(self, result: Dict) -> str:
        """Format detailed content output."""
        try:
            logger.debug("Formatting detailed content output")
            output = []
            
            # Title and basic info
            output.append(f"# {result.get('page_title', result.get('title', 'Untitled'))}\n")
            
            # Metadata
            output.append("## Page Information")
            output.append(f"**URL:** {result.get('url', result.get('link', ''))}")
            output.append(f"**Domain:** {result.get('domain', result.get('displayLink', ''))}")
            if result.get('meta_description'):
                output.append(f"**Description:** {result['meta_description']}")
            if result.get('content_length'):
                output.append(f"**Content Length:** {result['content_length']} characters")
            output.append("")
            
            # Main content
            if result.get('text_content'):
                output.append("## Page Content")
                # Truncate very long content
                content = result['text_content']
                if len(content) > 5000:
                    content = content[:5000] + "\n\n[Content truncated...]"
                output.append(content)
                output.append("")
            
            # Headings
            if result.get('headings'):
                output.append("## Page Structure (Headings)")
                for heading in result['headings'][:20]:  # Limit to first 20 headings
                    try:
                        indent = "  " * (heading['level'] - 1)
                        output.append(f"{indent}- H{heading['level']}: {heading['text']}")
                    except Exception as e:
                        logger.error(f"Error formatting heading: {str(e)}")
                        continue
                output.append("")
            
            formatted_content = "\n".join(output)
            logger.debug(f"Successfully formatted detailed content, length: {len(formatted_content)}")
            return formatted_content
            
        except Exception as e:
            logger.error(f"Error formatting detailed content: {str(e)}")
            return f"Error formatting content for {result.get('title', 'Unknown')}"
    
    def _format_summary_content(self, result: Dict) -> str:
        """Format brief content summary."""
        try:
            logger.debug("Formatting summary content output")
            
            summary = [
                f"**{result.get('page_title', result.get('title', 'Untitled'))}**",
                f"Domain: {result.get('domain', result.get('displayLink', 'Unknown'))}",
                f"URL: {result.get('url', result.get('link', ''))}",
            ]
            
            if result.get('snippet'):
                summary.append(f"Summary: {result['snippet']}")
            elif result.get('meta_description'):
                summary.append(f"Description: {result['meta_description']}")
            
            formatted_summary = "\n".join(summary)
            logger.debug(f"Successfully formatted summary content, length: {len(formatted_summary)}")
            return formatted_summary
            
        except Exception as e:
            logger.error(f"Error formatting summary content: {str(e)}")
            return f"Error formatting summary for {result.get('title', 'Unknown')}"


# --- Enhanced function call handler ---
def handle_recipe_function_call(arguments_json: str) -> str:
    """
    Handles function calls for web crawling and YouTube search.
    
    Args:
        arguments_json: JSON string with function arguments
    
    Returns:
        Formatted search results or error message
    """
    try:
        logger.info("Handling recipe function call")
        logger.debug(f"Function call arguments: {arguments_json}")
        
        args = json.loads(arguments_json)
        query = args.get("recipe_query", args.get("query", ""))
        
        if not query:
            error_msg = "Please provide a search term."
            logger.warning("No search query provided in function call")
            return error_msg
        
        # Check if API keys are configured in settings
        if not hasattr(settings, 'GOOGLE_API_KEY') or not settings.GOOGLE_API_KEY:
            error_msg = "Google API key not configured in settings."
            logger.error("Google API key not configured")
            return error_msg
        
        if not hasattr(settings, 'GOOGLE_CSE_ID') or not settings.GOOGLE_CSE_ID:
            error_msg = "Google Custom Search Engine ID not configured in settings."
            logger.error("Google CSE ID not configured")
            return error_msg
        
        # Initialize crawler (will use settings automatically)
        crawler = SmartWebCrawler()
        
        # Extract optional parameters
        filters = {}
        for key in ['site', 'filetype', 'intitle', 'inurl', 'exclude']:
            if key in args and args[key]:
                filters[key] = args[key]
        
        logger.debug(f"Applied filters: {filters}")
        
        # Check if this is a YouTube search
        logger.debug(f"Function call args: {args}")
        if args.get('search_type') == 'youtube':
            logger.info("Processing YouTube search request")
            video_filters = {}
            for key in ['duration', 'order', 'publishedAfter']:
                if key in args and args[key]:
                    video_filters[key] = args[key]
            
            logger.debug(f"Applied video filters: {video_filters}")
            return crawler.get_youtube_content(query, count=args.get('count', 5), **video_filters)
        
        # Regular web search
        logger.info("Processing regular web search request")
        if args.get('multiple', False):
            logger.info("Returning multiple results")
            return crawler.get_multiple_recipes(query, count=args.get('count', 3), **filters)
        else:
            logger.info("Returning single result")
            return crawler.get_recipe(query, detailed=args.get('detailed', True), **filters)
            
    except json.JSONDecodeError as e:
        error_msg = "Invalid JSON arguments provided."
        logger.error(f"JSON decode error in function call: {str(e)}")
        return error_msg
    except Exception as e:
        error_msg = f"Error processing search request: {str(e)}"
        logger.error(f"Error processing search request: {str(e)}", exc_info=True)
        return error_msg