# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Data Fetching Scripts

The project includes several utility scripts for fetching POI (Points of Interest) and walkability data for Montreal neighborhoods.

### Fetch Sports Arenas and Restaurants

Fetches sports facilities (stadiums, arenas, ice rinks, fitness centers, etc.) and dining establishments (restaurants, cafes, bars, etc.) from OpenStreetMap:

```bash
node src/scripts/fetchSportsAndRestaurants.js
```

This will:

- Fetch sports arenas and facilities from OSM Overpass API
- Fetch restaurants, cafes, bars, and other dining locations
- Save individual files: `public/assets/montreal_sports.json` and `public/assets/montreal_restaurants.json`
- Merge data into the main POIs file: `public/assets/montreal_pois.json`
- Display comprehensive statistics including top cuisines and sports

### Fetch All POIs

Comprehensive POI fetcher that can fetch all types of POIs or specific categories:

```bash
# Fetch all POI types (sports, restaurants, parks, hospitals, schools)
node src/scripts/fetchAllPOIs.js

# Fetch only sports facilities
node src/scripts/fetchAllPOIs.js --type=sports

# Fetch only restaurants
node src/scripts/fetchAllPOIs.js --type=restaurants

# Other available types: parks, hospitals, schools
node src/scripts/fetchAllPOIs.js --type=parks
```

Features:

- Fetches from OpenStreetMap Overpass API
- Saves category-specific JSON files
- Merges all data into main POIs file
- Avoids duplicates
- Includes comprehensive metadata (address, phone, website, opening hours, etc.)
- Generates detailed statistics

### Fetch Walk Scores

Fetch real walkability scores from the Walk Score API:

```bash
# Fetch basic walk scores
node src/scripts/fetchRealWalkScores.js

# Fetch enhanced scores with transit and bike details
node src/scripts/fetchEnhancedWalkScores.js
```

These scripts:

- Fetch real Walk Score, Transit Score, and Bike Score data
- Calculate accessibility scores
- Save to `src/data/realWalkScores.json` and `src/data/enhancedWalkScores.json`
- Update `src/utils/walkabilityScores.js` for use in the app
- Display top walkable neighborhoods

### Data Files

Generated data files are stored in:

- `public/assets/` - POI JSON files (sports, restaurants, parks, hospitals, schools)
- `src/data/` - Walk score data
- `src/utils/` - Utility functions for accessing scores

### API Sources

- **OpenStreetMap Overpass API**: For POI data (free, no key required)
- **Walk Score API**: For walkability scores (API key: `d9b403ccf5205722332f9548756ba571`)
