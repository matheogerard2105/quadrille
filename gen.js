/*GEN-START*/
// ---------- Seeded randomness: same seed = same puzzle on every device ----------
function hashStr(s){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (h1^h2)>>>0;}
function makeRng(seedStr){
  let a=hashStr(String(seedStr));
  const f=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  f.int=n=>Math.floor(f()*n);
  f.pick=arr=>arr[f.int(arr.length)];
  f.shuffle=arr=>{for(let i=arr.length-1;i>0;i--){const j=f.int(i+1);const t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;};
  return f;
}
function nb4(n,i){const r=(i/n)|0,c=i%n,o=[];if(r>0)o.push(i-n);if(c<n-1)o.push(i+1);if(r<n-1)o.push(i+n);if(c>0)o.push(i-1);return o;}
const ekey=(a,b)=>a<b?a+'-'+b:b+'-'+a;

// ---------- QUEENS ----------
function queensPlace(rng,n){
  const cols=new Array(n).fill(-1),used=new Array(n).fill(false);
  const rec=r=>{if(r===n)return true;
    for(const c of rng.shuffle([...Array(n).keys()])){
      if(used[c]||(r>0&&Math.abs(c-cols[r-1])<=1))continue;
      cols[r]=c;used[c]=true;if(rec(r+1))return true;used[c]=false;}
    return false;};
  rec(0);return cols;
}
function queensSolve(reg,n,limit){
  const sols=[],cols=new Array(n),uc=new Array(n).fill(false),ug=new Array(n).fill(false);
  const rec=r=>{if(r===n){sols.push(cols.slice());return;}
    for(let c=0;c<n;c++){const g=reg[r*n+c];
      if(uc[c]||ug[g]||(r>0&&Math.abs(c-cols[r-1])<=1))continue;
      cols[r]=c;uc[c]=ug[g]=true;rec(r+1);uc[c]=ug[g]=false;if(sols.length>=limit)return;}};
  rec(0);return sols;
}
function regionConnected(reg,n,g){
  let start=-1,count=0;for(let i=0;i<n*n;i++)if(reg[i]===g){count++;if(start<0)start=i;}
  if(!count)return false;const seen=new Uint8Array(n*n),st=[start];seen[start]=1;let got=0;
  while(st.length){const i=st.pop();got++;for(const j of nb4(n,i))if(!seen[j]&&reg[j]===g){seen[j]=1;st.push(j);}}
  return got===count;
}
function genQueens(rng,n){
  let last=null;
  for(let attempt=0;attempt<300;attempt++){
    const cols=queensPlace(rng,n),reg=new Array(n*n).fill(-1),isQ=new Set();
    for(let r=0;r<n;r++){reg[r*n+cols[r]]=r;isQ.add(r*n+cols[r]);}
    let left=n*n-n;
    while(left>0){
      const cand=[];
      for(let i=0;i<n*n;i++)if(reg[i]<0)for(const j of nb4(n,i))if(reg[j]>=0)cand.push(i,reg[j]);
      const k=rng.int(cand.length/2)*2;reg[cand[k]]=cand[k+1];left--;
    }
    last={n,regions:reg,solution:cols};
    for(let it=0;it<120;it++){
      const sols=queensSolve(reg,n,2);
      if(sols.length===1)return {n,regions:reg,solution:cols};
      const alt=sols.find(s=>s.some((c,r)=>c!==cols[r]));
      const rows=rng.shuffle(alt.map((c,r)=>r).filter(r=>alt[r]!==cols[r]));
      let changed=false;
      for(const r of rows){const i=r*n+alt[r];if(isQ.has(i))continue;const old=reg[i];
        const opts=rng.shuffle([...new Set(nb4(n,i).map(j=>reg[j]).filter(g=>g!==old))]);
        for(const g of opts){reg[i]=g;if(regionConnected(reg,n,old)){changed=true;break;}reg[i]=old;}
        if(changed)break;}
      if(!changed)break;
    }
  }
  return last;
}

// ---------- TANGO ----------
function tangoCellOk(g,n,i,v){
  const r=(i/n)|0,c=i%n;let rc=0,cc=0;
  for(let k=0;k<n;k++){if(g[r*n+k]===v)rc++;if(g[k*n+c]===v)cc++;}
  if(rc>n/2||cc>n/2)return false;
  for(let s=c-2;s<=c;s++){if(s<0||s+2>=n)continue;if(g[r*n+s]===v&&g[r*n+s+1]===v&&g[r*n+s+2]===v)return false;}
  for(let s=r-2;s<=r;s++){if(s<0||s+2>=n)continue;if(g[s*n+c]===v&&g[(s+1)*n+c]===v&&g[(s+2)*n+c]===v)return false;}
  return true;
}
function signsByCell(N,signs){const m=Array.from({length:N},()=>[]);for(const s of signs){m[s.a].push({o:s.b,eq:s.eq});m[s.b].push({o:s.a,eq:s.eq});}return m;}
function tangoFull(rng,n){
  const g=new Array(n*n).fill(0);
  const rec=i=>{if(i===n*n)return true;const vs=rng()<.5?[1,2]:[2,1];
    for(const v of vs){g[i]=v;if(tangoCellOk(g,n,i,v)&&rec(i+1))return true;}
    g[i]=0;return false;};
  rec(0);return g;
}
function tangoSolve(givens,n,signs,limit){
  const N=n*n,g=givens.slice(),sg=signsByCell(N,signs);let count=0;
  const rec=i=>{while(i<N&&givens[i])i++;
    if(i===N){count++;return;}
    for(const v of [1,2]){g[i]=v;
      let ok=tangoCellOk(g,n,i,v);
      if(ok)for(const s of sg[i]){const o=g[s.o];if(o&&((o===v)!==s.eq)){ok=false;break;}}
      if(ok)rec(i+1);
      if(count>=limit){g[i]=0;return;}}
    g[i]=0;};
  rec(0);return count;
}
function genTango(rng,diff){
  const n=6,N=36,sol=tangoFull(rng,n),edges=[];
  for(let i=0;i<N;i++){const r=(i/n)|0,c=i%n;if(c<n-1)edges.push([i,i+1]);if(r<n-1)edges.push([i,i+n]);}
  rng.shuffle(edges);
  const signs=edges.slice(0,[6,7,8][diff]).map(([a,b])=>({a,b,eq:sol[a]===sol[b]}));
  const giv=sol.slice(),removed=[];
  for(const i of rng.shuffle([...Array(N).keys()])){const v=giv[i];giv[i]=0;
    if(tangoSolve(giv,n,signs,2)!==1)giv[i]=v;else removed.push(i);}
  const back=[5,2,0][diff];for(let k=0;k<back&&k<removed.length;k++)giv[removed[k]]=sol[removed[k]];
  return {n,givens:giv,signs,solution:sol};
}

// ---------- ZIP ----------
function hamPath(rng,n){
  const N=n*n;let p=[];
  for(let r=0;r<n;r++)for(let k=0;k<n;k++)p.push(r*n+(r%2?n-1-k:k));
  const pos=new Int32Array(N);
  for(let t=0;t<N*30;t++){
    for(let k=0;k<N;k++)pos[p[k]]=k;
    const atStart=rng()<.5,end=atStart?p[0]:p[N-1],i=pos[rng.pick(nb4(n,end))];
    if(atStart){if(i===1)continue;p=p.slice(0,i).reverse().concat(p.slice(i));}
    else{if(i===N-2)continue;p=p.slice(0,i+1).concat(p.slice(i+1).reverse());}
  }
  if(rng()<.5)p.reverse();
  return p;
}
function zipSolve(n,cps,walls,limit,budget){
  const N=n*n,cpIdx=new Int16Array(N).fill(-1);cps.forEach((c,k)=>cpIdx[c]=k);
  const wall=new Set(walls),nbr=[];
  for(let i=0;i<N;i++)nbr.push(nb4(n,i).filter(j=>!wall.has(ekey(i,j))));
  const last=cps[cps.length-1],vis=new Uint8Array(N),path=[],sols=[];let nodes=0,aborted=false;
  const seen=new Uint8Array(N),stack=new Int32Array(N);
  const viable=(head,count)=>{
    for(let u=0;u<N;u++){if(vis[u])continue;let d=0;
      for(const v of nbr[u])if(!vis[v]||v===head)d++;
      if(d===0||(d===1&&u!==last))return false;}
    seen.fill(0);let sp=0,got=0;
    for(const v of nbr[head])if(!vis[v]&&!seen[v]){seen[v]=1;stack[sp++]=v;}
    while(sp){const u=stack[--sp];got++;for(const v of nbr[u])if(!vis[v]&&!seen[v]){seen[v]=1;stack[sp++]=v;}}
    return got===N-count;
  };
  const dfs=(cell,count,next)=>{
    if(aborted)return;if(++nodes>budget){aborted=true;return;}
    if(count===N){if(cell===last)sols.push(path.slice());return;}
    if(!viable(cell,count))return;
    for(const v of nbr[cell]){
      if(vis[v])continue;const k=cpIdx[v];
      if(k>=0&&k!==next)continue;if(v===last&&count+1!==N)continue;
      vis[v]=1;path.push(v);dfs(v,count+1,k>=0?next+1:next);vis[v]=0;path.pop();
      if(sols.length>=limit||aborted)return;}
  };
  vis[cps[0]]=1;path.push(cps[0]);dfs(cps[0],1,1);
  return {sols,aborted};
}
function genZip(rng,n,diff){
  const N=n*n;let fallback=null;
  for(let attempt=0;attempt<8;attempt++){
    const path=hamPath(rng,n),pe=new Set();
    for(let k=0;k<N-1;k++)pe.add(ekey(path[k],path[k+1]));
    const K=Math.max(4,Math.round(N/[5,6.5,8][diff])),idx=new Set([0,N-1]),step=(N-1)/(K-1);
    for(let j=1;j<K-1;j++){let k=Math.round(j*step+(rng()-.5)*step*.6);idx.add(Math.min(N-2,Math.max(1,k)));}
    const walls=new Set(),maxWalls=[4,7,12][diff];
    const cpsOf=ix=>[...ix].sort((a,b)=>a-b).map(k=>path[k]);
    let res=zipSolve(n,cpsOf(idx),[],2,30000);
    for(let it=0;it<40;it++){
      fallback={n,cps:cpsOf(idx),walls:[...walls],solution:path};
      if(!res.aborted&&res.sols.length===1)return fallback;
      // Greedy repair: try a few extra walls / numbers, keep the one leaving the fewest solutions.
      const cands=[];
      const alt=res.aborted?null:res.sols.find(p=>p.some((c,k)=>c!==path[k]));
      if(alt&&walls.size<maxWalls){const ws=[];for(let k=0;k<N-1;k++){const e=ekey(alt[k],alt[k+1]);if(!pe.has(e)&&!walls.has(e))ws.push(e);}
        for(const e of rng.shuffle(ws).slice(0,4))cands.push({w:e});}
      const s=[...idx].sort((a,b)=>a-b),gaps=[];
      for(let k=0;k<s.length-1;k++)for(let m=s[k]+2;m<s[k+1]-1;m++)gaps.push(m);
      for(const m of rng.shuffle(gaps).slice(0,4))cands.push({k:m});
      if(!cands.length)break;
      let best=null,bestScore=1e9,bestRes=null;
      for(const cd of cands){
        const w2=cd.w?[...walls,cd.w]:[...walls],i2=cd.k!=null?new Set([...idx,cd.k]):idx;
        const r=zipSolve(n,cpsOf(i2),w2,24,12000);
        const score=(r.aborted?30:r.sols.length)+(cd.k!=null?.5:0);
        if(score<bestScore){bestScore=score;best=cd;}
        if(!r.aborted&&r.sols.length===1)break;
      }
      if(best.w)walls.add(best.w);else idx.add(best.k);
      res=zipSolve(n,cpsOf(idx),[...walls],2,30000);
    }
  }
  return fallback;
}

// ---------- PATCHES ----------
function patchesSolve(n,clues,limit){
  const N=n*n,clueAt=new Int16Array(N).fill(-1);clues.forEach((c,i)=>clueAt[c.cell]=i);
  const byTL=Array.from({length:N},()=>[]);
  clues.forEach((cl,ci)=>{const cr=(cl.cell/n)|0,cc=cl.cell%n;
    for(let h=1;h<=n;h++)for(let w=1;w<=n;w++){
      if(cl.area&&h*w!==cl.area)continue;
      if(cl.shape==='sq'&&h!==w)continue;if(cl.shape==='wide'&&w<=h)continue;if(cl.shape==='tall'&&h<=w)continue;
      for(let r0=Math.max(0,cr-h+1);r0<=cr&&r0+h<=n;r0++)for(let c0=Math.max(0,cc-w+1);c0<=cc&&c0+w<=n;c0++){
        let ok=true;
        for(let r=r0;r<r0+h&&ok;r++)for(let c=c0;c<c0+w;c++){const k=clueAt[r*n+c];if(k>=0&&k!==ci){ok=false;break;}}
        if(ok)byTL[r0*n+c0].push([r0,c0,h,w]);}}});
  const cov=new Uint8Array(N);let count=0;
  const fill=(R,v)=>{for(let r=R[0];r<R[0]+R[2];r++)for(let c=R[1];c<R[1]+R[3];c++)cov[r*n+c]=v;};
  const rec=p=>{while(p<N&&cov[p])p++;if(p===N){count++;return;}
    for(const R of byTL[p]){let ok=true;
      for(let r=R[0];r<R[0]+R[2]&&ok;r++)for(let c=R[1];c<R[1]+R[3];c++)if(cov[r*n+c]){ok=false;break;}
      if(!ok)continue;fill(R,1);rec(p+1);fill(R,0);if(count>=limit)return;}};
  rec(0);return count;
}
function genPatches(rng,n,diff){
  const maxA=n<=5?6:n===6?8:9;let last=null;
  for(let attempt=0;attempt<200;attempt++){
    const q=[{r:0,c:0,h:n,w:n}],rects=[];
    while(q.length){const R=q.pop(),A=R.h*R.w;
      const stop=A<=maxA&&(A<=2||rng()<(A<=4?.7:A<=6?.45:.25));
      const cuts=[];
      if(!stop){for(let k=1;k<R.w;k++)if(k*R.h>=2&&(R.w-k)*R.h>=2)cuts.push(['v',k]);
        for(let k=1;k<R.h;k++)if(k*R.w>=2&&(R.h-k)*R.w>=2)cuts.push(['h',k]);}
      if(!cuts.length){rects.push(R);continue;}
      const [d,k]=rng.pick(cuts);
      if(d==='v')q.push({r:R.r,c:R.c,h:R.h,w:k},{r:R.r,c:R.c+k,h:R.h,w:R.w-k});
      else q.push({r:R.r,c:R.c,h:k,w:R.w},{r:R.r+k,c:R.c,h:R.h-k,w:R.w});}
    if(rects.some(R=>R.h*R.w>maxA))continue;
    const clues=rects.map(R=>({cell:(R.r+rng.int(R.h))*n+R.c+rng.int(R.w),shape:R.w===R.h?'sq':R.w>R.h?'wide':'tall',area:R.w*R.h}));
    last={n,clues:clues.map((c,i)=>({...c,color:i%10})),solution:rects};
    if(patchesSolve(n,clues,2)!==1)continue;
    const pN=[.2,.45,.65][diff],pS=[0,.15,.3][diff];
    for(const cl of rng.shuffle(clues.slice())){
      if(rng()<pN){const a=cl.area;cl.area=null;if(patchesSolve(n,clues,2)!==1)cl.area=a;}
      else if(rng()<pS){const s=cl.shape;cl.shape=null;if(patchesSolve(n,clues,2)!==1)cl.shape=s;}}
    const colors=rng.shuffle([...Array(10).keys()]);
    return {n,clues:clues.map((c,i)=>({...c,color:colors[i%10]})),solution:rects};
  }
  return last;
}

const SIZES={zip:[6,7,8],queens:[6,8,9],tango:[6,6,6],patches:[5,6,7]};
function genPuzzle(game,diff,seed){
  const rng=makeRng(game+'|'+diff+'|'+seed),n=SIZES[game][diff];
  if(game==='queens')return genQueens(rng,n);
  if(game==='tango')return genTango(rng,diff);
  if(game==='zip')return genZip(rng,n,diff);
  return genPatches(rng,n,diff);
}
/*GEN-END*/
if(typeof module!=='undefined')module.exports={genPuzzle,queensSolve,tangoSolve,zipSolve,patchesSolve};
