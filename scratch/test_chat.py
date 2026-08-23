import asyncio
import sys
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
        lessons = (await client.get("/lessons/")).json()
        students = (await client.get("/students/")).json()
        student_id = students[0]["_id"]
        
        lesson = lessons[0]
        lesson_id = lesson["_id"]
        detail = (await client.get(f"/lessons/{lesson_id}")).json()
        exercises = detail.get("exercises", [])
        
        print(f"Testing Chatbot with Lesson: '{lesson['title']}' ({len(exercises)} exercises)")
        
        # Test 1: Ask for a clue on MCQ exercise
        mcq_ex = next((e for e in exercises if e["type"] == "mcq"), exercises[0])
        print(f"\n--- Test 1: Clue on MCQ Exercise: '{mcq_ex['title']}' ---")
        req1 = {
            "student_id": student_id,
            "message": "Give me a helpful clue",
            "exercise_id": mcq_ex["_id"],
            "current_exercise_context": mcq_ex
        }
        res1 = await client.post(f"/chat/{lesson_id}", json=req1)
        print("Status:", res1.status_code)
        print("Reply:\n" + res1.json()["reply"])
        
        # Test 2: Ask for a simpler explanation on active exercise
        print(f"\n--- Test 2: Simpler explanation on active exercise ---")
        req2 = {
            "student_id": student_id,
            "message": "Can you explain this in simpler words?",
            "exercise_id": mcq_ex["_id"],
            "current_exercise_context": mcq_ex
        }
        res2 = await client.post(f"/chat/{lesson_id}", json=req2)
        print("Status:", res2.status_code)
        print("Reply:\n" + res2.json()["reply"])
        
        # Test 3: Audio pronunciation breakdown in Science lesson
        sci_lesson = next((l for l in lessons if "Science" in l.get("subject", "") or "Photosynthesis" in l.get("title", "")), None)
        if sci_lesson:
            sci_detail = (await client.get(f"/lessons/{sci_lesson['_id']}")).json()
            audio_ex = next((e for e in sci_detail.get("exercises", []) if e["type"] == "audio"), None)
            if audio_ex:
                print(f"\n--- Test 3: Pronunciation on Audio Exercise: '{audio_ex['title']}' ---")
                req3 = {
                    "student_id": student_id,
                    "message": "How do I break down this word into sounds?",
                    "exercise_id": audio_ex["_id"],
                    "current_exercise_context": audio_ex
                }
                res3 = await client.post(f"/chat/{sci_lesson['_id']}", json=req3)
                print("Status:", res3.status_code)
                print("Reply:\n" + res3.json()["reply"])

if __name__ == "__main__":
    asyncio.run(test())
