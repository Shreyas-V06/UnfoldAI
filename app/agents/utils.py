import json
import re

def parse_llm_json(text: str) -> dict:
    """Extracts and parses JSON from an LLM response, handling markdown formatting."""
    try:
        # Try to find JSON inside a code block
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
            
        # Try finding anything that looks like a JSON object
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
            
        # Fallback parsing
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from LLM output: {e}\nOutput was: {text}")
