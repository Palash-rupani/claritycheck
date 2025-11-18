from fastapi import FastAPI
app = FastAPI(title="ClarityCheck AI Service")

@app.get("/")
def root():
    return {"status": "ai service ok"}
