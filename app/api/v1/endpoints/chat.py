from fastapi import APIRouter, Depends, status
from typing import Annotated, Any

from app.core.database import get_database
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_chat_service(db: Annotated[Any, Depends(get_database)]) -> ChatService:
    """Dependency factory for ChatService."""
    return ChatService(db)


@router.post("/{lesson_id}", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_lesson(
    lesson_id: str,
    request: ChatRequest,
    chat_service: Annotated[ChatService, Depends(get_chat_service)],
):
    """Ask the lesson chatbot a question.

    The chatbot has access to all exercise content for the given lesson
    and can answer doubts related to those exercises.
    """
    return await chat_service.chat(lesson_id, request)
