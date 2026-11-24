export type HelpPage = {
  title: string;
  paragraphs: string[];
};

const HELP: { [key: string]: HelpPage } = {
  logon: {
    title: 'Welcome',
    paragraphs: [
      'Enter a display name to join the room.',
      'Everyone logged into the same room shares the live game — creating, solving, and joining each other in real time.',
    ],
  },
  home: {
    title: 'Home',
    paragraphs: [
      'Online — see who is here. If someone is solving a leaf, Join follows them on that puzzle.',
      'Create — Plant starts a new leaf.',
      'Recent leaves — open a saved puzzle to solve (or View one you already solved). Others can join you.',
      'All leaves — browse the full library.',
    ],
  },
  makeleaf: {
    title: 'Make a leaf',
    paragraphs: [
      'Place four cards on the clover. The fifth card is a decoy and stays off the leaf.',
      'Drag cards onto slots, drag them off to remove, or drop onto an occupied slot to swap. Use the rotate control in the centre of a card to spin it.',
      'Tap a green petal, then type a one-word clue on the keyboard for the two words that meet at that petal.',
      'The dice button above the keyboard picks four random cards and rotations.',
      'Upload when you have four clues and four cards on the leaf. Compost discards and deals a fresh hand.',
    ],
  },
  solve: {
    title: 'Solve',
    paragraphs: [
      'Five cards start on the heap. Arrange four of them on the clover so each petal’s clue fits the two words that touch it. One card is a decoy.',
      'Drag onto a slot to place; drag off to remove; drop onto an occupied slot to replace. Rotate with the centre button.',
      'When all four slots are filled, tap Guess to check your answer. Each try is counted per player.',
    ],
  },
  browse: {
    title: 'Library',
    paragraphs: [
      'Every saved leaf is listed here.',
      'Open one to solve it. If others are in the room, they can join the same puzzle.',
    ],
  },
};

const FALLBACK: HelpPage = {
  title: 'Help',
  paragraphs: ['No specific help for this screen yet.'],
};

/** Pick help copy from the current router URL. */
export function helpForUrl(url: string): HelpPage {
  const path = (url || '').split('?')[0];
  if (path.includes('/logon')) {
    return HELP['logon'];
  }
  if (path.includes('/home')) {
    return HELP['home'];
  }
  if (path.includes('/makeleaf')) {
    return HELP['makeleaf'];
  }
  if (path.includes('/solve')) {
    return HELP['solve'];
  }
  if (path.includes('/browse')) {
    return HELP['browse'];
  }
  return FALLBACK;
}
