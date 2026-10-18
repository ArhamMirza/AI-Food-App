# AI Food Assistant

A full-stack web app that helps you decide what to cook. Chat with an AI assistant that understands your dietary needs, finds recipes and cooking videos from across the web, and lets you save recipes, build shopping lists and plan your meals.

**Stack:** React 19 · TypeScript · Redux Toolkit · Tailwind CSS · FastAPI · MongoDB · Firebase Auth · Groq (Llama 4)

---

<!-- Add a screenshot or short GIF here, e.g. ![App screenshot](docs/screenshot.png) -->

**Live demo:** _add your deployed link here_

## Features

- **Conversational recipe assistant.** Ask for "a high-protein vegetarian dinner" and the LLM decides when to call a recipe-search tool, passing along filters such as cuisine, meal type, diet and health restrictions.
- **Web-sourced recipes and videos.** Results come from Google Custom Search, with the pages scraped and cleaned by the backend, plus YouTube video lookups.
- **Multiple conversations.** Create, rename, delete and revisit chats. Edit earlier messages.
- **Saved recipes.** Save any recipe from a chat, edit it in a built-in editor, and browse your collection.
- **Shopping lists.** Generated alongside recipes and kept per user.
- **Meal planner.** Assign recipes to breakfast, lunch, dinner or snacks on a calendar, with weekly views.
- **Personalisation.** An onboarding flow captures dietary restrictions, allergies, favourite cuisines, disliked ingredients, skill level and prep time.
- **Authentication.** Email and password sign-up with email verification, Google sign-in via Firebase, JWT access and refresh tokens.

## Architecture

```
┌────────────────────┐        REST         ┌──────────────────────────┐
│  React + Vite SPA  │ ──────────────────▶ │  FastAPI (Python 3.11)   │
│  Redux, Tailwind   │ ◀────────────────── │  /api/v1/*               │
└────────┬───────────┘                     └───┬──────────┬───────────┘
         │ Firebase Auth                       │          │
         ▼                                     ▼          ▼
   Google sign-in                        MongoDB     Groq LLM ── tool call ──▶ Google
                                      (users, chats,  (Llama 4)                 Custom Search
                                       recipes,                                 + YouTube API
                                       meal plans)                              + page scraping
```

When a chat message arrives, `ChatService` sends the conversation to Groq with a `call_recipe_api` tool definition. If the model requests it, the backend runs the search through `SmartWebCrawler`, feeds the results back to the model, and returns a formatted answer.

## Project structure

```
backend/
  app/
    api/v1/        auth, chatbot, recipe, meal, user routers
    core/          JWT and password security helpers
    models/        Pydantic request and response models
    schemas/       MongoDB document schemas
    services/      chat (Groq), recipe search and scraping, email, auth
    config.py      environment-driven settings
    main.py        FastAPI app entry point
frontend/my-react-app/
  src/
    pages/         Landing, Auth, Onboarding, Dashboard, Chat, Recipes, MealPlan, Profile
    components/    chat UI, recipe views, route guards, sidebar
    redux/         store, slices (user, recipes, shopping lists, meal plans, preferences)
    hooks/         useChat, useRecipe, useEditor, useAuthRedirect
```

## API overview

Interactive docs are served at `/docs` (Swagger) when the backend is running.

| Area | Endpoints |
| --- | --- |
| Auth (`/api/v1/auth`) | `POST /signup`, `POST /login`, `POST /verify-email`, `POST /google`, `POST /refresh`, `GET /me` |
| Chatbot (`/api/v1/chatbot`) | `POST /chat`, `POST /chat/create`, `GET /chat/{id}`, `GET /chat/user/{user_id}`, `PUT /chat/{id}/title`, `DELETE /chat/{id}`, `POST /chat/save-recipe` |
| Recipes (`/api/v1/recipe`) | `POST /search`, `GET /user/{user_id}`, `GET /{id}`, `PUT /{id}` |
| Meal plans (`/api/v1/meal-plan`) | `POST /`, `POST /week`, `GET /user/{user_id}`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| User (`/api/v1/user`) | `PUT /update` |

## Getting started

### Prerequisites

- Python 3.11
- Node.js 18+
- A MongoDB instance (local or Atlas)
- A [Firebase](https://console.firebase.google.com) project with Google and Email/Password sign-in enabled
- A [Groq](https://console.groq.com) API key
- A Google [Programmable Search Engine](https://programmablesearchengine.google.com) ID and a Google API key with the Custom Search and YouTube Data APIs enabled

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/app/.env`:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=food_assistant_db

SECRET_KEY=change-me
ENCRYPTIONN_MASTER_KEY=change-me

GROQ_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=

# Service account JSON for Firebase Admin, as a single-line JSON string
FIREBASE_CREDENTIALS=

# Email verification (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=

FRONTEND_URL=http://localhost:5173
RECIPE_API_URL=http://localhost:8000/api/v1/recipe/search
```

Run it from the `backend` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend/my-react-app
npm install
```

Create `frontend/my-react-app/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev
```

The app is then available at http://localhost:5173.

## Deployment

Both halves include a `vercel.json` and were deployed to Vercel. The backend CORS list in `backend/app/main.py` must include your frontend's origin.

## Known limitations

- Recipes are scraped from third-party pages, so quality varies by site and layouts can break the extraction.
- No automated tests yet.

## Roadmap

- Automated tests for the API and the chat tool-calling flow
- Nutrition information and calorie tracking
- Auto-generated weekly meal plans from user preferences

## License

Released under the [MIT License](LICENSE).

## Author

Built by [Arham Mirza](https://github.com/ArhamMirza).
