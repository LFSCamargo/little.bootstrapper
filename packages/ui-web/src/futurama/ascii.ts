/**
 * Futurama ASCII art sources.
 *
 * The ASCII art is no longer hand-drawn text: it is produced at runtime by the
 * Aceternity UI `AsciiArt` component, which applies an ASCII filter on top of the
 * source images below (https://ui.aceternity.com/components/ascii-art).
 *
 * The image files are served from the consuming web app's `public/images/` folder.
 */
export interface AsciiImageSource {
  src: string;
  alt: string;
}

export const PLANET_EXPRESS_SHIP_IMAGE: AsciiImageSource = {
  src: '/images/planet-express-ship.jpg',
  alt: 'ASCII art of the Futurama delivery ship flying through the sky',
};

export const BENDER_MASCOT_IMAGE: AsciiImageSource = {
  src: '/images/bender.png',
  alt: 'ASCII art of Bender smoking a cigar',
};
