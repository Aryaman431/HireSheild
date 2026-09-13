from pydantic import BaseModel, Field
from typing import List, Optional

class SuspiciousSignal(BaseModel):
    signal_type: str = Field(description="A predefined categorization of the risk signal (e.g. UPFRONT_PAYMENT, HIGH_PRESSURE_LANGUAGE, etc.).")
    evidence: str = Field(description="The exact text quote from the submitted job input that supports this signal. Do NOT invent text.")
    confidence: int = Field(description="AI's confidence that this signal is present, from 0 to 100.")
    reasoning: str = Field(description="Why this signal was flagged and how the evidence relates to it.")

class JobExtraction(BaseModel):
    company: Optional[str] = Field(description="The name of the company hiring.")
    recruiter: Optional[str] = Field(description="The name of the recruiter or contact person.")
    job_title: Optional[str] = Field(description="The job title.")
    description: Optional[str] = Field(description="A brief summary of the job description.")
    compensation: Optional[str] = Field(description="The offered compensation, salary, or pay rate.")
    location: Optional[str] = Field(description="The job location (remote or physical).")
    application_url: Optional[str] = Field(description="The URL where the applicant is supposed to apply or contact.")
    recruiter_email: Optional[str] = Field(description="The email address provided for contact.")
    recruiter_phone: Optional[str] = Field(description="The phone number provided for contact.")
    claims: List[str] = Field(description="List of notable claims made in the posting (e.g., 'Guaranteed selection in 3 days').")
    suspicious_signals: List[SuspiciousSignal] = Field(description="List of suspicious risk signals found in the text.")
    missing_information: List[str] = Field(description="Critical information that is suspiciously absent (e.g., 'No company domain specified').")
