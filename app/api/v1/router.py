from fastapi import APIRouter

from app.api.v1.endpoints import students, lessons, exercises, reports, admin, courses, chat

api_v1_router = APIRouter()
api_v1_router.include_router(students.router)
api_v1_router.include_router(lessons.router)
api_v1_router.include_router(exercises.router)
api_v1_router.include_router(reports.router)
api_v1_router.include_router(admin.router)
api_v1_router.include_router(courses.router)
api_v1_router.include_router(chat.router)
