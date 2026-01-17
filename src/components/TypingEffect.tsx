import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypingEffectProps {
  text: string;
  onComplete?: () => void;
}

export const TypingEffect = ({ text, onComplete }: TypingEffectProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!text) return;

    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
        setShowCursor(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 20); // Adjust speed of typing here

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return (
    <>
      <MarkdownRenderer content={displayedText} />
      {showCursor && <span className="typing-cursor" />}
    </>
  );
};
