/**
 * SignalBanner — Contextual trust-building banner below GPA hero
 *
 * Three levels: good, attention, concern.
 * Designed to exactly match the prototype's .fp-signal-banner.
 */

export type SignalLevel = 'good' | 'attention' | 'concern'

export interface SignalBannerProps {
  level: SignalLevel | null
  staggerIndex?: number
}

export function SignalBanner({ level }: SignalBannerProps) {
  if (!level) return null
  
  // Specific styling class based on level mapped to the family portal styles
  let levelClass = '';
  if (level === 'attention') levelClass = 'attention';
  if (level === 'concern') levelClass = 'concern';

  let title: React.ReactNode = <>Nothing to worry about <em>yet.</em></>;
  let body = "No concerning patterns in the early data. If something changes — a failing grade, repeated missing work, absence pattern — you'll see a note here first and a message from the teacher in your inbox.";
  let icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>;

  if (level === 'attention') {
    title = <>A few items <em>need attention.</em></>;
    body = "There are a few recent assignments that might require a quick review. Clicking into a course card allows you to message the teacher for details.";
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  } else if (level === 'concern') {
    title = <>Some grades <em>need your attention.</em></>;
    body = "Review the latest patterns below. Consider scheduling a short chat with the school to discuss options to get things back on track.";
    icon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  }

  return (
    <div className={`fp-signal-banner ${levelClass}`}>
      <div className="fp-signal-icon">{icon}</div>
      <div>
        <h3 className="fp-signal-head">{title}</h3>
        <p className="fp-signal-body">{body}</p>
      </div>
      <button className="fp-t-btn">How this works</button>
    </div>
  )
}
