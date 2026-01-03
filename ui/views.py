import os
from typing import Any, Dict

import requests
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

AUTH_API_BASE_URL = os.environ.get("AUTH_API_BASE_URL", "http://localhost:8000")
PREDICTION_API_BASE_URL = os.environ.get("PREDICTION_API_BASE_URL", "http://localhost:8001")
API_VERSION = os.environ.get("API_VERSION", "2")


def _fetch_predictions(access_token: str) -> Dict[str, Any]:
    """Fetch predictions from prediction_skills API. Returns an empty list on failure."""
    if not access_token:
        return {"results": [], "error": "Missing access token"}

    url = f"{PREDICTION_API_BASE_URL}/api/v{API_VERSION}/predictions/"
    try:
        resp = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": f"application/json; version={API_VERSION}",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"results": [], "error": f"API returned {resp.status_code}: {resp.text}"}
    except requests.RequestException as exc:
        return {"results": [], "error": str(exc)}


def dashboard(request: HttpRequest) -> HttpResponse:
    # TODO: plug session-based token storage. For now, allow passing ?token=... for manual testing.
    access_token = request.GET.get("token", "")
    predictions = _fetch_predictions(access_token)
    return render(
        request,
        "dashboard.html",
        {
            "predictions": predictions.get("results", []),
            "error": predictions.get("error"),
            "auth_base": AUTH_API_BASE_URL,
            "prediction_base": PREDICTION_API_BASE_URL,
        },
    )


def login_view(request: HttpRequest) -> HttpResponse:
    # Placeholder UI; actual login posts directly to auth service.
    return render(
        request,
        "login.html",
        {
            "auth_base": AUTH_API_BASE_URL,
        },
    )


def register_view(request: HttpRequest) -> HttpResponse:
    # Placeholder UI; actual register posts directly to auth service.
    return render(
        request,
        "register.html",
        {
            "auth_base": AUTH_API_BASE_URL,
        },
    )


def prediction_detail(request: HttpRequest, prediction_id: str) -> HttpResponse:
    # Stub detail page; integrate API call later.
    return render(
        request,
        "prediction_detail.html",
        {
            "prediction_id": prediction_id,
        },
    )


def profile_view(request: HttpRequest) -> HttpResponse:
    return render(request, "profile.html")
