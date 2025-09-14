import { PropsWithChildren } from "react";

export default function FlipCard({
  title,
  flipped,
  frontHint,
  children,
}: PropsWithChildren<{
  title: string;
  flipped: boolean;
  frontHint?: string;
}>) {
  return (
    <div className={`flip ${flipped ? "flipped" : ""}`}>
      <div className="flip-inner">
        {/* front (empty) */}
        <div className="flip-face card p-4 flip-front">
          <div className="card-title text-sm text-ink/70">{title}</div>
          {frontHint ? <div className="mt-2 text-xs text-ink/60">{frontHint}</div> : null}
          <div className="h-24" />
        </div>
        {/* back (content) */}
        <div className="flip-face flip-back card p-4">
          <div className="card-title text-sm text-ink/70">{title}</div>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
