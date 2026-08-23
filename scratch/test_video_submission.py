import asyncio
import io
import sys
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
        lessons = (await client.get("/lessons/")).json()
        students = (await client.get("/students/")).json()
        student_id = students[0]["_id"]
        
        # Find audio/reading exercise
        audio_ex = None
        target_lesson = None
        for l in lessons:
            detail = (await client.get(f"/lessons/{l['_id']}")).json()
            for ex in detail.get("exercises", []):
                if ex["type"] == "audio":
                    audio_ex = ex
                    target_lesson = l
                    break
            if audio_ex:
                break
                
        if not audio_ex:
            print("No audio exercise found")
            return
            
        print(f"Testing Multimodal Video/Audio Submission on: '{audio_ex['title']}' in lesson '{target_lesson['title']}'")
        
        # Create a dummy test video/audio file payload
        fake_video_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        files = {
            "file": ("recording.webm", io.BytesIO(fake_video_bytes), "video/webm")
        }
        
        res = await client.post(
            f"/exercises/{audio_ex['_id']}/submit-audio?student_id={student_id}",
            files=files
        )
        print("Status code:", res.status_code)
        data = res.json()
        print("Score:", data.get("score"))
        print("Feedback Analysis:\n", data.get("feedback", {}).get("analysis"))
        
        # Check persisted results
        results = (await client.get(f"/exercises/results/{student_id}/{target_lesson['_id']}")).json()
        latest = next((r for r in results if str(r["exercise_id"]) == str(audio_ex["_id"])), None)
        if latest:
            sub = latest.get("submission", {})
            print("\nPersisted Video Analysis:")
            print("Visual state:", sub.get("video_analysis", {}).get("visual_state"))
            print("Face presence:", sub.get("video_analysis", {}).get("face_presence_ratio"))
            print("Blink rate:", sub.get("video_analysis", {}).get("eyes", {}).get("blink_rate_per_minute"))
            print("Has visual report:", bool(sub.get("visual_report")))

if __name__ == "__main__":
    asyncio.run(test())
