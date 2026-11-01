from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from .core import Profile, Request, Response, Vinta

load_dotenv()
app = FastAPI(title='Vinta API', version='0.1.0')
@app.get("/")
def home():
    return {
        "agent": "Vinta",
        "version": "0.1.0",
        "system": "Ara OS 12",
        "status": "online",
        "description": "Agente de Comunicação e Linguagem",
        "documentation": "/docs"
    }
agent = Vinta()


@app.get('/health')
def health():
    return {'status': 'ok', 'agent': 'Vinta', 'version': '0.1.0'}


@app.get('/profiles/{user_id}', response_model=Profile)
def get_profile(user_id: str):
    return agent.get_profile(user_id)


@app.put('/profiles/{user_id}', response_model=Profile)
def put_profile(user_id: str, profile: Profile):
    try:
        return agent.save_profile(user_id, profile)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post('/process', response_model=Response)
def process(request: Request):
    return agent.process(request)
