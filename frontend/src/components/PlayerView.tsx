import { useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Loader2, Info, ListMusic, AudioLines } from 'lucide-react';
import { RgbBorder } from './RgbBorder';
import { useScrollRestore } from '../hooks/useScrollRestore';

interface PlayerViewProps { player: any; onOpenInfo: () => void; className?: string; }

export function PlayerView({ player, onOpenInfo, className = '' }: PlayerViewProps) {
  const { queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration, volume, meta, enriched, nextSong, prevSong, togglePlay, toggleShuffle, seekTo, changeVolume } = player;
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const currentTrack = currentIndex !== -1 ? queue[currentIndex] : null;
  const title = currentTrack?.title || 'No track selected';
  const url = currentTrack?.url || '';
  const hasTrack = !!currentTrack;
  const active = hasTrack && (isPlaying || isBuffering);
  const artwork = enriched?.albumArtUrl || meta.artwork;
  const muted = volume === 0;
  const progress = duration > 0 ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0;
  const time = (n: number) => { const v = Number.isFinite(n) ? Math.max(0, n) : 0; return `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`; };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => { rotationRef.current += e.deltaY * 0.72; setRotation(rotationRef.current); };

  const playerCard = (
    <div onWheel={onWheel} className={`relative h-full min-h-0 min-w-0 overflow-visible ${className}`}>
      {/* Pocket body: deliberately begins below the record so resizing never clips the disc. */}
      <main className="absolute inset-x-0 bottom-0 top-[29%] flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/80 shadow-[0_24px_70px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-2xl">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,.14),transparent_48%),radial-gradient(ellipse_at_90%_65%,rgba(168,85,247,.10),transparent_45%)]" />
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between px-5 pb-4 pt-[clamp(5.5rem,18%,8rem)] sm:px-8">
          <div className="w-full shrink-0 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[.24em] text-cyan-200/75"><AudioLines className="h-4 w-4 text-cyan-300" /> Now Spinning</div>
            <h2 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 truncate text-xs text-slate-400">{enriched?.artist || meta.artist || 'Select a track to begin'}{enriched?.album ? ` · ${enriched.album}` : ''}{enriched?.releaseYear ? ` · ${enriched.releaseYear}` : ''}</p>
          </div>
          <div className="w-full max-w-2xl shrink-0 pt-5">
            <div className="flex items-center gap-3"><span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">{time(currentTime)}</span><input type="range" min="0" max={duration || 100} value={currentTime} onChange={e => seekTo(Number(e.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-cyan-300" style={{background:`linear-gradient(to right,#67e8f9 0%,#818cf8 ${progress}%,rgba(255,255,255,.14) ${progress}%,rgba(255,255,255,.14) 100%)`}} aria-label="Track progress"/><span className="w-9 shrink-0 font-mono text-[10px] text-slate-400">{time(duration)}</span></div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-center gap-8 pb-1 pt-4 sm:gap-12">
            <button onClick={prevSong} disabled={!hasTrack} className="rounded-full p-2.5 text-slate-300 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label="Previous track"><SkipBack className="h-5 w-5 fill-current"/></button>
            <button onClick={togglePlay} disabled={!hasTrack} className="grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 text-white shadow-[0_8px_28px_rgba(59,130,246,.32)] hover:brightness-110 disabled:opacity-40" aria-label={isPlaying?'Pause':'Play'}>{isBuffering?<Loader2 className="h-6 w-6 animate-spin"/>:isPlaying?<Pause className="h-6 w-6 fill-current"/>:<Play className="ml-0.5 h-6 w-6 fill-current"/>}</button>
            <button onClick={nextSong} disabled={!hasTrack} className="rounded-full p-2.5 text-slate-300 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label="Next track"><SkipForward className="h-5 w-5 fill-current"/></button>
          </div>
          <div className="flex w-full shrink-0 items-center justify-between pt-2">
            <button onClick={toggleShuffle} className={`rounded-full p-2 ${mode==='shuffle'?'bg-cyan-300/15 text-cyan-200':'text-slate-500 hover:bg-white/10 hover:text-white'}`} aria-label="Toggle shuffle"><Shuffle className="h-3.5 w-3.5"/></button>
            <button className="rounded-full p-2 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="Repeat"><Repeat className="h-3.5 w-3.5"/></button>
            <div className="flex items-center gap-2"><button onClick={()=>changeVolume(muted?80:0)} className="text-slate-400 hover:text-white" aria-label={muted?'Unmute':'Mute'}>{muted?<VolumeX className="h-3.5 w-3.5"/>:<Volume2 className="h-3.5 w-3.5"/>}</button><input type="range" min="0" max="100" value={volume} onChange={e=>changeVolume(Number(e.target.value))} className="vol-slider-vertical" aria-label="Volume"/></div>
          </div>
          <button onClick={onOpenInfo} className="mx-auto mt-2 grid h-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 px-3 text-slate-300 hover:bg-white/10 xl:hidden"><span className="flex items-center gap-2 text-[11px]"><Info className="h-3.5 w-3.5"/> Lyrics & Discover</span></button>
        </div>
      </main>

      {/* Floating vinyl is outside the pocket's overflow clipping context. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[58%] items-end justify-center overflow-visible">
        <div className="relative aspect-square w-[min(66%,290px)] max-h-full translate-y-[13%]">
          <div className="absolute -bottom-[2%] left-1/2 h-2 w-[86%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-[5px]"/>
          <div className="absolute inset-0 overflow-hidden rounded-full border border-white/30 bg-[#080b13] shadow-[0_18px_45px_rgba(0,0,0,.55),0_0_28px_rgba(99,102,241,.16)]" style={{transform:`rotate(${rotation}deg)`,transition:'transform 55ms linear'}}>
            <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,.17)_0px,rgba(255,255,255,.035)_1px,transparent_2px,transparent_5px)]"/>
            <div className="absolute inset-[3%] rounded-full border border-white/10"/><div className="absolute inset-[8%] rounded-full border border-white/10"/><div className="absolute inset-[13%] rounded-full border border-white/10"/><div className="absolute inset-[18%] rounded-full border border-white/10"/><div className="absolute inset-[23%] rounded-full border border-white/10"/>
            <div className="absolute inset-[28%] overflow-hidden rounded-full border-[3px] border-white/25 bg-slate-900 shadow-[0_0_0_5px_rgba(255,255,255,.04)]">{artwork?<img src={artwork} alt={`${title} artwork`} className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center bg-gradient-to-br from-indigo-500 via-slate-900 to-fuchsia-500"><AudioLines className="h-9 w-9 text-white/80"/></div>}</div>
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_25deg,transparent,rgba(255,255,255,.25),transparent_28%,rgba(34,211,238,.12),transparent_65%,rgba(217,70,239,.16),transparent)]"/><div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,.13)]"/>
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[29%] z-30 h-[3px] w-[min(84%,540px)] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-white/65 to-transparent shadow-[0_1px_8px_rgba(0,0,0,.8)]"/>
    </div>
  );

  return active ? <RgbBorder trackId={url} isPlaying={isPlaying} isBuffering={isBuffering} className="h-full w-full overflow-visible rounded-3xl">{playerCard}</RgbBorder> : playerCard;
}

interface QueueProps { player: any; className?: string; }
PlayerView.Queue = function Queue({player,className=''}:QueueProps) {
  const {queue,currentIndex,mode,playSong,isPlaying,isBuffering}=player;
  const scrollRef=useScrollRestore('queue',queue.length>0);
  return <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[.12] bg-white/[.04] p-4 shadow-2xl backdrop-blur-xl ${className}`}>
    <h3 className="mb-2.5 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><ListMusic className="h-3.5 w-3.5"/>{mode==='shuffle'?'Shuffled Queue':'Current Queue'}</h3>
    <ul ref={scrollRef as React.RefObject<HTMLUListElement>} className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
      {queue.length===0&&<li className="py-8 text-center text-[11px] text-slate-500">Queue is empty.</li>}
      {queue.map((song:any,i:number)=>{const current=currentIndex===i;const item=<div className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition ${current?'border-transparent bg-indigo-500/15 text-indigo-100':'border-white/5 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/10'}`}><span className="w-4 shrink-0 font-mono text-[11px] text-slate-500">{i+1}</span><span className="min-w-0 truncate text-[11px] font-medium">{song.title}</span></div>;return <li key={song.url||i} onClick={()=>playSong(i)} className="list-none">{current?<RgbBorder trackId={song.url} isPlaying={isPlaying} isBuffering={isBuffering} className="rounded-2xl">{item}</RgbBorder>:item}</li>;})}
    </ul>
  </section>;
};
