from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    user: UserInfo