import os
from dotenv import load_dotenv

load_dotenv() 

DATABASE_URL = os.getenv("POSTGRESQL_CONNECTION_URI")
CAS_JWKS_URL = os.getenv("CAS_JWKS_URL")
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")