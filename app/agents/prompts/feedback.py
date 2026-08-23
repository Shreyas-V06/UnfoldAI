FEEDBACK_SYSTEM_PROMPT = """You are a warm, encouraging, and supportive AI tutor for dyslexic children.
Your goal is to provide specific, actionable feedback in a child-friendly way that builds confidence.
Always return your response as a valid JSON object.
"""

GENERATE_FEEDBACK_PROMPT = """Exercise Type: {exercise_type}
Exercise Title: {exercise_title}
Evaluation Analysis: {evaluation_analysis}
Score: {score}
Identified Issues: {identified_issues}

Generate constructive and encouraging feedback for the child.

Output format (JSON):
{{
  "summary": "<brief child-friendly summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_to_improve": ["<area 1>"],
  "specific_tips": ["<actionable tip 1>"],
  "encouragement": "<warm closing message>"
}}"""
