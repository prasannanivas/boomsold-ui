// MaskedOutside.tsx
import { useMemo } from "react";
import { Polygon, Pane } from "react-leaflet";

/**
 * Build a single polygon-with-holes:
 * - Outer ring = whole world
 * - Holes = all exterior rings from the GeoJSON (converted to [lat, lng])
 */
function ringsFromGeoJSON(geojson) {
  if (!geojson) return [];

  const toLatLng = (ring) => ring.map(([lng, lat]) => [lat, lng]);

  // Collect *exterior* rings from Polygon/MultiPolygon/Feature/FeatureCollection
  const collectExteriors = (g, out) => {
    if (!g) return;

    const pushPolygon = (coords) => {
      if (coords.length > 0) {
        // coords[0] is the exterior ring in GeoJSON
        out.push(toLatLng(coords[0]));
      }
    };

    switch (g.type) {
      case "Polygon":
        pushPolygon(g.coordinates);
        break;
      case "MultiPolygon":
        g.coordinates.forEach(pushPolygon);
        break;
      case "Feature":
        collectExteriors(g.geometry, out);
        break;
      case "FeatureCollection":
        g.features.forEach((f) => collectExteriors(f.geometry, out));
        break;
      default:
        break;
    }
  };

  const holes = [];
  collectExteriors(geojson, holes);
  return holes;
}

export default function MaskedOutside({
  geojson,
  opacity = 1,
  paneName = "mask-pane",
}) {
  const holes = useMemo(() => ringsFromGeoJSON(geojson), [geojson]);

  // Whole world outer ring (must be clockwise; Leaflet handles orientation)
  const world = useMemo(
    () => [
      [-90, -180],
      [90, -180],
      [90, 180],
      [-90, 180],
    ],
    []
  );

  if (!holes.length) return null;

  // One polygon with the world as outer ring and all GeoJSON exteriors as holes
  const positions = [world, ...holes];

  return (
    <>
      {/* Keep mask above tiles but below markers/labels; non-interactive */}
      <Pane
        name={paneName}
        style={{ pointerEvents: "none", zIndex: 450 }} // Tiles ~200, vectors ~400
      />
      <Polygon
        pane={paneName}
        positions={positions}
        pathOptions={{
          color: "black",
          fillColor: "white",
          fillOpacity: opacity,
          stroke: false,
        }}
        interactive={false}
      />
    </>
  );
}
