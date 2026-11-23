from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="RE-OS Deterministic Underwriting Engine")

class UnderwritingInput(BaseModel):
    purchase_price: float = Field(ge=0)
    arv: float = Field(ge=0)
    rehab_cost: float = Field(ge=0, default=0)
    monthly_rent: float = Field(ge=0, default=0)
    annual_taxes: float = Field(ge=0, default=0)
    annual_insurance: float = Field(ge=0, default=0)
    monthly_hoa: float = Field(ge=0, default=0)
    annual_debt_service: float = Field(ge=0, default=0)

@app.get('/health')
def health():
    return {"status":"ok", "engine":"deterministic-math", "version":"1.0.0"}

@app.post('/v1/underwrite/analyze')
def analyze(data: UnderwritingInput):
    purchase_total = data.purchase_price + data.rehab_cost
    flip_profit = data.arv - purchase_total
    annual_noi = (data.monthly_rent * 12) - data.annual_taxes - data.annual_insurance - (data.monthly_hoa * 12)
    cash_on_cash = flip_profit / purchase_total if purchase_total else 0
    cap_rate = annual_noi / data.purchase_price if data.purchase_price else 0
    dscr = annual_noi / data.annual_debt_service if data.annual_debt_service else 0
    mao = data.arv * 0.70 - data.rehab_cost
    return {
        "engineVersion":"1.0.0",
        "flip":{"netProfit":round(flip_profit,2),"mao":round(mao,2),"rank":1 if flip_profit > 0 else 0},
        "rental":{"annualNoi":round(annual_noi,2),"cashOnCash":round(cash_on_cash,4),"capRate":round(cap_rate,4),"dscr":round(dscr,4)},
        "arv":data.arv,
        "purchaseTotal":purchase_total,
    }
