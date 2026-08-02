import React from "react";

export interface FuriganaTextProps {
  text: string;
  className?: string;
}

export function FuriganaText({ text, className = "" }: FuriganaTextProps) {
  // Regex to match sequences of Japanese characters followed by [hiragana/katakana].
  // Matches Kanji (or mixed Kanji/Kana) up to the bracket.
  // Group 1: The Base word (Kanji)
  // Group 2: The Reading (Kana inside brackets)
  const furiganaRegex = /([一-龯ぁ-んァ-ンー]+)\s*\[([ぁ-んァ-ンー]+)\]/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = furiganaRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    // Add ruby tag
    parts.push(
      <ruby key={`ruby-${match.index}`} className="mx-0.5">
        {match[1]}
        <rt className="text-[0.6em] text-muted-foreground font-medium select-none">{match[2]}</rt>
      </ruby>
    );

    lastIndex = furiganaRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return (
    <span className={className} lang="ja">
      {parts}
    </span>
  );
}
