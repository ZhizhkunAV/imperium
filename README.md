# IMPERIUM Online

A historical online strategy game website inspired by Rome: Total War, featuring a dark antique theme with wood, gold, marble, and stone textures, serif fonts, and monumental ancient style.

## Pages

- **Home (index.html)**: Main page with three large buttons for Campaign, Settings, and About.
- **Campaign (campaign.html)**: Campaign map page with placeholders for Mediterranean map, faction selection, and legend.
- **Settings (settings.html)**: Game settings with sliders and selectors for music, sound, language, and difficulty.
- **About (about.html)**: Placeholder page for game description.

## Features

- Responsive design (mobile-friendly)
- Navigation between all pages
- Hover animations on buttons
- Google Fonts (Cinzel) for antique serif fonts
- Marble/stone texture backgrounds with CSS gradients
- Gold borders and accents
- AI image generation integration (OpenAI DALL-E) for map and about page images
- Background epic music (auto-play or manual play button)

## Technologies

- HTML5
- CSS3 (Gradients, Flexbox, Grid)
- JavaScript (ES6+)
- Vite (build tool)
- OpenAI API (for image generation)

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open http://localhost:5173/ in your browser

## AI Integration

To enable AI image generation:
1. Get an OpenAI API key from https://platform.openai.com/
2. Replace `YOUR_OPENAI_API_KEY` in `main.js` with your key
3. Click "Generate" buttons on Campaign and About pages

## Next Steps

- Add more interactive elements
- Implement game logic
- Deploy to cloud (Vercel/Netlify)
- Add sound effects and music
