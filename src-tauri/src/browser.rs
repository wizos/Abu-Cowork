//! Native embedded browser — backs the workspace "browser" tab with a real
//! child webview (`window.add_child`, Tauri `unstable` feature) instead of an
//! `<iframe>`. Unlike an iframe, a top-level native webview is NOT subject to
//! `X-Frame-Options` / CSP `frame-ancestors`, so it can load any site
//! (Google, GitHub, banks, …) — matching TRAE/Electron's BrowserView.
//!
//! ## Overlay model (the tricky part)
//! The child webview is a native layer painted OVER the React UI at pixel
//! coordinates — it does NOT obey CSS (z-index, `display:none`, rounding,
//! overflow). The frontend (`BrowserTab.tsx`) owns a placeholder `<div>` and
//! streams its viewport rect here via `browser_set_bounds`; whenever the tab
//! is inactive, the panel is collapsed, a modal is up, or the component
//! unmounts, the frontend must `browser_hide` (CSS hiding is invisible to the
//! native layer). Labels are `browser-{tabId}`.

use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Rect, WebviewUrl};
use tauri::webview::WebviewBuilder;

fn wv_label(id: &str) -> String {
    format!("browser-{}", id)
}

fn parse_url(url: &str) -> Result<tauri::Url, String> {
    url.parse().map_err(|e| format!("invalid url '{}': {}", url, e))
}

/// Create the child webview for a browser tab (or, if it already exists,
/// navigate + reposition it). `x/y/width/height` are logical (CSS) pixels in
/// the main window's content area — i.e. the placeholder div's
/// getBoundingClientRect.
#[tauri::command]
pub fn browser_create(
    app: AppHandle,
    id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = wv_label(&id);
    if let Some(wv) = app.get_webview(&label) {
        // Already created (e.g. StrictMode double-mount) — reuse it.
        if !url.is_empty() {
            let _ = wv.navigate(parse_url(&url)?);
        }
        return set_bounds_inner(&wv, x, y, width, height);
    }
    let window = app
        .get_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    let target = if url.is_empty() { "about:blank".to_string() } else { url };
    let parsed = parse_url(&target)?;

    let app_nav = app.clone();
    let id_nav = id.clone();
    let builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed)).on_navigation(
        move |u| {
            // Report real (incl. in-page/link) navigations so the address bar
            // and back/forward availability can follow.
            let _ = app_nav.emit(&format!("browser://nav/{}", id_nav), u.to_string());
            true
        },
    );

    window
        .add_child(
            builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width.max(1.0), height.max(1.0)),
        )
        .map_err(|e| format!("failed to add child webview: {}", e))?;
    Ok(())
}

fn set_bounds_inner<R: tauri::Runtime>(
    wv: &tauri::Webview<R>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    wv.set_bounds(Rect {
        position: LogicalPosition::new(x, y).into(),
        size: LogicalSize::new(width.max(1.0), height.max(1.0)).into(),
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_set_bounds(
    app: AppHandle,
    id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let wv = app
        .get_webview(&wv_label(&id))
        .ok_or_else(|| "browser webview not found".to_string())?;
    set_bounds_inner(&wv, x, y, width, height)
}

#[tauri::command]
pub fn browser_navigate(app: AppHandle, id: String, url: String) -> Result<(), String> {
    let wv = app
        .get_webview(&wv_label(&id))
        .ok_or_else(|| "browser webview not found".to_string())?;
    wv.navigate(parse_url(&url)?).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_back(app: AppHandle, id: String) -> Result<(), String> {
    let wv = app.get_webview(&wv_label(&id)).ok_or_else(|| "not found".to_string())?;
    wv.eval("history.back()").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_forward(app: AppHandle, id: String) -> Result<(), String> {
    let wv = app.get_webview(&wv_label(&id)).ok_or_else(|| "not found".to_string())?;
    wv.eval("history.forward()").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_reload(app: AppHandle, id: String) -> Result<(), String> {
    let wv = app.get_webview(&wv_label(&id)).ok_or_else(|| "not found".to_string())?;
    wv.eval("location.reload()").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_hide(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview(&wv_label(&id)) {
        wv.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn browser_show(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview(&wv_label(&id)) {
        wv.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn browser_close(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview(&wv_label(&id)) {
        wv.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
