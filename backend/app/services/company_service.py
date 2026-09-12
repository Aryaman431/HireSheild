from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.company import Company
import re

class CompanyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def normalize_name(self, name: str) -> str:
        if not name:
            return ""
        # Lowercase
        name = name.lower()
        # Remove common corporate suffixes for matching purposes
        name = re.sub(r'\b(inc|llc|corp|corporation|ltd|limited|co)\b\.?', '', name)
        # Remove punctuation
        name = re.sub(r'[^\w\s]', '', name)
        # Normalize spaces
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    async def resolve_company(self, name: str, domain: str = None) -> Company | None:
        """
        Finds an existing company by normalized name or domain, 
        or creates a new one if it doesn't exist.
        """
        if not name and not domain:
            return None

        normalized = self.normalize_name(name) if name else None
        
        # 1. Search by domain if provided
        if domain:
            result = await self.db.execute(select(Company).filter(Company.official_domain == domain))
            company = result.scalar_one_or_none()
            if company:
                # If found by domain but name was empty in DB, update name
                if name and not company.name:
                    company.name = name
                    company.normalized_name = normalized
                return company
                
        # 2. Search by normalized name
        if normalized:
            result = await self.db.execute(select(Company).filter(Company.normalized_name == normalized))
            company = result.scalar_one_or_none()
            if company:
                # If found by name but domain was empty in DB, update domain
                if domain and not company.official_domain:
                    company.official_domain = domain
                return company

        # 3. Create new company
        company = Company(
            name=name,
            normalized_name=normalized,
            official_domain=domain
        )
        self.db.add(company)
        await self.db.flush() # flush to get ID
        return company
