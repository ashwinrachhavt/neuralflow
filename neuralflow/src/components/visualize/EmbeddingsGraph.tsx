"use client";

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';

// dynamic import for 3d-force-graph (browser-only)
const ForceGraph3D = dynamic(() => import('3d-force-graph'), { ssr: false, loading: () => <div className="p-6 text-sm text-muted-foreground">Loading 3D graph…</div> });

type Node = { id: string; title: string; type: 'task'|'note'; vector: number[] };

export default function EmbeddingsGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/embeddings');
      const data = await res.json();
      setNodes((data?.nodes ?? []) as Node[]);
    })();
  }, []);

  // PCA (minimal impl) — fall back to first 3 dims if already small
  const points = useMemo(() => reduceTo3D(nodes.map(n => n.vector)), [nodes]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const graph: any = (ForceGraph3D as any)()(containerRef.current)
      .graphData({
        nodes: nodes.map((n, i) => ({ id: n.id, title: n.title, type: n.type, x: points[i]?.[0], y: points[i]?.[1], z: points[i]?.[2] })),
        links: [],
      })
      .nodeAutoColorBy('type')
      .nodeLabel('title')
      .nodeOpacity(0.9)
      .backgroundColor('#0b1021');

    return () => { try { graph?._destructor?.(); } catch { /* ignore */ } };
  }, [ready, nodes, points]);

  // Delay set ready until client mounted and dynamic import resolved
  useEffect(() => { setReady(true); }, []);

  return <div ref={containerRef} className="h-[70vh] w-full rounded-xl border border-border/60" />;
}

// naive PCA using covariance + eigen via power iteration for top 3 (fast for moderate dims)
function reduceTo3D(data: number[][]): number[][] {
  if (!data.length) return [];
  const d = data[0].length;
  if (d <= 3) return data.map(v => v.concat(Array(3 - v.length).fill(0)).slice(0,3));
  // center
  const mean = Array(d).fill(0);
  for (const v of data) for (let j=0;j<d;j++) mean[j]+=v[j];
  for (let j=0;j<d;j++) mean[j]/=data.length;
  const centered = data.map(v => v.map((x,j)=>x-mean[j]));
  // covariance approximation via Gram matrix (X^T X / n)
  const cov = Array(d).fill(0).map(()=>Array(d).fill(0));
  for (const v of centered) for (let i=0;i<d;i++) for (let j=i;j<d;j++){ cov[i][j]+=v[i]*v[j]; if(i!==j) cov[j][i]=cov[i][j]; }
  for (let i=0;i<d;i++) for (let j=0;j<d;j++) cov[i][j]/=centered.length;
  // power iteration to get top 3 eigenvectors
  const eigvecs: number[][] = [];
  for (let k=0;k<3;k++) {
    let v = Array(d).fill(0).map(()=>Math.random());
    v = normalize(v);
    for (let it=0; it<100; it++) {
      // deflation of previous components
      let Av = multiplyMatVec(cov, v);
      for (const u of eigvecs) {
        const proj = dot(Av, u);
        for (let i=0;i<d;i++) Av[i]-=proj*u[i];
      }
      v = normalize(Av);
    }
    eigvecs.push(v);
  }
  // project
  return centered.map(vec => eigvecs.map(u => dot(vec, u)));
}
function multiplyMatVec(A:number[][], v:number[]): number[]{ const n=A.length; const out=Array(n).fill(0); for(let i=0;i<n;i++){ let s=0; for(let j=0;j<n;j++) s+=A[i][j]*v[j]; out[i]=s;} return out; }
function dot(a:number[],b:number[]):number{ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
function normalize(v:number[]):number[]{ const n=Math.sqrt(dot(v,v))||1; return v.map(x=>x/n); }

