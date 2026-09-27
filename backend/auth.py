import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import CAS_JWKS_URL

security = HTTPBearer() 
jwks_client = PyJWKClient(CAS_JWKS_URL) 

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)): 
    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token) 
        payload = jwt.decode(
            token, 
            signing_key.key, 
            algorithms=["RS256"], 
            options={"verify_aud": False}, 
            leeway=60 
        ) 
        return payload.get("sub")
    except Exception as e:
        print(f"JWT Verification Failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token") 