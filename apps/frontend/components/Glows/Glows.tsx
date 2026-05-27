export const Glows = () => (
  <>
    <div className="absolute top-[-120px] left-[18%] w-[26rem] h-[26rem] bg-cyan-900/25 rounded-full blur-[140px]" />
    <div className="absolute top-[-100px] left-[22%] w-[20rem] h-[20rem] bg-cyan-800/15 rounded-full blur-3xl" />
    <div className="absolute bottom-[-120px] right-[12%] w-[24rem] h-[24rem] bg-cyan-900/20 rounded-full blur-[140px]" />
    <div className="absolute top-[45%] left-[65%] w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl" />
    <div className="absolute top-0 left-1/2 w-[420px] h-[420px] bg-cyan-500/8 blur-[120px] -translate-x-1/2" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04),_transparent_65%)]" />
  </>
);

export const MinimalGlow = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-blue-500/[0.06]" />

    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-400/[0.12] blur-[160px] rounded-full" />

    <div className="absolute top-[25%] -left-32 w-[30rem] h-[30rem] bg-cyan-300/[0.08] blur-[140px] rounded-full" />

    <div className="absolute bottom-[-25%] right-[-10%] w-[28rem] h-[28rem] bg-blue-400/[0.08] blur-[140px] rounded-full" />

    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.035),transparent_75%)]" />

    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

    <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none bg-[url('/noise.png')]" />
  </div>
);
