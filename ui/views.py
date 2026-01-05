import os
from typing import Any, Dict

import requests
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse

AUTH_API_BASE_URL = os.environ.get("AUTH_API_BASE_URL", "http://localhost:8000")
PREDICTION_API_BASE_URL = os.environ.get("PREDICTION_API_BASE_URL", "http://localhost:8001")
API_VERSION = os.environ.get("API_VERSION", "2")


def _extract_error(resp: requests.Response) -> str:
    try:
        data = resp.json()
        # Try common shapes: {"meta": {"message": ...}} or {"detail": ...} or {"errors": ...}
        meta_msg = data.get("meta", {}).get("message")
        detail = data.get("detail")
        errors = data.get("errors")
        if meta_msg:
            return f"{resp.status_code}: {meta_msg}"
        if detail:
            return f"{resp.status_code}: {detail}"
        if errors:
            return f"{resp.status_code}: {errors}"
    except Exception:
        pass
    return f"Erreur {resp.status_code}: {resp.text}"


def _store_session_tokens(request: HttpRequest, data: Dict[str, Any]) -> None:
    tokens = data.get("tokens", {})
    user = data.get("user", {})
    request.session["access_token"] = tokens.get("access")
    request.session["refresh_token"] = tokens.get("refresh")
    request.session["user_email"] = user.get("email")
    request.session["user_role"] = user.get("role")


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
    access_token = request.session.get("access_token") or request.GET.get("token", "")
    predictions = _fetch_predictions(access_token)
    return render(
        request,
        "dashboard.html",
        {
            "predictions": predictions.get("results", []),
            "error": predictions.get("error"),
            "auth_base": AUTH_API_BASE_URL,
            "prediction_base": PREDICTION_API_BASE_URL,
            "user_email": request.session.get("user_email"),
            "user_role": request.session.get("user_role"),
        },
    )


def login_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")
        payload = {"email": email, "password": password}
        try:
            resp = requests.post(
                f"{AUTH_API_BASE_URL}/api/auth/login/",
                json=payload,
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                _store_session_tokens(request, data)
                return redirect(reverse("ui:dashboard"))
            error = _extract_error(resp)
        except requests.RequestException as exc:
            error = str(exc)
        return render(
            request,
            "login.html",
            {"auth_base": AUTH_API_BASE_URL, "error": error},
            status=401,
        )

    return render(
        request,
        "login.html",
        {
            "auth_base": AUTH_API_BASE_URL,
        },
    )


def register_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        payload = {
            "first_name": request.POST.get("first_name", ""),
            "last_name": request.POST.get("last_name", ""),
            "email": request.POST.get("email", ""),
            "username": request.POST.get("username", ""),
            "password": request.POST.get("password", ""),
        }
        try:
            resp = requests.post(
                f"{AUTH_API_BASE_URL}/api/auth/register/",
                json=payload,
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                _store_session_tokens(request, data)
                return redirect(reverse("ui:dashboard"))
            error = _extract_error(resp)
        except requests.RequestException as exc:
            error = str(exc)
        return render(
            request,
            "register.html",
            {"auth_base": AUTH_API_BASE_URL, "error": error},
            status=400,
        )

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
    return render(
        request,
        "profile.html",
        {
            "user_email": request.session.get("user_email"),
            "user_role": request.session.get("user_role"),
        },
    )


def logout_view(request: HttpRequest) -> HttpResponse:
    request.session.flush()
    return redirect(reverse("ui:login"))


def refresh_view(request: HttpRequest) -> HttpResponse:
    refresh_token = request.session.get("refresh_token")
    if not refresh_token:
        return redirect(reverse("ui:login"))
    try:
        resp = requests.post(
            f"{AUTH_API_BASE_URL}/api/auth/refresh/",
            json={"refresh": refresh_token},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            _store_session_tokens(request, data)
            return redirect(reverse("ui:dashboard"))
        error = _extract_error(resp)
    except requests.RequestException as exc:
        error = str(exc)
    return render(
        request,
        "login.html",
        {"auth_base": AUTH_API_BASE_URL, "error": error},
        status=401,
    )
