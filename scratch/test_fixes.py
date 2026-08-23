import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1", timeout=30.0) as client:
        # 1. Get lessons
        res = await client.get("/lessons/")
        lessons = res.json()
        print(f"Fetched {len(lessons)} lessons")
        
        # 2. Get students
        res = await client.get("/students/")
        students = res.json()
        student_id = students[0]["_id"]
        print(f"Active student: {students[0]['name']} ({student_id})")
        
        # 3. Find a situational exercise
        sit_ex = None
        for l in lessons:
            d = (await client.get(f"/lessons/{l['_id']}")).json()
            sit_ex = next((e for e in d.get("exercises", []) if e["type"] == "situational"), None)
            if sit_ex:
                break
                
        if sit_ex:
            print(f"Found Situational Exercise: '{sit_ex['title']}'")
            
            # Test 1: Unrelated answer
            unrelated_sub = {"submission_data": {"student_response": "I like to play basketball with my friends on weekends and eat pepperoni pizza."}}
            res1 = await client.post(f"/exercises/{sit_ex['_id']}/submit?student_id={student_id}", json=unrelated_sub)
            data1 = res1.json()
            print(f"\n[Test 1 - Unrelated Answer Evaluation]")
            print(f"Status Code: {res1.status_code}")
            print(f"Score: {data1['exercise_result']['score']} (Expected low ~15%)")
            print(f"Analysis: {data1['exercise_result']['evaluation']['analysis']}")
            print(f"Identified Issues: {data1['exercise_result']['evaluation']['identified_issues']}")
            
            # Test 2: Submitting again (Re-practice, testing 409 fix)
            relevant_sub = {"submission_data": {"student_response": "I will raise my hand and politely explain to the teacher that I need the instructions repeated slowly, and ask for a written checklist to help me follow along."}}
            res2 = await client.post(f"/exercises/{sit_ex['_id']}/submit?student_id={student_id}", json=relevant_sub)
            print(f"\n[Test 2 - Re-Practice Submission (409 Fix Verification)]")
            print(f"Status Code: {res2.status_code} (Expected 200 OK, no 409 error)")
            data2 = res2.json()
            print(f"Score: {data2['exercise_result']['score']} (Expected high ~90%)")
            print(f"Analysis: {data2['exercise_result']['evaluation']['analysis']}")
            print(f"Strengths: {data2['immediate_feedback']['strengths']}")
            
            # Test 3: Generate report based on actual student performance
            print(f"\n[Test 3 - AI Diagnostic Report Generation based on Real Memory]")
            rep_res = await client.post(f"/reports/generate/{student_id}?period=overall")
            print(f"Report Status Code: {rep_res.status_code}")
            rep_data = rep_res.json()
            print(f"Overall Performance: {rep_data['summary']['overall_performance']}")
            print(f"Average Score: {rep_data['summary']['average_score']}%")
            print(f"Key Achievements: {rep_data['summary']['key_achievements']}")
            print(f"Areas of Concern: {rep_data['summary']['areas_of_concern']}")
            print(f"Detailed Findings Count: {len(rep_data['detailed_findings'])}")
            print(f"Recommendations: {rep_data['recommendations']}")

if __name__ == "__main__":
    asyncio.run(test())
