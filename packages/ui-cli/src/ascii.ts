/**
 * Exact ASCII Art Illustrations from PROMPT.md
 *
 * Futurama delivery ship: https://asciiart.website/art/4158 (by Sebastian Stöcker / SSt)
 * Bender Mascot: Silver Saks
 */
export const PLANET_EXPRESS_SHIP_ASCII = [
  '                     `. ___',
  "                    __,' __`.                _..----....____",
  "        __...--.'``;.   ,.   ;``--..__     .'    ,-._    _.-'",
  "  _..-''-------'   `'   `'   `'     O ``-''._   (,;') _,'",
  ",'________________                          \\`-._`-','",
  " `._              ```````````------...___   '-.._'-:",
  '    ```--.._      ,.                     ````--...__\\-.',
  '            `.--. `-`                       ____    |  |`',
  "              `. `.                       ,'`````.  ;  ;`",
  "                `._`.        __________   `.      \\'__/`",
  '                   `-:._____/______/___/____`.     \\  `',
  '                               |       `._    `.    \\',
  '                               `._________`-.   `.   `.___',
  "                                             SSt  `------'`",
].join('\n');

export const BENDER_MASCOT_ASCII = [
  '      _',
  '     ( )',
  '      H',
  '      H',
  '     _H_ ',
  "  .-'-.-'-.",
  ' /         \\',
  '|           |',
  "|   .-------'._",
  "|  / /  '.' '. \\",
  '|  \\ \\ @   @ / / ',
  "|   '---------'        ",
  '|    _______|  ',
  "|  .'-+-+-+|  ",
  "|  '.-+-+-+|         Silver Saks",
  '|    """""" |',
  "'-.__   __.-'",
  '     """',
].join('\n');

export const FUTURAMA_QUOTES = [
  'Good news, everyone! Your universal AI repo is ready for delivery!',
  'Bite my shiny metal scaffold!',
  'Shut up and take my dependencies! (All pinned and audited, of course.)',
  'I am Bender, please insert girder — or select an architecture pattern.',
  'little.bootstrapper: Delivering clean architecture across all 5 AI agents since 3000.',
] as const;

export function getRandomQuote(): string {
  return FUTURAMA_QUOTES[Math.floor(Math.random() * FUTURAMA_QUOTES.length)] ?? FUTURAMA_QUOTES[0];
}
