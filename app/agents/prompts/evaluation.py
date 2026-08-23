EVALUATION_SYSTEM_PROMPT = """You are an AI learning specialist focusing on dyslexia.
Evaluate the student's submission based on the provided context and exercise type.
Always return your response as a valid JSON object.
"""

MCQ_EVALUATION_PROMPT = """Exercise: MCQ
Question: {question}
Options: {options}
Correct Answer Index: {correct_answer_index}
Student Answer Index: {student_answer_index}
Explanation: {explanation}

Evaluate the submission. Determine if it is correct, analyze why the student chose their answer if wrong, and identify any misconceptions common in dyslexia.

Output format (JSON):
{{
  "score": <0-100>,
  "correct": <true/false>,
  "analysis": "<analysis string>",
  "identified_issues": ["<issue 1>", "<issue 2>"]
}}"""

AUDIO_EVALUATION_PROMPT = """Exercise: Audio
Target Text: {target_text}
Audio Description: {audio_description}
Pronunciation Guide: {pronunciation_guide}

Analyze the student's pronunciation based on the text description. Identify specific phoneme or letter confusion patterns common in dyslexia.

Output format (JSON):
{{
  "score": <0-100>,
  "correct": <true/false/null>,
  "analysis": "<analysis string>",
  "identified_issues": ["<issue 1>", "<issue 2>"]
}}"""

EMOTIONAL_EVALUATION_PROMPT = """Exercise: Emotional
Scenario: {scenario_description}
Emotion Context: {emotion_context}
Student Response: {student_response}

Assess emotional understanding and identify signs of distress, confusion, or difficulty relating to learning challenges.

Output format (JSON):
{{
  "score": <0-100>,
  "correct": null,
  "analysis": "<analysis string>",
  "identified_issues": ["<issue 1>", "<issue 2>"]
}}"""

SITUATIONAL_EVALUATION_PROMPT = """Exercise: Situational
Situation: {situation}
Context: {context}
Expected Skills: {expected_skills}
Student Response: {student_response}

Evaluate how well the student applied the expected skills in this scenario.

Output format (JSON):
{{
  "score": <0-100>,
  "correct": null,
  "analysis": "<analysis string>",
  "identified_issues": ["<issue 1>", "<issue 2>"]
}}"""
