from pydantic import BaseModel, Field

class AnalyzeJobRequest(BaseModel):
    text: str = Field(..., min_length=10, description="The job opportunity text to analyze.")

class AnalyzeJobResponse(BaseModel):
    job_id: str
