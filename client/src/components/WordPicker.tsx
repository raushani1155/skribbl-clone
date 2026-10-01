interface Props {
  words: string[];
  onPick: (word: string) => void;
}

export function WordPicker({ words, onPick }: Props) {
  return (
    <div className="overlay">
      <h2 className="overlay__title">Choose a word</h2>
      <div className="choices">
        {words.map((w) => (
          <button key={w} className="btn btn--green choice" onClick={() => onPick(w)}>
            {w}
          </button>
        ))}
      </div>
      <p className="overlay__sub">A word is picked for you after 15 seconds</p>
    </div>
  );
}