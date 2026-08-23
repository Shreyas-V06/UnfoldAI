"""Service for generating YouTube course content.

Uses YouTube's internal search endpoint via httpx — no API key needed,
no external packages beyond httpx (already installed with FastAPI).
"""
import logging
import re
import json
from typing import List
from urllib.parse import quote_plus

import httpx

from app.models.course import CourseVideo, CourseGenerateResponse

logger = logging.getLogger(__name__)

_YOUTUBE_SEARCH_URL = "https://www.youtube.com/results"


async def _search_youtube(query: str, max_results: int = 5) -> List[dict]:
    """Scrape YouTube search results by parsing the initial page data.

    YouTube embeds search results as JSON inside the HTML page within
    a `ytInitialData` variable.  We extract video IDs and titles from it.
    """
    params = {"search_query": quote_plus(query)}
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(_YOUTUBE_SEARCH_URL, params=params, headers=headers)
        resp.raise_for_status()
        html = resp.text

    # Extract the ytInitialData JSON blob
    match = re.search(r"var ytInitialData\s*=\s*(\{.+?\});\s*</script>", html, re.DOTALL)
    if not match:
        # Fallback pattern
        match = re.search(r"ytInitialData\s*=\s*(\{.+?\});\s*", html, re.DOTALL)
    if not match:
        return []

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []

    # Navigate the deeply nested YouTube response structure
    videos: List[dict] = []
    try:
        contents = (
            data["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]
            ["sectionListRenderer"]["contents"]
        )
        for section in contents:
            items = section.get("itemSectionRenderer", {}).get("contents", [])
            for item in items:
                vr = item.get("videoRenderer")
                if not vr:
                    continue
                video_id = vr.get("videoId", "")
                title_runs = vr.get("title", {}).get("runs", [])
                title = "".join(r.get("text", "") for r in title_runs)
                if video_id and title:
                    videos.append({"id": video_id, "title": title})
                    if len(videos) >= max_results:
                        return videos
    except (KeyError, TypeError, IndexError):
        pass

    return videos


class CourseService:
    """Searches YouTube for educational videos on a given topic."""

    async def generate_course(self, topic: str, max_results: int = 5) -> CourseGenerateResponse:
        """Search YouTube for educational videos related to the topic."""
        search_query = f"{topic} explained for students"

        try:
            raw_results = await _search_youtube(search_query, max_results)
            video_list: List[CourseVideo] = []

            for item in raw_results:
                title = item.get("title", "")
                video_id = item.get("id", "")
                link = f"https://www.youtube.com/watch?v={video_id}"

                if title and video_id:
                    video_list.append(CourseVideo(title=title, link=link))

        except Exception as e:
            logger.error(f"YouTube search failed for topic '{topic}': {e}")
            video_list = []

        return CourseGenerateResponse(topic=topic, videos=video_list)
