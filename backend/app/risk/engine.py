from typing import List, Dict, Any
from app.ai.schemas import JobExtraction
from .rules import get_signal_score
from app.models.company import RiskLevel

class RiskEngine:
    @staticmethod
    def calculate_risk(extraction: JobExtraction) -> Dict[str, Any]:
        """
        Calculates the final deterministic risk score and confidence.
        """
        base_score = 0
        signal_details = []
        
        # 1. Evaluate Suspicious Signals from AI
        for signal in extraction.suspicious_signals:
            score = get_signal_score(signal.signal_type)
            if score == 0:
                # If the AI hallucinates a signal type, we ignore it or treat it as low risk.
                # But we keep it in the record for debugging.
                pass
            else:
                base_score += score
                
            signal_details.append({
                "signal_type": signal.signal_type,
                "score_contribution": score,
                "evidence": signal.evidence,
                "reasoning": signal.reasoning,
                "confidence": signal.confidence
            })
            
        # 2. Clamp score between 0 and 100
        final_score = max(0, min(100, base_score))
        
        # 3. Determine Risk Level
        if final_score <= 20:
            risk_level = RiskLevel.LOW
        elif final_score <= 40:
            risk_level = RiskLevel.MODERATE
        elif final_score <= 60:
            risk_level = RiskLevel.SUSPICIOUS
        elif final_score <= 80:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL
            
        # 4. Calculate deterministic confidence
        # Start at 100, reduce based on missing critical info or low AI confidence
        confidence_penalties = 0
        if extraction.missing_information:
            confidence_penalties += len(extraction.missing_information) * 5
            
        for signal in extraction.suspicious_signals:
            if signal.confidence < 80:
                confidence_penalties += 5
                
        final_confidence = max(0, min(100, 100 - confidence_penalties))
        
        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "confidence": final_confidence,
            "signal_details": signal_details
        }
