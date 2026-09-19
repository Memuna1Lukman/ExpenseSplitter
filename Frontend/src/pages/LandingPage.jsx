import { ArrowRight, Check, CircleDollarSign, ReceiptText, Send, UsersRound } from 'lucide-react'
import { Button } from '../components/ui/Button'

const features = [
  [ReceiptText, 'Add expenses in seconds', 'Capture a bill, choose who shared it, and let us handle the math.'],
  [UsersRound, 'Keep every group together', 'Trips, housemates, dinners, and more — all your shared spending in one place.'],
  [Send, 'Settle up simply', 'See the clearest path to paid-up balances with fewer transfers.'],
]

export function LandingPage({ onGetStarted, onSignIn }) {
  return <main className="landing-page">
    <section className="landing-hero">
      <nav className="landing-nav"><span className="brand"><i><CircleDollarSign size={20}/></i>splitwise<span>.</span></span><div><button className="text-action" onClick={onSignIn}>Log in</button><Button onClick={onGetStarted}>Sign up free <ArrowRight size={16}/></Button></div></nav>
      <div className="hero-layout">
        <div className="hero-copy fade-up"><p className="eyebrow">Shared money, made simple</p><h1>Spend time with friends,<br/><em>not spreadsheets.</em></h1><p>Split bills, track shared expenses, and settle up without the awkward math. Everything stays clear, so your friendships can too.</p><div className="hero-actions"><Button onClick={onGetStarted} className="hero-primary">Get started — it&apos;s free <ArrowRight size={17}/></Button><button className="text-action" onClick={onSignIn}>I already have an account</button></div><small><Check size={15}/> No credit card required</small></div>
        <div className="hero-visual fade-up"><div className="halo"/><div className="expense-card"><header><div><b>Weekend in Reykjavík</b><small>4 friends · Sep 14–16</small></div><span className="avatar-stack"><i>J</i><i>A</i><i>L</i></span></header><div className="balance"><small>Your total balance</small><strong>+ $42.50</strong><small>You are owed</small></div><div className="expense-row"><span>⌂</span><div><b>Apartment</b><small>Split equally</small></div><b>$164.00</b></div><div className="expense-row"><span>☕</span><div><b>Sunday brunch</b><small>You paid</small></div><b>$48.00</b></div><button>View group <ArrowRight size={14}/></button></div><div className="settled"><i><Check size={13}/></i><div><b>All settled up!</b><small>with Jordan</small></div></div><div className="owed"><span>↗</span><div><small>Alex owes you</small><b>$18.50</b></div></div></div>
      </div>
    </section>
    <section className="landing-trust"><p>Money is better when it&apos;s shared fairly.</p><div>TRIPS · ROOMMATES · DINNERS · EVERYDAY LIFE</div></section>
    <section className="landing-features"><p className="eyebrow">Built for real life</p><h2>The easy way to share<br/>every expense.</h2><p>From a quick coffee to your next big adventure, Splitwise keeps the money side of life easy.</p><div className="feature-grid">{features.map(([Icon, title, text]) => <article key={title}><i><Icon size={22}/></i><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="landing-cta"><p className="eyebrow">Start splitting smarter</p><h2>Good friends don&apos;t need<br/>to keep score.</h2><p>We&apos;ll do it for you.</p><Button onClick={onGetStarted}>Create your free account <ArrowRight size={17}/></Button></section>
    <footer><span className="brand"><i><CircleDollarSign size={18}/></i>splitwise<span>.</span></span><small>© 2026 Splitwise · Made for sharing</small></footer>
  </main>
}
