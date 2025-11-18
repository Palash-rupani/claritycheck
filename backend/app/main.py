from fastapi import FastAPI

app = FastAPI(title="ClarityCheck Backend")

@app.get("/")
def root():
    return {"status": "ok"}
