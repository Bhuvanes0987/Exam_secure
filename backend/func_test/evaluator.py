# evaluator.py
from google import genai
import os

client = genai.Client(api_key="AIzaSyDZd8FB9bCPlR4CyQ49C3WCk29MGQYQCUk")

def evaluate_answer(question, answer, correct_answer):
    print(question)
    print(answer)
    print(correct_answer)
    prompt = f"""

   Given the following
    - question: {question}
    - answer: {answer}
    - correct answer: {correct_answer}

    Return ONLY a value between 0 and 1 indicating percentage of correctness of the answer to the question.
    If any answers are empty or consist of irrelevant text, consider the answer as wrong and return 0. The answers should have some relevance to the provided correct answer.
    """

    try: 
        response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=prompt,
        )
        #return 0
        return response.text
    except:
        return 0
