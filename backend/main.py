import os
import json
import urllib.request
import urllib.parse
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

app = FastAPI()
DATA_FILE = "data/links.json"
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

class Link(BaseModel):
    url: str

def load_links():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

def save_links(links):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(links, f)

def get_yt_title(url):
    # Use YouTube's free oEmbed API to get video metadata
    oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
    try:
        with urllib.request.urlopen(oembed_url) as response:
            data = json.loads(response.read().decode())
            return data.get("title", "Unknown Title")
    except Exception:
        return "Unknown Title"

@app.get("/")
async def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    with open(index_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/add")
async def add_link(link: Link):
    links = load_links()
    # Check if URL is already in the list
    if not any(item.get("url") == link.url for item in links):
        title = get_yt_title(link.url)
        # Save as a dictionary with both title and URL
        links.append({"url": link.url, "title": title}) 
        save_links(links)
    return {"status": "success"}

@app.post("/remove")
async def remove_link(link: Link):
    links = load_links()
    # Filter out the removed URL
    links = [item for item in links if item.get("url") != link.url]
    save_links(links)
    return {"status": "success"}

@app.get("/links")
async def get_links():
    return load_links()

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse(os.path.join(FRONTEND_DIR, "manifest.json"))

@app.get("/sw.js")
async def get_sw():
    return FileResponse(os.path.join(FRONTEND_DIR, "sw.js"))