import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { SCENARIOS } from "@/game/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { sfx } from "@/lib/sounds";
import { Users, Copy, Crown, Check, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

type Player = { id: string; name: string; vote?: number };
type RoomState = {
  code: string;
  hostId: string;
  started: boolean;
  round: number;
  scenarioIdx: number[];
  players: Player[];
  scores: Record<string, number>;
  reveal: boolean;
};

function genCode() {
  return Array.from({ length: 4 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");
}

export default function Multiplayer() {
  const { user, profile, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"menu" | "lobby">("menu");
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isHostRef = useRef(false);
  const roomRef = useRef<RoomState | null>(null);
  const myId = user?.id || "anon";
  const myName = profile?.display_name || "Founder";

  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => () => { channelRef.current?.unsubscribe(); }, []);
  useEffect(() => { if (!authLoading && !user) nav("/auth"); }, [user, authLoading, nav]);

  const broadcastState = (next: RoomState) => {
    setRoom(next);
    roomRef.current = next;
    channelRef.current?.send({ type: "broadcast", event: "state", payload: next });
  };

  const subscribe = (roomCode: string, asHost: boolean, initial?: RoomState) => {
    isHostRef.current = asHost;
    const ch = supabase.channel(`mp-${roomCode}`, {
      config: { broadcast: { self: true, ack: true }, presence: { key: myId } },
    });
    channelRef.current = ch;

    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      const state = payload as RoomState;
      setRoom(state);
      roomRef.current = state;
    });

    ch.on("broadcast", { event: "request_state" }, () => {
      if (isHostRef.current && roomRef.current) {
        ch.send({ type: "broadcast", event: "state", payload: roomRef.current });
      }
    });

    ch.on("broadcast", { event: "vote" }, ({ payload }: any) => {
      if (!isHostRef.current) return;
      const r = roomRef.current;
      if (!r || r.reveal) return;
      const players = r.players.map((p) => p.id === payload.id ? { ...p, vote: payload.vote } : p);
      const allVoted = players.length > 0 && players.every((p) => p.vote !== undefined);
      let next: RoomState = { ...r, players };
      if (allVoted) {
        const sc = SCENARIOS[r.scenarioIdx[r.round]];
        const counts: Record<number, number> = {};
        players.forEach((p) => { counts[p.vote!] = (counts[p.vote!] || 0) + 1; });
        const winnerIdx = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
        const choice = sc.choices[winnerIdx];
        const scores = { ...r.scores };
        players.forEach((p) => {
          if (p.vote === winnerIdx) scores[p.id] = (scores[p.id] || 0) + (choice.good ? 100 : 25);
        });
        next = { ...next, reveal: true, scores };
      }
      broadcastState(next);
    });

    ch.on("presence", { event: "sync" }, () => {
      if (!isHostRef.current) return;
      const state = ch.presenceState();
      const presentIds = Object.keys(state);
      const r = roomRef.current;
      if (!r) return;
      const existing = new Set(r.players.map((p) => p.id));
      const additions: Player[] = [];
      presentIds.forEach((id) => {
        if (!existing.has(id) && r.players.length + additions.length < 4) {
          const meta: any = (state[id] as any[])[0];
          additions.push({ id, name: meta?.name || "Player" });
        }
      });
      const stillHere = r.players.filter((p) => p.id === r.hostId || presentIds.includes(p.id));
      const players = r.started ? r.players : [...stillHere, ...additions];
      if (additions.length === 0 && players.length === r.players.length) return;
      broadcastState({ ...r, players });
    });

    ch.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await ch.track({ name: myName });
      if (asHost && initial) {
        roomRef.current = initial;
        ch.send({ type: "broadcast", event: "state", payload: initial });
      } else {
        ch.send({ type: "broadcast", event: "request_state", payload: { id: myId } });
      }
    });
  };

  const host = () => {
    const c = genCode();
    const idx = Array.from({ length: 5 }, () => Math.floor(Math.random() * SCENARIOS.length));
    const initial: RoomState = {
      code: c, hostId: myId, started: false, round: 0, scenarioIdx: idx,
      players: [{ id: myId, name: myName }],
      scores: { [myId]: 0 }, reveal: false,
    };
    setRoom(initial); setCode(c); setMode("lobby");
    subscribe(c, true, initial);
    sfx.levelUp();
  };

  const join = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return toast.error("Enter a 4-character code");
    setMode("lobby");
    subscribe(c, false);
  };

  const startGame = () => {
    if (!room) return;
    if (room.players.length < 2) return toast.error("Need at least 2 players");
    const next: RoomState = { ...room, started: true, round: 0, reveal: false, players: room.players.map((p) => ({ ...p, vote: undefined })) };
    broadcastState(next);
    sfx.levelUp();
  };

  const vote = (i: number) => {
    if (!room || room.reveal || !room.started) return;
    const me = room.players.find((p) => p.id === myId);
    if (me?.vote !== undefined) return;
    sfx.tap();
    if (isHostRef.current) {
      const players = room.players.map((p) => p.id === myId ? { ...p, vote: i } : p);
      const allVoted = players.length > 0 && players.every((p) => p.vote !== undefined);
      let next: RoomState = { ...room, players };
      if (allVoted) {
        const sc = SCENARIOS[room.scenarioIdx[room.round]];
        const counts: Record<number, number> = {};
        players.forEach((p) => { counts[p.vote!] = (counts[p.vote!] || 0) + 1; });
        const winnerIdx = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
        const choice = sc.choices[winnerIdx];
        const scores = { ...room.scores };
        players.forEach((p) => {
          if (p.vote === winnerIdx) scores[p.id] = (scores[p.id] || 0) + (choice.good ? 100 : 25);
        });
        next = { ...next, reveal: true, scores };
      }
      broadcastState(next);
    } else {
      channelRef.current?.send({ type: "broadcast", event: "vote", payload: { id: myId, vote: i } });
    }
  };

  const nextRound = () => {
    if (!room) return;
    if (room.round + 1 >= room.scenarioIdx.length) {
      toast.success("Game over!");
      const final: RoomState = { ...room, reveal: true };
      broadcastState(final);
      return;
    }
    const next: RoomState = { ...room, round: room.round + 1, reveal: false, players: room.players.map((p) => ({ ...p, vote: undefined })) };
    broadcastState(next);
  };

  const sc = useMemo(() => room ? SCENARIOS[room.scenarioIdx[room.round]] : null, [room]);

  if (mode === "menu") {
    return (
      <PageShell>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-2xl gradient-grape text-white flex items-center justify-center"><Users className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">Multiplayer</h1><p className="text-xs text-muted-foreground">2–4 friends, vote on the same scenario</p></div>
        </div>
        <Card className="p-5 border-0 shadow-pop">
          <h3 className="font-bold mb-1">Host a room</h3>
          <p className="text-xs text-muted-foreground mb-3">Generate a 4-letter code and share with friends.</p>
          <Button onClick={host} className="w-full h-12 gradient-coral text-white border-0">Create room</Button>
        </Card>
        <Card className="p-5 border-0 shadow-soft mt-3">
          <h3 className="font-bold mb-1">Join a room</h3>
          <div className="flex gap-2 mt-2">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={4} placeholder="ABCD" className="h-12 uppercase font-bold tracking-widest text-center" />
            <Button onClick={join} className="h-12 gradient-mint text-white border-0">Join</Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (!room) return <PageShell><div className="flex items-center justify-center min-h-60 gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin size-5" /> Connecting…</div></PageShell>;

  const isHost = room.hostId === myId;
  const me = room.players.find((p) => p.id === myId);
  const allVoted = room.players.length > 0 && room.players.every((p) => p.vote !== undefined);
  const myVote = me?.vote;
  const hasVoted = myVote !== undefined;

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Room</p>
          <p className="font-bold text-2xl tracking-widest">{room.code}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(room.code); toast.success("Code copied!"); }}><Copy className="size-3.5" /> Copy</Button>
      </div>
      <Card className="p-3 border-0 shadow-soft mb-3">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Players ({room.players.length}/4)</p>
        <div className="flex gap-2 flex-wrap">
          {room.players.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1">
              {p.id === room.hostId && <Crown className="size-3" />}{p.name}
              {p.id === myId && <span className="opacity-70">(you)</span>}
              {room.scores[p.id] !== undefined && <span className="opacity-70">· {room.scores[p.id]}</span>}
            </Badge>
          ))}
        </div>
      </Card>

      {!room.started && (
        <Card className="p-5 border-0 shadow-pop text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {isHost ? "Share the code with friends, then start when ready." : "Waiting for host to start…"}
          </p>
          {isHost && (
            <Button onClick={startGame} disabled={room.players.length < 2} className="w-full h-12 gradient-coral text-white border-0">
              <Play className="size-4" /> Start game ({room.players.length}/4)
            </Button>
          )}
          {isHost && room.players.length < 2 && <p className="text-[11px] text-muted-foreground mt-2">Need at least 2 players</p>}
        </Card>
      )}

      {room.started && sc && (
        <Card className="p-5 border-0 shadow-pop pop-in">
          <Badge variant="outline" className="mb-3">Round {room.round + 1} / {room.scenarioIdx.length}</Badge>
          <div className="flex gap-3 items-start mb-4">
            <div className="text-4xl">{sc.emoji}</div>
            <h2 className="text-lg font-bold flex-1">{sc.prompt}</h2>
          </div>
          <div className="space-y-2.5">
            {sc.choices.map((c, i) => {
              const voters = room.players.filter((p) => p.vote === i);
              const mineThis = myVote === i;
              return (
                <button key={i} disabled={room.reveal || hasVoted} onClick={() => vote(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${mineThis ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary"} ${room.reveal && c.good ? "ring-2 ring-success" : ""} disabled:cursor-not-allowed`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{c.label}</p>
                    {room.reveal && voters.length > 0 && <Badge variant="outline" className="text-[10px]">{voters.length} vote{voters.length > 1 ? "s" : ""}</Badge>}
                  </div>
                  {room.reveal && <p className="text-xs mt-1 text-muted-foreground">{c.feedback}</p>}
                </button>
              );
            })}
          </div>
          {room.reveal && isHost && (
            <Button onClick={nextRound} className="w-full mt-4 h-12 gradient-coral text-white border-0">
              <Check className="size-4" /> {room.round + 1 >= room.scenarioIdx.length ? "Finish" : "Next round"}
            </Button>
          )}
          {room.reveal && !isHost && <p className="text-center text-sm text-muted-foreground mt-3">Waiting for host…</p>}
          {!room.reveal && hasVoted && !allVoted && <p className="text-center text-sm text-muted-foreground mt-3">Voted! Waiting for others… ({room.players.filter((p) => p.vote !== undefined).length}/{room.players.length})</p>}
          {!room.reveal && !hasVoted && <p className="text-center text-xs text-muted-foreground mt-3">Pick your move</p>}
        </Card>
      )}
    </PageShell>
  );
}
