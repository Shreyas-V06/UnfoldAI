from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Any


class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role: Literal["user", "assistant"] = Field(..., description="Who sent this message")
    content: str = Field(..., min_length=1, description="Message text")


class ChatRequest(BaseModel):
    """Request body for the lesson chatbot."""
    student_id: str = Field(..., description="The student asking the question")
    message: str = Field(..., min_length=1, max_length=2000, description="The student's question or message")
    conversation_history: List[ChatMessage] = Field(
        default_factory=list,
        description="Previous messages in the conversation (client-managed)"
    )
    exercise_id: Optional[str] = Field(
        default=None,
        description="Optional ID of the exercise currently visible on the screen"
    )
    current_exercise_context: Optional[dict[str, Any]] = Field(
        default=None,
        description="Optional full context of the active exercise visible to the student"
    )


class ChatResponse(BaseModel):
    """Response from the lesson chatbot."""
    reply: str
    lesson_id: str
