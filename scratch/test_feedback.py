import asyncio
import io
import sys
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def check():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000/api/v1', timeout=60.0) as c:
        lessons = (await c.get('/lessons/')).json()
        students = (await c.get('/students/')).json()
        student_id = students[0]['_id']
        sci_lesson = next((l for l in lessons if 'Photosynthesis' in l['title']), lessons[0])
        detail = (await c.get(f'/lessons/{sci_lesson["_id"]}')).json()
        audio_ex = next((e for e in detail.get('exercises', []) if e['type'] == 'audio'), None)
        
        fake_wav = b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        res = await c.post(
            f'/exercises/{audio_ex["_id"]}/submit-audio?student_id={student_id}',
            files={'file': ('rec.webm', io.BytesIO(fake_wav), 'video/webm')}
        )
        data = res.json()
        print('Score:', data['exercise_result']['score'])
        print('Feedback Summary:', data['immediate_feedback']['summary'])
        print('Strengths:', data['immediate_feedback']['strengths'])
        print('Tips:', data['immediate_feedback']['specific_tips'])
        print('Video Analysis in result:', data['exercise_result']['submission'].get('video_analysis', {}).get('visual_state'))

if __name__ == "__main__":
    asyncio.run(check())
