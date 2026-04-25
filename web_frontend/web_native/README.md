# Mobile-responsive configuration (web_native)

This folder holds **mobile-specific responsive styles and configuration** for the Digital Will web app. No business logic or app rewrite—only CSS and layout adaptation for:

- Android and iPhone
- Small (e.g. < 480px), medium (480px–767px), and large mobile (768px+)
- Browser device simulation and real devices

## Files

| File | Purpose |
|------|--------|
| `mobile-responsive.css` | Base mobile rules: no horizontal scroll, safe-area insets, touch-friendly min sizes, container padding, fluid media. |
| `responsive-utilities.css` | Utility classes: fluid widths, column stacking, show/hide by breakpoint, touch targets, safe-area, truncate. |
| `README.md` | This file. |

## Breakpoints (aligned with Tailwind)

| Name | Min width | Use |
|------|-----------|-----|
| (default) | 0 | Mobile first |
| `sm` | 640px | Large mobile / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

Extra narrow (used in CSS only):

- **xs**: max-width 479px (small mobile)
- **xs-sm**: 480px–767px (medium mobile)

## Usage

Styles are imported from `src/index.css` after Tailwind. Use:

1. **Tailwind responsive classes** in components: `flex flex-col md:flex-row`, `px-4 md:px-6`, `text-sm md:text-base`, `hidden md:flex`, etc.
2. **web_native utilities** when needed: `.touch-target`, `.safe-top`, `.table-responsive`, `.min-tap`, `.hide-xs`, `.show-xs`.
3. **Container**: Keep using `container mx-auto px-4` (or `px-4 sm:px-6`); `mobile-responsive.css` tightens container padding on very small screens.

## Packaging as mobile APK

The app remains a **responsive web app**. To package as APK:

- Use a tool that wraps the built static site (e.g. Cordova, Capacitor, or a simple WebView shell).
- Ensure the WebView uses the same viewport and loads the production URL or `file://` bundle.
- No Expo or React Native is required for this responsive enhancement; the user’s note about `create-expo-app` and `react-native-webview` is for a separate native path. This folder only prepares the **existing web app** for mobile browsers and WebView.
