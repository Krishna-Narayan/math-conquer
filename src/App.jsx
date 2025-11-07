import React, { useMemo, useState } from "react";

// Mathematical Conquer — React implementation
// full playable version

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#7c3aed", "#059669"
];
const DICE_OPS = ["add", "sub", "div", "mul"];

const clamp1to100 = (n) => (n >= 1 && n <= 100 ? n : null);
const floorDiv = (a, b) => (b === 0 ? null : Math.floor(a / b));
const rollDie = () => Math.floor(Math.random() * 6) + 1;
const classNames = (...xs) => xs.filter(Boolean).join(" ");

function operandFromDice(d1, d2, op) {
  const hi = Math.max(d1, d2);
  const lo = Math.min(d1, d2);
  switch (op) {
    case "add": return d1 + d2;
    case "sub": return Math.abs(d1 - d2);
    case "div": return Math.floor(hi / lo);
    case "mul": return d1 * d2;
    default: return 0;
  }
}

function nextTargetsFromLast(last, v) {
  if (v <= 0) return [];
  const cand = [last + v, last - v, v !== 0 ? Math.floor(last / v) : null, last * v]
    .map((x) => (typeof x === "number" ? clamp1to100(x) : null));
  return [...new Set(cand.filter((n) => n !== null))];
}

function firstTurnTargets(d1, d2) {
  const hi = Math.max(d1, d2);
  const lo = Math.min(d1, d2);
  const cand = [d1 + d2, Math.abs(d1 - d2), Math.floor(hi / lo), d1 * d2]
    .map((x) => clamp1to100(x));
  return [...new Set(cand.filter((n) => n !== null))];
}

function formatOp(op) {
  switch (op) {
    case "add": return "+";
    case "sub": return "−";
    case "div": return "÷";
    case "mul": return "×";
    default: return "";
  }
}

export default function App() {
  const [playerCount, setPlayerCount] = useState(6);
  const [tiles, setTiles] = useState(Array.from({ length: 100 }, () => ({ owner: null })));
  const [players, setPlayers] = useState(Array.from({ length: 6 }, (_, i) => ({
    id: i, name: `Player ${i + 1}`, color: COLORS[i],
    score: 0, lastTile: 0, conquered: new Set()
  })));
  const [turnIdx, setTurnIdx] = useState(0);
  const [dice, setDice] = useState(null);
  const [chosenDiceOp, setChosenDiceOp] = useState(null);
  const [candidateTargets, setCandidateTargets] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [log, setLog] = useState([]);
  const [ended, setEnded] = useState(false);

  const activePlayers = useMemo(() => players.slice(0, playerCount), [players, playerCount]);
  const current = activePlayers[turnIdx];
  const totalConquered = tiles.filter((t) => t.owner !== null).length;

  function appendLog(s) {
    setLog((L) => [s, ...L].slice(0, 100));
  }

  function nextTurn(conquered) {
    const nextIdx = (turnIdx + 1) % activePlayers.length;
    setTurnIdx(nextIdx);
    setDice(null);
    setChosenDiceOp(null);
    setCandidateTargets([]);
    setPhase("idle");
    if (!ended && totalConquered >= 100) {
      setEnded(true);
      appendLog("Game ended: all tiles conquered.");
    }
  }

  function handleRoll() {
    if (ended) return;
    const d1 = rollDie(), d2 = rollDie();
    setDice([d1, d2]);
    if (current.lastTile === 0) {
      setCandidateTargets(firstTurnTargets(d1, d2));
      setPhase("choose-target");
      appendLog(`${current.name} rolled ${d1}, ${d2}`);
    } else {
      setPhase("choose-dice-op");
      appendLog(`${current.name} rolled ${d1}, ${d2} → choose op`);
    }
  }

  function chooseDiceOp(op) {
    const [d1, d2] = dice;
    const v = operandFromDice(d1, d2, op);
    const targets = nextTargetsFromLast(current.lastTile, v);
    setChosenDiceOp(op);
    setCandidateTargets(targets);
    setPhase("choose-target");
    appendLog(`${current.name} chose ${formatOp(op)} (${v})`);
  }

  function applyConquest(tileNum) {
    setTiles((prev) => {
      const next = [...prev];
      next[tileNum - 1] = { owner: current.id };
      return next;
    });
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === current.id
          ? { ...p, lastTile: tileNum, score: p.score + tileNum, conquered: new Set([...p.conquered, tileNum]) }
          : p
      )
    );
  }

  function chooseTarget(tileNum) {
    const owner = tiles[tileNum - 1].owner;
    if (owner === null) {
      applyConquest(tileNum);
      appendLog(`${current.name} conquered ${tileNum}`);
      nextTurn(true);
    } else {
      appendLog(`${current.name} landed on owned tile ${tileNum}`);
      nextTurn(false);
    }
  }

  const winners = useMemo(() => {
    if (!ended) return [];
    const max = Math.max(...activePlayers.map((p) => p.score));
    return activePlayers.filter((p) => p.score === max);
  }, [ended, activePlayers]);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 space-y-4">
          <h1 className="text-2xl font-bold">Mathematical Conquer</h1>
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span>Players:</span>
              <input type="range" min="2" max="6" value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))} />
              <span>{playerCount}</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: current.color }}></div>
              <div className="font-semibold">{current.name}'s Turn</div>
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={handleRoll} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">Roll</button>
              {phase === "choose-dice-op" && DICE_OPS.map((op) => (
                <button key={op} onClick={() => chooseDiceOp(op)}
                  className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">{formatOp(op)}</button>
              ))}
            </div>

            {dice && (
              <div className="mt-3 text-sm opacity-90">Dice: {dice[0]} and {dice[1]}</div>
            )}

            {phase === "choose-target" && (
              <div className="mt-3 text-sm opacity-90">
                <div>Targets:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {candidateTargets.map((t) => (
                    <button key={t} onClick={() => chooseTarget(t)}
                      className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-600">{t}</button>
                  ))}
                </div>
              </div>
            )}

            {ended && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-900/40 border border-indigo-500">
                {winners.length === 1
                  ? <>Winner: <b style={{ color: winners[0].color }}>{winners[0].name}</b></>
                  : <>Tie between: {winners.map((w) => w.name).join(", ")}</>}
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 max-h-[40vh] overflow-auto">
            <div className="font-semibold mb-2">Log</div>
            <ul className="space-y-1 text-sm">
              {log.map((L, i) => <li key={i}>• {L}</li>)}
            </ul>
          </div>
        </div>

        <div className="col-span-2 bg-slate-800 rounded-2xl p-4">
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
              const owner = tiles[n - 1].owner;
              const p = owner !== null ? activePlayers.find((x) => x.id === owner) : null;
              return (
                <div key={n}
                  className="relative aspect-square rounded-lg flex items-center justify-center text-sm font-semibold select-none border border-slate-700"
                  style={{ backgroundColor: owner !== null ? p.color + "33" : "#0f172a" }}>
                  <span>{n}</span>
                  {owner !== null && (
                    <span className="absolute right-1 top-1 text-[10px] px-1 rounded bg-slate-950/70">
                      {p.name.replace("Player ", "P")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
