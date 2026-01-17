import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypingEffectProps {
  text: string;
  onComplete?: () => void;
}

export const TypingEffect = ({ text, onComplete }: TypingEffectProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!text) {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    setIsTyping(true);
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 20); // Adjust speed of typing here

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return (
    <>
      {isTyping ? (
        <>
          {displayedText}
          <span className="typing-cursor" />
        </>
      ) : (
        <MarkdownRenderer content={text} />
      )}
    </>
  );
};
