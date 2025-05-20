from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import json
from google import genai
import os
from collections import defaultdict
from uuid import uuid4
from pydantic import BaseModel
import re
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
# In-memory history:  {session_id: [ {role,text}, … ] }
CONVERSATIONS = defaultdict(list)
SYSTEM_PROMPT = (
    "You are an expert interviewer. "
    "Interview the candidate for a software job. "
    "After every user answer you must do TWO things:\n"
    "1. Evaluate the answer on a 0-1 scale (float) for quality/relevance.\n"
    "2. Ask ONE new, relevant follow-up question.\n"
    "If the user's answer is empty, the next question should prompt them to answer. Return an empty question after 2 empty answers."
    "Respond ONLY in JSON with the format:\n"
    '{ "score": <float-0-1>, "question": "<next question>" }'
)


# CORS setup for Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def evaluate_answer(question, answer, correct_answer):
    
    print(question)
    print(answer)
    print(correct_answer)
    prompt = f"""

    Consider yourself an expert evaluator.
    
    Given the following
    - question: {question}
    - answer: {answer}
    - correct answer: {correct_answer}

    Return ONLY a value from 0 to 1 indicating percentage of correctness of the answer to the question.
    If any answers are empty or consist of irrelevant text, consider the answer as wrong and return 0. The answers should have some relevance to the provided correct answer.
    """

    try: 
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt,
        )
        return float(response.text.strip())
    except Exception as e:
        print("Error in evaluate_answer:", e)
        return 0.0



# Load questions
@app.get("/questions")
def get_questions():
    try:
        with open("questions.json", "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Submit answers
@app.post("/submit")
async def submit_answers(
    video: UploadFile = File(...),
    answers: str = Form(...)
    ):

    answers = json.loads(answers)

    #print("CHEATING:",cheatFlag)

    content = await video.read()
    with open("recordings/recorded_video.webm", "wb") as f:
        f.write(content)

    try:
        with open("questions.json", "r") as f:
            question_data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load questions: {e}")

    total_score = 0.0
    for q in question_data:
        qid = str(q["id"])
        user_answer = answers.get(qid, "").strip()
        if user_answer == "":
            print("Blank answer")
            correctness = 0.0
        else:
            correctness = evaluate_answer(q["question"], user_answer, q["answer"])
            print(correctness)
        total_score += correctness
    
    total_score = round((total_score / len(question_data)) * 100, 1) if len(question_data) > 0 else 0.0

    print({"score": total_score, "total": len(question_data)})
    return {"score": total_score, "total": len(question_data)}

class ChatReply(BaseModel):
    session_id: str
    score: float
    next_question: str

@app.post("/chat", response_model=ChatReply)
async def chatbot_response(
    *,
    text: str = Body(..., embed=True),
    session_id: str | None = Body(None, embed=True)
):
    if session_id is None:
        session_id = str(uuid4())

    history = CONVERSATIONS[session_id]  # list alternating user / assistant messages

    # Build single string prompt with system prompt + conversation history
    prompt_lines = [SYSTEM_PROMPT.strip(), ""]

    # Append conversation turns labeled as User/Assistant
    for i in range(0, len(history), 2):
        user_msg = history[i]
        prompt_lines.append(f"User: {user_msg}")
        if i + 1 < len(history):
            assistant_msg = history[i + 1]
            prompt_lines.append(f"Assistant: {assistant_msg}")

    # Add current user input
    prompt_lines.append(f"User: {text}")
    prompt_lines.append("Assistant:")  # The model should complete from here

    prompt_text = "\n".join(prompt_lines)

    try:
        res = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt_text
        )
    except Exception as e:
        print("Error calling generate_content:", e)
        raise HTTPException(500, f"Model call error: {e}")

    temp = res.text
    print("Raw RESPONSE:", repr(temp))

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", temp, re.DOTALL)
    if match:
        temp = match.group(1)
        print("Extracted JSON:", repr(temp))
    else:
        print("No backticks detected, using original response.")

    try:
        data = json.loads(temp)

    except json.JSONDecodeError as e:
        print("JSON decode error:", e)
        print("Response text was:", temp)
        raise HTTPException(status_code=500, detail=f"Invalid JSON response: {e}")
    
    score = float(data["score"])
    next_q = data["question"].strip()

    # Append current user input and assistant response to history
    history.append(text)
    history.append(next_q)

    return ChatReply(session_id=session_id, score=score, next_question=next_q)


@app.get("/summary/{session_id}")
def summary(session_id: str):
    turns = CONVERSATIONS.get(session_id)
    if not turns:
        raise HTTPException(404, "Unknown session")
    scores = [json.loads(t["text"])["score"]
              for t in turns if t["role"]=="assistant"]
    overall = round(sum(scores)/len(scores)*100, 1) if scores else 0.0
    return {"overall_percent": overall, "count": len(scores)}
