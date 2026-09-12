from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.models.recruiter import Recruiter
import re

class RecruiterService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def normalize_email(self, email: str) -> str:
        if not email:
            return ""
        email = email.strip()
        # Separate local part and domain to lowercase domain
        parts = email.split('@')
        if len(parts) == 2:
            return f"{parts[0]}@{parts[1].lower()}"
        return email.lower()

    def normalize_phone(self, phone: str) -> str:
        if not phone:
            return ""
        # Strip all non-digit characters except leading plus
        normalized = re.sub(r'[^\d+]', '', phone)
        # Prevent multiple pluses
        if normalized.startswith('+'):
            normalized = '+' + normalized.replace('+', '')
        else:
            normalized = normalized.replace('+', '')
        return normalized

    async def resolve_recruiter(self, name: str = None, email: str = None, phone: str = None, company_id: str = None) -> Recruiter | None:
        """
        Finds an existing recruiter by email or phone, or creates a new one.
        """
        if not name and not email and not phone:
            return None

        norm_email = self.normalize_email(email) if email else None
        norm_phone = self.normalize_phone(phone) if phone else None
        
        conditions = []
        if norm_email:
            conditions.append(Recruiter.email == norm_email)
        if norm_phone:
            conditions.append(Recruiter.phone == norm_phone)
            
        recruiter = None
        if conditions:
            result = await self.db.execute(select(Recruiter).filter(or_(*conditions)))
            recruiter = result.scalar_one_or_none()

        if recruiter:
            # Update fields if new information is provided
            updated = False
            if name and not recruiter.name:
                recruiter.name = name
                updated = True
            if norm_email and not recruiter.email:
                recruiter.email = norm_email
                updated = True
            if norm_phone and not recruiter.phone:
                recruiter.phone = norm_phone
                updated = True
            if company_id and not recruiter.company_id:
                recruiter.company_id = company_id
                updated = True
                
            if updated:
                await self.db.flush()
                
            return recruiter

        # Create new recruiter
        recruiter = Recruiter(
            name=name,
            email=norm_email,
            phone=norm_phone,
            company_id=company_id
        )
        self.db.add(recruiter)
        await self.db.flush()
        return recruiter
