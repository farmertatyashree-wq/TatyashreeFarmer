# Tatyashree Farmers Field Companion

run this file

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tatyashree-farmers-field-companion.lovable.app

## Weather provider configuration

Configure `WEATHER_API_KEY` on the server with an OpenWeather API key that has One Call 3.0 access. The key is read only by the server-side weather function and must not be prefixed with `VITE_`.

```sh
WEATHER_API_KEY=your_openweather_api_key
```

## Gemini AI configuration

Configure Gemini on the server for chat, crop planning, fertilizer guidance, disease photo review, and market analysis:

```sh
GEMINI_API_KEY=your_gemini_api_key
```

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b6cf6ba-9e57-4d7a-8e23-186d89d1692e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
