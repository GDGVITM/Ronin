/**
 * Renders a <style> tag that overrides body's parchment background
 * with black for round/coding pages.
 */
export function RoundBackground() {
  return (
    <style>{`
      body {
        background: #000 !important;
        background-image: none !important;
        background-color: #000 !important;
        background-attachment: initial !important;
      }
    `}</style>
  );
}
