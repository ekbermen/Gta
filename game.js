let RS=null,WIDN=null,PWID=null,PSEED=0,ONL=0,NOFF=0,NETHOST=true,FR=0;var NET={};
var PLAYS=[],RIV=[],TAXI=null,BIZ={},sgc={};
const XML=(()=>{try{const r=new XMLHttpRequest();r.open('GET','data/city.xml',false);r.send();if(r.responseText&&r.responseText.includes('<city'))return r.responseText}catch(e){}return window.CITY_XML})();
const T=THREE,$=id=>document.getElementById(id),R=()=>RS?RS():Math.random(),TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const S={snd:1,rain:1,day:1,gfx:1,auto:1,npc:45,car:34};try{const q=JSON.parse(localStorage.getItem('g67cfg')||'{}');if(q.npc>=0)S.npc=Math.min(250,q.npc|0);if(q.car>=0)S.car=Math.min(275,q.car|0);if(q.gfx>=0&&q.gfx<=4)S.gfx=q.gfx|0;if(q.snd===0||q.snd===1)S.snd=q.snd;if(q.auto===0||q.auto===1)S.auto=q.auto;if(q.rain>=0&&q.rain<=2)S.rain=q.rain|0;if(q.day>=0&&q.day<=2)S.day=q.day|0}catch(e){}
function saveCfg(){try{localStorage.setItem('g67cfg',JSON.stringify({npc:S.npc,car:S.car,gfx:S.gfx,auto:S.auto,snd:S.snd,rain:S.rain,day:S.day}))}catch(e){}}
const P={own:[1,0,0,0],arm:0,god:0,inf:0,lhp:100,x:-45,z:-45,a:0,hp:100,money:500,car:null,wep:0,ph:0,cd:0,heat:0};
const J={x:0,y:0},K={},B={run:0,fire:0},DR={steer:0,gas:0,brk:0};
let WS=0,MF=0,SLOW=0,TANK=0,GHOST=0,RAD=0,INT=null,drunk=0,HY=0,DISCO=0,lastD=0,comp=null,mode='menu',yaw=0,drag=0,stars=0,mi=0,kills=0,mTime=0,tt=0,hour=9,rainOn=0,rainI=0,rainT=60,shotT=-9,shotX=0,shotZ=0,copOff=0,hudT=0;

/* ---------- renderer ---------- */
const MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const ren=new T.WebGLRenderer({canvas:$('c'),antialias:!MOBILE,powerPreference:'high-performance'});ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.25;ren.shadowMap.type=T.PCFShadowMap;
const scene=new T.Scene(),cam=new T.PerspectiveCamera(65,1,.5,800);
scene.fog=new T.Fog(0x7fc4ee,80,380);
const hemi=new T.HemisphereLight(0xffffff,0x445566,.8),sun=new T.DirectionalLight(0xffffff,.8);scene.add(hemi,sun,sun.target);{const c=sun.shadow.camera;c.left=c.bottom=-90;c.right=c.top=90;c.near=10;c.far=500;sun.shadow.bias=-.0006}
/* ---- otomatik performans: FPS dusunce render cozunurlugunu/golgeyi/bloom'u kisar, duzelince geri acar (kayitli ayarlara dokunmaz) ---- */
const PF={q:1,sh:2,bloom:1,lvl:0,fps:60,n:0,acc:0,prev:0,start:0,okS:0,upWait:12,lastUp:0,lastChg:0,car:30,ped:100,shd:40,house:180,vis:260,maxL:8};
function perfApply(){const L=PF.lvl;PF.q=[1,1,.92,.82,.72,.64,.56,.5,.44][L];PF.sh=L>=5?6:L>=2?4:3;PF.bloom=L<3?1:0;PF.car=[30,30,30,28,26,24,22,20,18][L];PF.ped=[100,85,70,55,42,32,26,20,16][L];PF.shd=[40,32,24,0,0,0,0,0,0][L];PF.house=[180,150,120,100,85,70,60,50,45][L];PF.vis=[260,220,190,160,130,110,95,80,70][L];sun.castShadow=S.gfx>0&&L<3;resize()}
/* uzaktaki GLB arabayi (16-52 cizim) dusuk poligonlu kutu govdeyle degistir, golgeyi sadece yakindakilere ver */
function carLod(c,dd){if(c.drv||c.cop||!c.mroot||c.mroot.parent!==c.m)return;const far=c.lodF?dd>PF.car*.85:dd>PF.car;
 if(far!==!!c.lodF){c.lodF=far?1:0;c.mroot.visible=!far;if(far){if(!c.pg.parent)c.m.add(c.pg);c.pg.visible=true;c.pg.traverse(o=>{if(o.isMesh)o.castShadow=false})}else if(c.pg.parent)c.m.remove(c.pg)}
 if(!far){const s=dd<PF.shd?1:0;if(s!==c.shO){c.shO=s;c.mroot.traverse(o=>{if(o.isMesh)o.castShadow=!!s})}}}
function pedVis(p){const dd=Math.hypot(p.x-cam.position.x,p.z-cam.position.z),v=dd<PF.ped;p.m.visible=v;if(v){const s=dd<PF.shd?1:0;if(s!==p.shO||p.shM!==p.m){p.shO=s;p.shM=p.m;p.m.traverse(o=>{if(o.isMesh)o.castShadow=!!s})}}}
function perfTick(now){if(!PF.prev){PF.prev=PF.start=now;return}const d=now-PF.prev;PF.prev=now;if(d>400){PF.n=0;PF.acc=0;return}PF.n++;PF.acc+=d;
 if(PF.acc<700)return;PF.fps=Math.round(PF.n*1000/PF.acc);PF.n=0;PF.acc=0;if(!S.auto||now-PF.start<2500)return;
 if(PF.fps<34&&PF.lvl<PF.maxL&&now-PF.lastChg>(PF.fps<22?900:1600)){PF.lvl=Math.min(PF.maxL,PF.lvl+(PF.fps<22?2:1));PF.lastChg=now;PF.okS=0;if(now-PF.lastUp<25000)PF.upWait=Math.min(120,PF.upWait*2);perfApply()}
 else if(PF.fps>=58&&PF.lvl>0){if(++PF.okS>=PF.upWait*1.4&&now-PF.lastChg>3000){PF.lvl--;PF.lastChg=PF.lastUp=now;PF.okS=0;perfApply()}}else PF.okS=0}
function resize(){ren.setPixelRatio(Math.max(.34,Math.min(devicePixelRatio,[.55,.75,.95,1.15,1.6][S.gfx])*PF.q*(PF.dq||1)));ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();if(comp){comp.setPixelRatio(Math.min(devicePixelRatio,.8)*PF.q*(PF.dq||1));comp.setSize(innerWidth,innerHeight)}}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,300));resize();

/* ---------- procedural 3D asset textures ---------- */
function ct(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'));const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=MOBILE?1:4;return t}
const rep=(t,x,y)=>{const n=t.clone();n.needsUpdate=true;n.repeat.set(x,y);return n};
const asph=ct(128,128,g=>{g.fillStyle='#3a3d44';g.fillRect(0,0,128,128);for(let i=0;i<700;i++){g.fillStyle=R()<.5?'#32353b':'#474a52';g.fillRect(R()*128,R()*128,2,2)}});
const waterT=ct(128,128,g=>{g.fillStyle='#1d6aa5';g.fillRect(0,0,128,128);for(let i=0;i<60;i++){g.fillStyle=`rgba(255,255,255,${.04+R()*.08})`;g.fillRect(R()*128,R()*128,8+R()*14,2)}});waterT.repeat.set(160,160);
const wb={},wmc={},wms=[];
function wbase(col){if(wb[col])return wb[col];const pat=Array.from({length:64},R);
 const mk=lit=>ct(256,256,g=>{g.fillStyle=lit?'#000':col;g.fillRect(0,0,256,256);if(!lit){g.fillStyle='rgba(0,0,0,.2)';for(let y=0;y<256;y+=32)g.fillRect(0,y+27,256,5)}
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){const on=pat[i*8+j]<.42;g.fillStyle=lit?(on?'#ffcf70':'#000'):(on?'#f3e2a8':'#26384f');g.fillRect(i*32+6,j*32+7,20,19)}});
 return wb[col]={m:mk(0),e:mk(1)}}
function wmat(col,rx,ry){rx=Math.max(.5,Math.round(rx*2)/2);ry=Math.max(.5,Math.round(ry*2)/2);const k=col+rx+'_'+ry;if(wmc[k])return wmc[k];const b=wbase(col);
 const m=new T.MeshLambertMaterial({map:rep(b.m,rx,ry),emissiveMap:rep(b.e,rx,ry),emissive:0xffffff,emissiveIntensity:0});wms.push(m);return wmc[k]=m}
const M=c=>new T.MeshLambertMaterial({color:c}),roofM=M(0x565b62),slabM=M(0x8d8f96),grassM=M(0x4f8a45),trunkM=M(0x6b4a2b),leafM=M(0x2f7a3a),roofRed=M(0x9a4b3a);

let HS=null;const HX=[],HOUSES=[],mtM=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});
function mountain(cx,cz,rad,rg,hh,far){const h=hh||40+rg()*55;
 const mk=(rr,hg,ox,oz)=>{const g=new T.ConeGeometry(rr,hg,8,4),pa=g.attributes.position,col=[];
  for(let i=0;i<pa.count;i++){const y=pa.getY(i)/hg+.5,j=y>.02&&y<.98;pa.setXYZ(i,pa.getX(i)*(1+(rg()-.5)*.35),pa.getY(i)+(j?(rg()-.5)*hg*.12:0),pa.getZ(i)*(1+(rg()-.5)*.35));
   const c=y>.78?[.95,.95,.98]:y>.45?[.5,.5,.53]:[.27,.45,.25];col.push(...c)}
  g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();const m=new T.Mesh(g,mtM);m.position.set(cx+ox,hg/2+(far?-10:.4),cz+oz);scene.add(m)};
 mk(rad,h,0,0);mk(rad*.6,h*.62,rad*.45,rad*.2);
 if(!far){const q=rad*.55;blds.push({x1:cx-q,x2:cx+q,z1:cz-q,z2:cz+q})}}
/* ---------- world from XML ---------- */
const doc=new DOMParser().parseFromString(XML,'text/xml');
const lands=[],blds=[],roads=[],mm=[];
const land=(x,z,w,d,c)=>{lands.push({x1:x,z1:z,x2:x+w,z2:z+d});mm.push([x,z,w,d,c||'#3c4048'])};
const gBox=new T.BoxGeometry(1,1,1),gTrunk=new T.CylinderGeometry(.3,.4,2.4,6),gLeaf=new T.ConeGeometry(2,5.5,7);const TPOS=[],TOBJ=[];
const SOL=new Map();function addSol(x,z,r){const k=Math.floor(x/16)*4096+Math.floor(z/16);let a=SOL.get(k);if(!a)SOL.set(k,a=[]);a.push([x,z,r])}
function hitS(x,z,r){for(let i=Math.floor((x-r-1)/16);i<=Math.floor((x+r+1)/16);i++)for(let j=Math.floor((z-r-1)/16);j<=Math.floor((z+r+1)/16);j++){const a=SOL.get(i*4096+j);if(a)for(const s of a)if(Math.hypot(x-s[0],z-s[1])<r+s[2])return 1}return 0}
const dashM=M(0xe8d36a),m4=new T.Matrix4();
function bld(cx,cz,w,d,h,col,house){if(house)h=Math.max(h,10);
 const rx=(w+d)/40,ry=h/28,s=wmat(col,rx,ry);
 const m=new T.Mesh(gBox,[s,s,roofM,roofM,s,s]);m.scale.set(w,h,d);m.position.set(cx,.4+h/2,cz);scene.add(m);
 if(house){const fb=new T.Mesh(gBox,M(0x4a3f36));fb.scale.set(w+.6,.4,d+.6);fb.position.set(cx,.4+h*.5,cz);scene.add(fb);
  const dr=new T.Mesh(gBox,M(0x3b2a1e));dr.scale.set(1.8,3,.4);dr.position.set(cx,1.9,cz+d/2+.1);scene.add(dr);
  const bc=new T.Mesh(gBox,M(0x6b5a4a));bc.scale.set(w*.5,.3,1.6);bc.position.set(cx,.4+h*.5+.1,cz+d/2+.8);scene.add(bc);
  const r=new T.Mesh(new T.ConeGeometry(Math.max(w,d)*.74,4,4),roofRed);r.rotation.y=Math.PI/4;r.position.set(cx,.4+h+2,cz);scene.add(r)}
 else if(h>44){const a=new T.Mesh(new T.CylinderGeometry(.2,.3,12,5),roofM);a.position.set(cx,.4+h+6,cz);scene.add(a)}
 blds.push({x1:cx-w/2,x2:cx+w/2,z1:cz-d/2,z2:cz+d/2,h:h});mm.push([cx-w/2,cz-d/2,w,d,'#8a8f9c']);}
const RSVB={},RSVK={};for(const e of doc.querySelectorAll('place'))RSVK[e.getAttribute('isl')+':'+e.getAttribute('bi')+':'+e.getAttribute('bj')]=1;
for(const e of doc.querySelectorAll('island')){
 const A=n=>+e.getAttribute(n),x0=A('x'),z0=A('z'),cols=A('cols'),rows=A('rows'),bw=A('bw'),bh=A('bh'),rw=A('road'),minH=A('minH'),maxH=A('maxH'),pk=A('park'),rg=rnd(A('seed')),pal=e.getAttribute('pal').split(','),px=bw+rw,pz=bh+rw,W=cols*px+rw,H=rows*pz+rw,house=maxH<=14,mt=+e.getAttribute('mount')||0;
 land(x0,z0,W,H,'#3a3d44');
 const g=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshLambertMaterial({map:rep(asph,W/12,H/12)}));g.rotation.x=-Math.PI/2;g.position.set(x0+W/2,.02,z0+H/2);scene.add(g);
 const bs=new T.Mesh(gBox,M(0xcbb98a));bs.scale.set(W+10,6,H+10);bs.position.set(x0+W/2,-3.1,z0+H/2);scene.add(bs);
 const dz=[],dx=[];
 for(let k=0;k<=cols;k++){roads.push({ax:'z',c:x0+k*px+rw/2,a0:z0,a1:z0+H,w:rw});for(let s=z0+4;s<z0+H-2;s+=9){const q=(s-z0)%pz;if(q>rw+2&&q<pz-2)dz.push([x0+k*px+rw/2,s])}}
 for(let k=0;k<=rows;k++){roads.push({ax:'x',c:z0+k*pz+rw/2,a0:x0,a1:x0+W,w:rw});for(let s=x0+4;s<x0+W-2;s+=9){const q=(s-x0)%px;if(q>rw+2&&q<px-2)dx.push([s,z0+k*pz+rw/2])}}
 [[dz,.35,3.2],[dx,3.2,.35]].forEach(([a,w,d],i)=>{const im=new T.InstancedMesh(new T.BoxGeometry(w,.03,d),dashM,a.length||1);a.forEach((p,j)=>{m4.setPosition(p[0],.05,p[1]);im.setMatrixAt(j,m4)});scene.add(im)});
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const bx=x0+rw+i*px,bz=z0+rw+j*pz;
  const sl=new T.Mesh(gBox,slabM);sl.scale.set(bw,.4,bh);sl.position.set(bx+bw/2,.2,bz+bh/2);scene.add(sl);
  if(i===4&&e.getAttribute('name')==='Liman'){HS={x:bx+bw/2,z:bz+bh/2,own:0};continue}
  if((e.getAttribute('name')==='Banliyo'&&[[1,1],[3,1],[1,3],[3,3]].some(q=>q[0]===i&&q[1]===j))||(e.getAttribute('name')==='Vadi'&&(i+j)%3===0)){HX.push({x:bx+bw/2,z:bz+bh/2});continue}
  {const kk=e.getAttribute('name')+':'+i+':'+j;if(RSVK[kk]){RSVB[kk]={cx:bx+bw/2,cz:bz+bh/2,w:bw,d:bh};continue}}
  if(mt&&rg()<mt){mountain(bx+bw/2,bz+bh/2,bw*.55,rg);continue}
  if(rg()<pk){const pg=new T.Mesh(gBox,grassM);pg.scale.set(bw-2,.1,bh-2);pg.position.set(bx+bw/2,.43,bz+bh/2);scene.add(pg);mm.push([bx+1,bz+1,bw-2,bh-2,'#3f7a3a']);
   for(let t=0;t<6;t++){const tx=bx+6+rg()*(bw-12),tz=bz+6+rg()*(bh-12),tr=new T.Mesh(gTrunk,trunkM),lf=new T.Mesh(gLeaf,leafM);tr.position.set(tx,1.6,tz);lf.position.set(tx,5,tz);addSol(tx,tz,.7);TPOS.push([tx,tz]);TOBJ.push(tr,lf);scene.add(tr,lf)}}
  else{const sp=bw>=44&&rg()<.55,n=sp?2:1,lw=(bw-8-(n-1)*3)/n,ld=(bh-8-(n-1)*3)/n;
   for(let a=0;a<n;a++)for(let b=0;b<n;b++){let h=minH+Math.pow(rg(),1.5)*(maxH-minH);if(!sp&&!house)h*=1.25;bld(bx+4+lw/2+a*(lw+3),bz+4+ld/2+b*(ld+3),lw,ld,h,pal[rg()*pal.length|0],house)}}}
}
for(const e of doc.querySelectorAll('bridge')){const x=+e.getAttribute('x'),z=+e.getAttribute('z'),w=+e.getAttribute('w'),d=+e.getAttribute('d'),hz=w>d;
 land(x,z,w,d,'#3a3d44');const dk=new T.Mesh(gBox,new T.MeshLambertMaterial({map:rep(asph,w/12,d/12)}));dk.scale.set(w,.6,d);dk.position.set(x+w/2,-.28,z+d/2);scene.add(dk);
 
 roads.push(hz?{ax:'x',c:z+d/2,a0:x,a1:x+w,w:d}:{ax:'z',c:x+w/2,a0:z,a1:z+d,w:w});}
{const rg=rnd(77);for(let i=0;i<60;i++){const a=i/60*TAU+rg()*.1,rr=1450+rg()*260;mountain(330+Math.cos(a)*rr,55+Math.sin(a)*rr*.75,130+rg()*80,rg,180+rg()*140,1)}}
{const isl=lands.slice(),X0=Math.min(...isl.map(l=>l.x1))-260,X1=Math.max(...isl.map(l=>l.x2))+260,Z0=Math.min(...isl.map(l=>l.z1))-260,Z1=Math.max(...isl.map(l=>l.z2))+260;
 lands.unshift({x1:X0,z1:Z0,x2:X1,z2:Z1});mm.unshift([X0,Z0,X1-X0,Z1-Z0,'#14304d']);
 const gt=ct(64,64,g=>{g.fillStyle='#4f8a45';g.fillRect(0,0,64,64);for(let i=0;i<200;i++){g.fillStyle=R()<.5?'#487f3f':'#59964d';g.fillRect(R()*64,R()*64,2,2)}});
 const gm=new T.Mesh(new T.PlaneGeometry(X1-X0,Z1-Z0),new T.MeshLambertMaterial({map:rep(gt,(X1-X0)/10,(Z1-Z0)/10)}));gm.rotation.x=-Math.PI/2;gm.position.set((X0+X1)/2,-.02,(Z0+Z1)/2);scene.add(gm);
 const bs=new T.Mesh(gBox,M(0xcbb98a));bs.scale.set(X1-X0+14,6,Z1-Z0+14);bs.position.set((X0+X1)/2,-3.1,(Z0+Z1)/2);scene.add(bs);
 const KZ=(x,z,m)=>[[-440,-470,-196,-204],[-440,110,-198,300]].some(r=>x>r[0]-m&&x<r[2]+m&&z>r[1]-m&&z<r[3]+m);
 const tp=[];for(let k=0;k<9000&&tp.length<800;k++){const x=X0+R()*(X1-X0),z=Z0+R()*(Z1-Z0);if(!isl.some(l=>x>l.x1-18&&x<l.x2+18&&z>l.z1-18&&z<l.z2+18)&&!KZ(x,z,8))tp.push([x,z])}
 {const hr=rnd(9);let n=0;for(let k=0;k<4000&&n<0;k++){const x=X0+hr()*(X1-X0),z=Z0+hr()*(Z1-Z0);if(!isl.some(l=>x>l.x1-45&&x<l.x2+45&&z>l.z1-45&&z<l.z2+45)&&!KZ(x,z,75)){mountain(x,z,26+hr()*40,hr,18+hr()*60);n++}}}
  {const wm=new T.MeshLambertMaterial({map:waterT});for(const[cx,cz,rw_,rd_]of[[X0+95,(Z0+Z1)/2,34,Z1-Z0-190],[X1-95,(Z0+Z1)/2,34,Z1-Z0-190],[(X0+X1)/2,Z0+95,X1-X0-190,34],[(X0+X1)/2,Z1-95,X1-X0-190,34]]){const rv=new T.Mesh(new T.PlaneGeometry(rw_,rd_),wm);rv.rotation.x=-Math.PI/2;rv.position.set(cx,.08,cz);rv.userData.ns=1;scene.add(rv);RIV.push({x1:cx-rw_/2,x2:cx+rw_/2,z1:cz-rd_/2,z2:cz+rd_/2});mm.push([cx-rw_/2,cz-rd_/2,rw_,rd_,'#2a6fa5'])}}
const tr=new T.InstancedMesh(gTrunk,trunkM,tp.length),lf=new T.InstancedMesh(gLeaf,leafM,tp.length);tp.forEach((q,i)=>{addSol(q[0],q[1],.7);m4.setPosition(q[0],1.2,q[1]);tr.setMatrixAt(i,m4);m4.setPosition(q[0],4.6,q[1]);lf.setMatrixAt(i,m4)});tr.userData.ns=lf.userData.ns=1;tp.forEach(q=>TPOS.push([q[0],q[1]]));TOBJ.push(tr,lf);scene.add(tr,lf)}

function mergeStatic(){try{const src=gBox,pa=src.attributes.position.array,na=src.attributes.normal.array,ua=src.attributes.uv.array,ix=src.index.array,B=new Map();let nIn=0;
 const okm=m=>m&&m.isMeshLambertMaterial&&!m.transparent&&!m.isShaderMaterial,key=m=>m.map?m.uuid:'c'+m.color.getHex();
 const inv3t=e=>{const a=e[0],b=e[4],c=e[8],d=e[1],f=e[5],g=e[9],h=e[2],i=e[6],j=e[10],A=f*j-g*i,Bq=g*h-d*j,C=d*i-f*h,D=c*i-b*j,E=a*j-c*h,F=b*h-a*i,G=b*g-c*f,H=c*d-a*g,I=a*f-b*d,det=a*A+b*Bq+c*C||1;return[A/det,Bq/det,C/det,D/det,E/det,F/det,G/det,H/det,I/det]};
 for(const o of scene.children.slice()){if(!o.isMesh||o.geometry!==src||o.userData.keep)continue;const mats=Array.isArray(o.material)?o.material:[o.material];if(!mats.every(okm))continue;
  o.updateMatrix();const e=o.matrix.elements,nm=inv3t(e);
  for(let f=0;f<6;f++){const mt=Array.isArray(o.material)?o.material[f]:o.material,k=key(mt);const kk=k+'|'+Math.floor(o.position.x/360)+'|'+Math.floor(o.position.z/360);let b=B.get(kk);if(!b){b={mat:mt,ch:[]};B.set(kk,b)}
   let ch=b.ch[b.ch.length-1];if(!ch||ch.p.length/3+4>60000){ch={p:[],n:[],u:[],i:[]};b.ch.push(ch)}
   const base=ch.p.length/3;
   for(let q=0;q<4;q++){const v=f*4+q,x=pa[v*3],y=pa[v*3+1],z=pa[v*3+2];
    ch.p.push(e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);
    const nx=na[v*3],ny=na[v*3+1],nz=na[v*3+2];let X=nm[0]*nx+nm[3]*ny+nm[6]*nz,Y=nm[1]*nx+nm[4]*ny+nm[7]*nz,Z=nm[2]*nx+nm[5]*ny+nm[8]*nz;const l=Math.hypot(X,Y,Z)||1;ch.n.push(X/l,Y/l,Z/l);
    ch.u.push(ua[v*2],ua[v*2+1])}
   for(let t=0;t<6;t++)ch.i.push(ix[f*6+t]-f*4+base)}
  scene.remove(o);nIn++}
 for(const b of B.values())for(const ch of b.ch){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ch.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(ch.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(ch.u,2));g.setIndex(new T.Uint16BufferAttribute(ch.i,1));g.computeBoundingSphere();const m=new T.Mesh(g,b.mat);m.castShadow=m.receiveShadow=true;m.userData.merged=1;scene.add(m)}
 console.log('mergeStatic: '+nIn+' mesh -> '+[...B.values()].reduce((a,b)=>a+b.ch.length,0))}catch(e){console.warn('mergeStatic',e)}}
function mergeMisc(){try{const CELL=420,B=new Map();let nIn=0;
 for(const o of scene.children.slice()){if(!o.isMesh||o.isInstancedMesh||o.userData.keep||Array.isArray(o.material))continue;
  const gt=o.geometry&&o.geometry.type;if(gt!=='ConeGeometry'&&gt!=='CylinderGeometry')continue;
  const m=o.material;if(!m||m.transparent||m.isShaderMaterial||!m.isMeshLambertMaterial)continue;
  const g=o.geometry.clone();o.updateMatrix();g.applyMatrix4(o.matrix);const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ca=g.attributes.color,ix=g.index;
  if(!pa||!na){g.dispose();continue}
  const k=m.uuid+'|'+Math.floor(o.position.x/CELL)+'|'+Math.floor(o.position.z/CELL)+'|'+(ca?1:0)+(ua?1:0);let b=B.get(k);if(!b){b={mat:m,ch:[]};B.set(k,b)}
  let ch=b.ch[b.ch.length-1];if(!ch||ch.p.length/3+pa.count>60000){ch={p:[],n:[],u:[],c:[],i:[]};b.ch.push(ch)}
  const base=ch.p.length/3;for(let i=0;i<pa.count*3;i++){ch.p.push(pa.array[i]);ch.n.push(na.array[i])}
  if(ua)for(let i=0;i<pa.count*2;i++)ch.u.push(ua.array[i]);if(ca)for(let i=0;i<pa.count*3;i++)ch.c.push(ca.array[i]);
  if(ix)for(let i=0;i<ix.count;i++)ch.i.push(ix.array[i]+base);else for(let i=0;i<pa.count;i++)ch.i.push(base+i);
  scene.remove(o);g.dispose();nIn++}
 for(const b of B.values())for(const ch of b.ch){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ch.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(ch.n,3));if(ch.u.length)g.setAttribute('uv',new T.Float32BufferAttribute(ch.u,2));if(ch.c.length)g.setAttribute('color',new T.Float32BufferAttribute(ch.c,3));g.setIndex(new T.Uint16BufferAttribute(ch.i,1));g.computeBoundingSphere();
  const m=new T.Mesh(g,b.mat),mt=b.mat===mtM;m.castShadow=!mt;m.receiveShadow=!mt;m.userData.merged=1;scene.add(m)}
 console.log('mergeMisc: '+nIn+' mesh -> '+[...B.values()].reduce((a,b)=>a+b.ch.length,0))}catch(e){console.warn('mergeMisc',e)}}
mergeStatic();mergeMisc();
const lampM=new T.MeshBasicMaterial({color:0x555a60}),lampOn=new T.Color(0xfff0b0),lampOff=new T.Color(0x555a60);
{const pts=[],inR=q=>roads.some(r2=>{const u=r2.ax==='z'?q[0]:q[1],v=r2.ax==='z'?q[1]:q[0];return Math.abs(u-r2.c)<r2.w/2+.8&&v>r2.a0-1&&v<r2.a1+1});for(const r of roads){if(r.a1-r.a0<150)continue;for(let t=r.a0+12;t<r.a1-8;t+=36){const o=r.w/2+1.3,q=r.ax==='z'?[r.c+o,t]:[t,r.c+o];if(!inR(q))pts.push(q)}}
 const pole=new T.InstancedMesh(new T.BoxGeometry(.25,7,.25),slabM,pts.length),bulb=new T.InstancedMesh(new T.BoxGeometry(.9,.35,.9),lampM,pts.length);
 pts.forEach((q,i)=>{addSol(q[0],q[1],.35);m4.setPosition(q[0],3.5,q[1]);pole.setMatrixAt(i,m4);m4.setPosition(q[0],7.1,q[1]);bulb.setMatrixAt(i,m4)});pole.userData.ns=bulb.userData.ns=1;scene.add(pole,bulb)}
const water=new T.Mesh(new T.PlaneGeometry(3000,3000),new T.MeshLambertMaterial({map:waterT}));water.rotation.x=-Math.PI/2;water.position.set(255,-1.3,-60);scene.add(water);water.userData.ns=1;
const walk=(x,z)=>{for(const l of lands)if(x>l.x1&&x<l.x2&&z>l.z1&&z<l.z2)return 1;return 0};
const BGc=new Map();let BGn=-1;
const hitB=(x,z,r)=>{if(P.car&&P.car.air&&P.car.pg.position.y>8)return 0;if(BGn!==blds.length){BGc.clear();BGn=blds.length;for(const b of blds)for(let i=Math.floor((b.x1-8)/40);i<=Math.floor((b.x2+8)/40);i++)for(let j=Math.floor((b.z1-8)/40);j<=Math.floor((b.z2+8)/40);j++){const k=i*4096+j;let a=BGc.get(k);if(!a)BGc.set(k,a=[]);a.push(b)}}
 const a=BGc.get(Math.floor(x/40)*4096+Math.floor(z/40));if(a)for(const b of a)if(x>b.x1-r&&x<b.x2+r&&z>b.z1-r&&z<b.z2+r)return 1;return 0};
const blocked=(x,z,r)=>!walk(x,z)||hitB(x,z,r)||hitS(x,z,r)||RIV.some(q=>x>q.x1&&x<q.x2&&z>q.z1&&z<q.z2);
const mv=(o,dx,dz,r)=>{let m=0;if(!blocked(o.x+dx,o.z,r)){o.x+=dx;m=1}if(!blocked(o.x,o.z+dz,r)){o.z+=dz;m=1}return m};
/* minimap bitmap */
const MS=.8,mnx=Math.min(...lands.map(l=>l.x1))-20,mnz=Math.min(...lands.map(l=>l.z1))-20,mxx=Math.max(...lands.map(l=>l.x2))+20,mxz=Math.max(...lands.map(l=>l.z2))+20;
const MMc=document.createElement('canvas');MMc.width=(mxx-mnx)*MS;MMc.height=(mxz-mnz)*MS;{const g=MMc.getContext('2d');g.fillStyle='#0f3a5a';g.fillRect(0,0,MMc.width,MMc.height);for(const r of mm){g.fillStyle=r[4];g.fillRect((r[0]-mnx)*MS,(r[1]-mnz)*MS,r[2]*MS,r[3]*MS)}}
const mmx=$('mm').getContext('2d');

/* ---------- characters & vehicles ---------- */
const CY=(a,b,h)=>new T.CylinderGeometry(a,b,h,8).translate(0,-h/2,0);
const gTh=CY(.085,.065,.44),gSh=CY(.062,.045,.44),gShoe=new T.BoxGeometry(.1,.07,.26).translate(0,-.035,.05),gUa=CY(.05,.042,.29),gFa=CY(.042,.034,.27),gHand=new T.SphereGeometry(.045,6,5).translate(0,-.29,0),gSho=new T.SphereGeometry(.07,8,6),
 gTor=new T.CylinderGeometry(.21,.16,.58,10).scale(1,1,.62),gPel=new T.CylinderGeometry(.165,.16,.2,10).scale(1,1,.65),gNeck=new T.CylinderGeometry(.05,.055,.1,6),gHd=new T.SphereGeometry(.115,12,10).scale(.95,1.15,1.05),gHair=new T.SphereGeometry(.123,12,8,0,TAU,0,Math.PI*.55).scale(.95,1.15,1.05);
const gSole=new T.BoxGeometry(.105,.025,.27),soleM=new T.MeshLambertMaterial({color:0xeeeeee}),gCuff=CY(.047,.047,.035),gEye=new T.SphereGeometry(.014,6,5),gNose=new T.BoxGeometry(.022,.04,.03),gEar=new T.SphereGeometry(.026,6,5).scale(.5,1,.8),gBrow=new T.BoxGeometry(.04,.008,.01),gMouth=new T.BoxGeometry(.045,.008,.01),gBk=new T.SphereGeometry(.092,10,8),gFr=new T.BoxGeometry(.2,.045,.07),gCol=new T.BoxGeometry(.2,.05,.13),gBelt=new T.CylinderGeometry(.168,.168,.04,12).scale(1,1,.66),gBkl=new T.BoxGeometry(.05,.035,.012),gChain=new T.TorusGeometry(.07,.007,5,14),gWat=new T.BoxGeometry(.06,.025,.06);
function mkPed(top,leg,sk,hair,shoe,long,hi){const g=new T.Group(),L=c=>new T.MeshLambertMaterial({color:c}),tm=L(top),lm=L(leg),sm=L(sk),hm=L(hair||'#2a1c10'),shm=L(shoe||'#1a1a1f'),
 add=(geo,mat,par,x,y,z)=>{const q=new T.Mesh(geo,mat);q.position.set(x||0,y||0,z||0);par.add(q);return q};
 const mkLeg=x=>{const p=new T.Group();p.position.set(x,.92,0);add(gTh,lm,p);const k=new T.Group();k.position.y=-.44;p.add(k);add(gSh,lm,k);add(gShoe,shm,k,0,-.44,0);if(hi)add(gSole,soleM,k,0,-.5,.05);g.add(p);return[p,k]};
 const mkArm=x=>{const p=new T.Group();p.position.set(x,1.45,0);add(gSho,tm,p);add(gUa,tm,p);const e=new T.Group();e.position.y=-.29;p.add(e);add(gFa,long?tm:sm,e);add(gHand,sm,e);if(hi){add(gCuff,tm,e,0,-.22,0);if(x>0)add(gWat,new T.MeshLambertMaterial({color:0xd4af37}),e,0,-.2,0)}g.add(p);return[p,e]};
 const l1=mkLeg(-.1),l2=mkLeg(.1),a1=mkArm(-.27),a2=mkArm(.27);
 add(gTor,tm,g,0,1.2,0);add(gPel,lm,g,0,.95,0);add(gNeck,sm,g,0,1.56,0);add(gHd,sm,g,0,1.7,.01);add(gHair,hm,g,0,1.72,-.005);
 if(hi){const D=c=>new T.MeshLambertMaterial({color:c}),dk=D('#0d0d11'),gold=D('#d4af37');
  for(const sx of[-.042,.042]){add(gEye,dk,g,sx,1.72,.118);add(gBrow,hm,g,sx,1.752,.121);add(gEar,sm,g,sx*2.7,1.7,0)}
  add(gNose,sm,g,0,1.69,.128);add(gMouth,D('#8f3d3d'),g,0,1.643,.117);add(gBk,hm,g,0,1.69,-.045);
  const fr=add(gFr,hm,g,0,1.785,.082);fr.rotation.x=-.35;
  add(gCol,tm,g,0,1.5,0);add(gBelt,D('#14141a'),g,0,.99,0);add(gBkl,gold,g,0,.99,.112);
  const ch=add(gChain,gold,g,0,1.505,.03);ch.rotation.x=Math.PI/2.4}
 g.mats=[tm,lm];g.parts=[l1[0],l2[0],a1[0],a2[0]];g.knees=[l1[1],l2[1]];g.elb=[a1[1],a2[1]];g.traverse(o=>{if(o.isMesh)o.userData.ns=1});scene.add(g);return g}
function swingPed(m,sw){const q=m.parts,k=m.knees,e=m.elb;if(m.glb){q[0].rotation.x=sw;q[1].rotation.x=-sw;q[2].rotation.x=-sw*.55;q[3].rotation.x=sw*.55;return}q[0].rotation.x=sw;q[1].rotation.x=-sw;q[2].rotation.x=-sw;q[3].rotation.x=sw;k[0].rotation.x=Math.max(0,-sw)*1.2;k[1].rotation.x=Math.max(0,sw)*1.2;e[0].rotation.x=-.3-Math.abs(sw)*.5;e[1].rotation.x=-.3-Math.abs(sw)*.5}
const gWh=new T.CylinderGeometry(.38,.38,.3,10).rotateZ(Math.PI/2),wheelM=M(0x111111),glassM=M(0x7fb4dc),hlM=new T.MeshBasicMaterial({color:0xfff2b0}),tlM=new T.MeshBasicMaterial({color:0xff2222});
const MD={},darkM=M(0x222222),cars=[];
const VM={0:['fast','clio','alfa','volvo','clio','alfa','mito','moskvich','mito'],1:['fast','alfa','clio','volvo','fast','sport','sport','mito'],3:['clio']},ALFC=['#8b0000','#1f3a8a','#e8e8e8','#151515','#d4a017','#0b6b3a','#b8bcc4','#e0702a'];
function pickM(c){if(c.cop)return'police';if(c.mdl)return c.mdl;const a=VM[c.kind];if(!a||!MD.fast)return null;const rr=c.sd!=null?rnd(c.sd):R;let k=a[(rr()*a.length)|0];if(k==='volvo'&&(c.sd!=null?(c.sd&3)!==0:cars.filter(q=>q.mdl==='volvo').length>=3))k='fast';if(!MD[k]){if(tt>(c.sd!=null?40:12))k='fast';else return null}return c.mdl=k}
function skin(c){const k=pickM(c);if(!k||!MD[k]||c.glb)return;const m=MD[k].clone();
 m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=o.receiveShadow=true;if(k==='alfa'&&o.material.name==='body')o.material.color.set(ALFC[c.alc!=null?c.alc:(c.alc=((c.sd!=null?rnd(c.sd+1)():R())*ALFC.length)|0)]);o.material.metalness=0;o.material.roughness=.7;if(c.kind===3&&k!=='fast'&&!o.material.transparent)o.material.color.set(0xffd84a)}});
 c.m.remove(c.pg);c.m.add(m);c.mroot=m;c.glb=1;(c.m.userData.lights||[]).forEach(l=>l.position.y=MD[k].userData.h+.15);if(k==='fast')paint(c,c.ci)}
const dk=c=>{if(c.glb)c.m.traverse(o=>{if(o.isMesh)o.material=darkM});else c.bm.color.set(0x222222)};
const CARC=[['kirmizi',0,1,1],['mavi',215,1,1],['sari',48,1,1.1],['yesil',130,1,1],['turuncu',25,1,1.05],['mor',275,1,1],['pembe',325,1,1.15],['turkuaz',182,1,1],['beyaz',0,0,1.9],['siyah',0,0,.35],['gri',0,0,1],['lacivert',230,1,.55],['bordo',350,1,.6],['altin',42,.9,1.2],['acik-mavi',200,.7,1.3],['limon',75,1,1.1],['kahve',22,.7,.55],['mint',150,.6,1.3],['lila',255,.7,1.2],['fusya',300,1.1,1]],COLN=CARC.map(c=>c[0]),RCT={};
function recolor(i){if(i===0)return MD.fastMap||null;if(RCT[i])return RCT[i];const src=MD.fastImg;if(!src)return null;const N=512,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.drawImage(src,0,0,N,N);const d=g.getImageData(0,0,N,N),a=d.data,h=CARC[i][1],sm=CARC[i][2],lm=CARC[i][3];
 for(let p=0;p<a.length;p+=4){const r=a[p]/255,gg=a[p+1]/255,b=a[p+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),l=(mx+mn)/2,dl=mx-mn;if(dl<.12||mx<.2)continue;let hh;if(mx===r)hh=((gg-b)/dl+6)%6;else if(mx===gg)hh=(b-r)/dl+2;else hh=(r-gg)/dl+4;hh*=60;if(hh>25&&hh<335)continue;
  const sat=dl/(1-Math.abs(2*l-1)+1e-5),H=h/60,S=Math.min(1,sat*sm),Lq=Math.min(.95,l*lm),Cq=(1-Math.abs(2*Lq-1))*S,X=Cq*(1-Math.abs(H%2-1)),m=Lq-Cq/2,v=[[Cq,X,0],[X,Cq,0],[0,Cq,X],[0,X,Cq],[X,0,Cq],[Cq,0,X]][Math.floor(H)%6];a[p]=(v[0]+m)*255;a[p+1]=(v[1]+m)*255;a[p+2]=(v[2]+m)*255}
 g.putImageData(d,0,0);const t=new T.CanvasTexture(c);t.flipY=false;t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=MD.fastEnc;t.anisotropy=4;return RCT[i]=t}
function paint(c,i){if(!c.glb||c.cop||c.mdl!=='fast')return;c.ci=i;const t=recolor(i);if(!t)return;c.m.traverse(o=>{if(o.isMesh&&o.material.map){o.material.map=t;o.material.needsUpdate=true}})}
function nextW(){let n=4;while(n--){P.wep=(P.wep+1)%4;if(P.own[P.wep])break}}
const RBX=(w,h,d,c)=>{const o=new T.Mesh(gBox,M(c));o.scale.set(w,h,d);return o};
function vbody(k,t){if(k.mroot){k.m.remove(k.mroot);k.mroot=null}k.glb=1;k.mdl='x';const pg=k.pg;while(pg.children.length)pg.remove(pg.children[0]);
 const B=(w,h,d,c,px,py,pz,m)=>{const o=new T.Mesh(gBox,m||M(c));o.scale.set(w,h,d);o.position.set(px,py,pz);o.castShadow=true;pg.add(o);return o},W=(px,py,pz,s)=>{const o=new T.Mesh(gWh,wheelM);o.scale.set(s||1,s||1,s||1);o.position.set(px,py,pz);pg.add(o)},GL=glassM,LH=(y,z,w)=>{B(.4,.16,.1,0,-w,y,z,hlM);B(.4,.16,.1,0,w,y,z,hlM)};
 const V={
 ber:()=>{B(2,.4,4.4,'#d40000',0,.55,0);B(1.5,.4,1.6,0,0,.95,-.2,GL);B(1.9,.22,1.3,'#d40000',0,.48,1.8);B(2.1,.08,.6,'#111',0,1.25,-2.1);B(.1,.5,.1,'#111',-.8,.95,-2.1);B(.1,.5,.1,'#111',.8,.95,-2.1);B(.3,.02,4.4,'#ffd23c',0,.76,0);LH(.6,2.2,.7);for(const s of[-1,1])for(const z of[-1.4,1.4])W(s,.38,z,1.05);k.seats=2},
 cmw:()=>{B(1.95,.55,4.5,'#1d4ed8',0,.62,0);B(1.65,.5,2.3,0,0,1.12,-.25,GL);B(1.7,.08,2.3,'#e8eef5',0,1.4,-.25);B(.35,.28,.1,'#111',-.25,.7,2.27);B(.35,.28,.1,'#111',.25,.7,2.27);B(.2,.02,4.5,'#9fd0ff',-.5,.9,0);LH(.78,2.27,.75);for(const s of[-1,1])for(const z of[-1.4,1.4])W(s,.38,z);k.seats=4},
 ker:()=>{B(2,.7,4.9,'#c9ced6',0,.7,0);B(1.75,.6,2.7,0,0,1.3,-.3,GL);B(1.8,.07,2.7,'#c9ced6',0,1.62,-.3);B(.9,.35,.1,'#eee',0,.75,2.47);B(.25,.25,.05,'#bbb',0,1.15,2.48);LH(.85,2.46,.8);for(const s of[-1,1])for(const z of[-1.5,1.5])W(s,.38,z);k.seats=4},
 saz:()=>{W(0,.38,1,1.1);W(0,.38,-1,1.1);B(.3,.35,1.6,'#222',0,.7,0);B(.4,.35,.8,'#1565c0',0,1,.3);B(.35,.12,.8,'#111',0,.95,-.5);B(1,.08,.1,'#444',0,1.28,1);B(.1,.8,.1,'#444',0,.8,1);k.seats=2},
 f1:()=>{B(.7,.35,3.6,'#e10600',0,.45,0);B(.4,.25,1.4,'#e10600',0,.4,2.2);B(2,.06,.5,'#111',0,.22,2.9);B(1.5,.55,.1,'#111',0,1,-1.9);B(1.6,.06,.4,'#111',0,1.3,-1.9);B(.35,.35,.35,'#ffd23c',0,.85,-.2);B(.5,.5,.8,'#e10600',0,.8,-.9);for(const s of[-1,1]){W(s*.95,.5,1.7,1.3);W(s*.95,.5,-1.4,1.3)}k.seats=1},
 heli:()=>{B(1.8,1.4,3.2,'#2c3e50',0,1.2,0);B(1.5,1,1,0,0,1.1,1.8,GL);B(.3,.3,2.6,'#2c3e50',0,1.5,-2.8);B(.1,.8,.5,'#c0392b',0,1.9,-4);for(const s of[-1,1]){B(.1,.1,3,'#222',s*.8,.35,0);B(.1,.8,.1,'#222',s*.8,.7,.8);B(.1,.8,.1,'#222',s*.8,.7,-.8)}const r=new T.Group();r.add(RBX(8,.06,.3,0x111111),RBX(.3,.06,8,0x111111));r.position.y=2.1;pg.add(r);k.rotor=r;k.air=1;k.seats=4},
 plane:()=>{B(1,1,5,'#eeeeee',0,1,0);B(.8,.8,.6,'#c0392b',0,1,2.9);B(7,.12,1.2,'#d33',0,1.1,.3);B(2.5,.1,.7,'#d33',0,1.2,-2.3);B(.1,1,.8,'#d33',0,1.6,-2.3);B(.8,.5,1,0,0,1.6,.6,GL);const r=new T.Group();r.add(RBX(.1,1.8,.1,0x222222));r.position.set(0,1,3.25);pg.add(r);k.rotor=r;W(-.6,.3,.8,.8);W(.6,.3,.8,.8);W(0,.3,-2,.6);k.air=1;k.seats=2},
 bus:()=>{B(2.6,2.4,10,'#2e86de',0,1.6,0);B(2.62,.75,9,0,0,2.2,0,GL);B(2.62,.3,10,'#ffffff',0,1.1,0);B(2.4,1,.1,0,0,2.1,5.02,GL);B(2.4,.3,.1,'#ffd23c',0,2.9,5.03);LH(.9,5.02,.9);for(const s of[-1,1])for(const z of[-3.5,3.5])W(s*1.3,.5,z,1.4);k.seats=20},
 truck:()=>{B(2.2,.4,8,'#222',0,.6,0);B(2.4,2.2,2,'#e67e22',0,1.7,2.8);B(2.2,.9,.1,0,0,2.2,3.85,GL);B(2.7,2.6,5.5,'#ecf0f1',0,2.1,-1.2);B(2.72,.3,5.5,'#e67e22',0,1,-1.2);LH(1.0,3.82,.8);for(const s of[-1,1])for(const z of[2.8,-1.5,-3])W(s*1.2,.5,z,1.3);k.seats=3}};
 (V[t]||V.cmw)();k.vt=t;if(t==='bus'&&MD.maz)swapVis(k,'maz');if(t==='saz'&&MD.bajaj)swapVis(k,'bajaj')}
const VT={berrari:'ber',cmw:'cmw',kercedes:'ker',sazuki:'saz',bajaj:'saz',motor:'saz',f1:'f1',heli:'heli',plane:'plane'};
function mkVeh(t,x,z,a){const k=mkCar(1,'#fff',x,z,a);vbody(k,t);k.ai=0;return k}
function gcar(t,st,n){const k=mkVeh(t,INT.rx+8,INT.rz+8,0);if(st){P.heat=Math.max(P.heat,st*30-5);toast(n+' çalındı! '+st+' yıldız arama • '+k.seats+' koltuk')}else toast(n+' senin! '+k.seats+' koltuk')}
function mkCar(kind,col,x,z,a){const g=new T.Group(),pg=new T.Group(),bm=M(col),sp=kind===1,van=kind===2,po=kind===4;
 const body=new T.Mesh(gBox,bm);body.scale.set(2,sp?.55:.75,4.3);body.position.y=sp?.55:.7;
 const cab=new T.Mesh(gBox,po?bm:glassM);cab.scale.set(1.75,sp?.5:van?1.1:.65,van?3.2:2.1);cab.position.set(0,sp?1.05:van?1.4:1.3,van?-.4:-.25);
 pg.add(body,cab);g.add(pg);
 for(const sx of[-1,1])for(const sz of[-1.4,1.4]){const w=new T.Mesh(gWh,wheelM);w.position.set(sx*1,.38,sz);pg.add(w)}
 for(const sx of[-.7,.7]){const h=new T.Mesh(gBox,hlM);h.scale.set(.4,.2,.1);h.position.set(sx,.75,2.16);const t=new T.Mesh(gBox,tlM);t.scale.set(.4,.2,.1);t.position.set(sx,.75,-2.16);pg.add(h,t)}
 let lr,lb;if(po){lr=new T.MeshBasicMaterial({color:0xff1111});lb=new T.MeshBasicMaterial({color:0x2255ff});const a1=new T.Mesh(gBox,lr),a2=new T.Mesh(gBox,lb);a1.scale.set(.5,.18,.3);a2.scale.set(.5,.18,.3);a1.position.set(-.4,1.7,-.25);a2.position.set(.4,1.7,-.25);
  const st=new T.Mesh(gBox,M(0x15151a));st.scale.set(2.02,.25,4.32);st.position.y=.55;g.add(a1,a2);pg.add(st);g.userData.lights=[a1,a2]}
 if(kind===3){const s=new T.Mesh(gBox,hlM);s.scale.set(.6,.2,.3);s.position.set(0,1.7,-.25);pg.add(s)}
 g.rotation.order='YXZ';g.position.set(x,0,z);g.rotation.y=a;scene.add(g);
 const c={m:g,pg,col,glb:0,ci:kind===3?2:R()*20|0,roll:0,pit:0,bm,x,z,a,v:0,hp:100,kind,cop:po,lr,lb,drv:0,ai:0,dead:0,stuck:0,cd:0,stop:0,sp:9+R()*5,id:cars.length,wid:WIDN!=null?WIDN:undefined,sd:WIDN!=null?(((PSEED|0)*1009+WIDN*7919+13)|0):null};cars.push(c);if(kind>=5){c.mx=kind===6?24:28;vbody(c,kind===6?'bus':'truck')}g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});skin(c);return c}
const cc=['#c0392b','#2e86de','#27ae60','#8e44ad','#d35400','#bdc3c7','#16a085','#ecf0f1','#e84393','#2c3e50'];
function trafficCar(){const rd=roads[R()*roads.length|0],dir=R()<.5?1:-1,t=rd.a0+12+R()*(rd.a1-rd.a0-24),z=rd.ax==='z',k=R()<.05?6:R()<.07?5:R()<.12?3:[0,0,1,1][R()*4|0],
 c=mkCar(k,k===3?'#f2c40f':k===6?'#2e86de':k===5?'#e67e22':cc[R()*cc.length|0],z?rd.c-3*dir:t,z?t:rd.c+3*dir,z?(dir>0?0:Math.PI):(dir>0?Math.PI/2:-Math.PI/2));c.rd=rd;c.dir=dir;c.ai=1;c.v=c.sp;return c}
for(let i=0;i<S.car;i++)trafficCar();
mkCar(0,'#c0392b',-41,-30,0);mkCar(1,'#2e86de',-49,-60,Math.PI);mkCar(0,'#f1c40f',-20,-41,Math.PI/2);
for(let i=0;i<5;i++){const rd=roads[R()*roads.length|0],t=rd.a0+15+R()*(rd.a1-rd.a0-30);mkCar(R()*2|0,cc[R()*cc.length|0],rd.ax==='z'?rd.c+(rd.w/2-2.2):t,rd.ax==='z'?t:rd.c+(rd.w/2-2.2),rd.ax==='z'?0:Math.PI/2)}

let PRDY=0;const peds=[];const skins=['#f1c27d','#c68642','#8d5524','#ffdbac'],tops=['#e74c3c','#3498db','#f1c40f','#ecf0f1','#9b59b6','#e67e22','#1abc9c'],legs=['#2c3e50','#34495e','#7f8c8d','#4b3b2a'];
function pedPos(){for(let i=0;i<40;i++){const r=roads[R()*roads.length|0],t=r.a0+6+R()*(r.a1-r.a0-12),o=(R()<.5?-1:1)*(r.w/2+2),x=r.ax==='z'?r.c+o:t,z=r.ax==='z'?t:r.c+o;if(!blocked(x,z,.5)&&Math.hypot(x-P.x,z-P.z)>35)return[x,z]}return[-45,-45]}
function addPed(gang,x,z){const p=pedPos(),nsd=(PWID!=null&&!gang)?(((PSEED|0)*1013+PWID*104729+5)|0):null,ar=nsd!=null?rnd(nsd):R,m=(PRDY&&pickGPed(gang,ar))||mkPed(gang?'#b3121e':tops[ar()*tops.length|0],gang?'#1a1a1a':legs[ar()*legs.length|0],skins[ar()*4|0],['#1b1208','#4a3322','#c9a35b','#777'][ar()*4|0],'#1a1a1f',ar()<.5||gang);
 const o={m,x:x??p[0],z:z??p[1],a:R()*TAU,hp:40,dead:0,t:0,gang,ph:R()*6,sp:1.2+R(),wid:nsd!=null?PWID:undefined,sd:nsd};m.position.set(o.x,0,o.z);peds.push(o);return o}
for(let i=0;i<S.npc;i++)addPed();
P.mesh=mkPed('#1b1b1d','#59693f','#e0ac69','#2a1c10','#1c2a4a',1,1);P.mesh.traverse(o=>{o.userData.ns=0});

/* ---------- audio (procedural) ---------- */
let AC,NB,EO,EG,RG,SO,SG,mi_=0;
function aInit(){if(!S.snd)return;if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();const sr=AC.sampleRate;NB=AC.createBuffer(1,sr,sr);const d=NB.getChannelData(0);for(let i=0;i<sr;i++)d[i]=R()*2-1;
 EO=AC.createOscillator();EO.type='sawtooth';const lp=AC.createBiquadFilter();lp.frequency.value=420;EG=AC.createGain();EG.gain.value=0;EO.connect(lp);lp.connect(EG);EG.connect(AC.destination);EO.start();
 const rs=AC.createBufferSource();rs.buffer=NB;rs.loop=true;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=2200;RG=AC.createGain();RG.gain.value=0;rs.connect(hp);hp.connect(RG);RG.connect(AC.destination);rs.start();
 SO=AC.createOscillator();SO.type='square';SG=AC.createGain();SG.gain.value=0;SO.connect(SG);SG.connect(AC.destination);SO.start();setInterval(music,230)}AC.resume()}
function sfx(v,d,f){if(!AC||!S.snd)return;const s=AC.createBufferSource();s.buffer=NB;const lp=AC.createBiquadFilter();lp.frequency.value=f;const g=AC.createGain(),n=AC.currentTime;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);s.connect(lp);lp.connect(g);g.connect(AC.destination);s.start(0,R()*.5,d)}
function tone(f,d,ty,v){if(!AC||!S.snd)return;const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(n+d)}
const BASS=[45,45,48,45,43,43,47,50],ARP=[69,72,76,72,67,71,74,71],hz=n=>440*2**((n-69)/12);
const STN=[[BASS,ARP,'square','triangle',0],[BASS,ARP,'square','triangle',7],[[41,41,48,41,43,43,50,43],[65,69,72,76,74,72,69,67],'sine','triangle',0],[[38,45,38,45,36,43,36,43],[62,65,69,72,69,65,64,60],'triangle','sine',0]];
function music(){if(!AC||!S.snd||mode==='dead'||RAD===4)return;const s=STN[RAD],i=mi_++%8;tone(hz(s[0][i]+s[4]),.24,s[2],.04);if(i%2==0)tone(hz(s[1][(mi_>>1)%8]+s[4]),.22,s[3],.035)}

/* ---------- weapons / wanted / missions ---------- */
const WP=[{n:'Tabanca',cd:.35,dmg:34,rng:45,sp:.02,pel:1},{n:'SMG',cd:.09,dmg:15,rng:40,sp:.07,pel:1},{n:'Pompalı',cd:.85,dmg:22,rng:24,sp:.2,pel:5},{n:'Bazuka',cd:1.8,dmg:100,rng:80,sp:0,pel:1,rk:1}];
const trc=[];for(let i=0;i<8;i++){const l=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xffe9a0}));l.visible=false;l.t=0;scene.add(l);trc.push(l)}
function tracer(x1,y,z1,x2,z2){const l=trc.find(q=>!q.visible)||trc[0],p=l.geometry.attributes.position;p.setXYZ(0,x1,y,z1);p.setXYZ(1,x2,y,z2);p.needsUpdate=true;l.visible=true;l.t=.06}
const msgEl=$('msg');let msgT=0;function toast(t){$('sinf').textContent=t;if(window.feedAdd)feedAdd(t,0);else{msgEl.textContent=t;msgEl.style.opacity=1;msgT=3}}
function heat(h){P.heat=Math.min(150,P.heat+h)}
function killPed(p){if(p.dead)return;p.dead=1;p.t=0;p.kt=tt;if(ONL&&p.wid!=null)NET.pk(p);p.m.rotation.x=-Math.PI/2;p.m.position.y=.25;P.money+=5+(R()*35|0);heat(p.gang?10:p.cop?35:25);sfx(.2,.2,500);if(p.gang&&ms[mi]&&ms[mi].t==='kill')kills++}
function fire(){const w=WP[P.wep];if(P.cd>0)return;P.cd=w.cd;if(w.rk)return rocket();let tg=null,bd=1e9,ba=P.a;
 const cand=[...peds.filter(p=>!p.dead),...cars.filter(c=>c.cop&&!c.dead&&!c.drv),...(ONL?NET.cands():[])];
 for(const c of cand){const dx=c.x-P.x,dz=c.z-P.z,d=Math.hypot(dx,dz);if(d>w.rng||d<1)continue;let da=Math.atan2(dx,dz)-P.a;da=((da+Math.PI)%TAU+TAU)%TAU-Math.PI;if(Math.abs(da)<.4&&d<bd){bd=d;tg=c;ba=Math.atan2(dx,dz)}}
 P.a=ba;P.m_=ba;shotT=tt;if(ONL)NET.shot(ba,w.rng);shotX=P.x;shotZ=P.z;sfx(.35,.18,w.n==='Pompalı'?1800:2600);
 for(let k=0;k<w.pel;k++){const a=ba+(R()-.5)*2*w.sp,dx=Math.sin(a),dz=Math.cos(a);let bt=w.rng,hit=null;
  for(const c of cand){const rx=c.x-P.x,rz=c.z-P.z,t=rx*dx+rz*dz;if(t<0||t>bt)continue;const l=Math.abs(rx*dz-rz*dx);if(l<((c.cop&&c.pg)||c.rcar?1.9:.7)){bt=t;hit=c}}
  for(const b of blds){}
  tracer(P.x+dx*.8,1.3,P.z+dz*.8,P.x+dx*bt,P.z+dz*bt);shootCars(dx,dz,bt);
  if(hit){if(hit.rp){NET.hit(hit,w.dmg*(P.dm||1))}else if(hit.cop&&hit.pg){hit.hp-=w.dmg*.5*(P.dm||1);heat(8);if(hit.hp<=0&&!hit.dead){hit.dead=1;dk(hit);heat(40);toast('Polis aracı yok edildi')}}else{hit.hp-=w.dmg*(P.dm||1);if(hit.hp<=0)killPed(hit)}}}}
const ms=[...doc.querySelectorAll('mission')].map(e=>({t:e.getAttribute('type'),title:e.getAttribute('title'),x:+e.getAttribute('x'),z:+e.getAttribute('z'),r:+e.getAttribute('reward'),n:+e.getAttribute('count')||0,time:+e.getAttribute('time')||0}));
const marker=new T.Mesh(new T.CylinderGeometry(1.5,1.5,70,14,1,true),new T.MeshBasicMaterial({color:0xffd23c,transparent:true,opacity:.35,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}));marker.position.y=30;marker.userData.ns=1;scene.add(marker);
function startM(){const m=ms[mi];if(!m){marker.visible=false;return}marker.visible=true;marker.position.x=m.x;marker.position.z=m.z;kills=0;mTime=m.time;
 if(m.t==='kill')for(let i=0;i<m.n;i++){let x,z,n=0;do{x=m.x+(R()-.5)*30;z=m.z+(R()-.5)*30}while(blocked(x,z,.6)&&n++<30);addPed(1,x,z)}toast(m.title)}
function updM(dt){const m=ms[mi];if(!m)return;let ok=0;const d=Math.hypot(P.x-m.x,P.z-m.z);
 if(m.t==='goto')ok=d<6&&!P.car;else if(m.t==='drive')ok=d<7&&P.car;else if(m.t==='kill')ok=kills>=m.n;
 if(m.time){mTime-=dt;if(mTime<=0){toast('Süre bitti! Tekrar dene');startM();return}}
 if(ok){P.money+=m.r;toast('GÖREV TAMAM  +$'+m.r);sfx(.2,.3,3000);tone(880,.3,'triangle',.08);mi++;setTimeout(startM,2500)}}

/* ---------- player / cars logic ---------- */
function enter(c){P.car=c;c.drv=1;c.ai=0;c.v=0;P.mesh.visible=false;if(c.cop)heat(30)}
function exitCar(){const c=P.car,ps=P.psg;P.psg=0;P.seat=0;DR.gas=DR.brk=DR.steer=0;for(const s of(ps&&(NET.mySeat&1)?[1,-1,2]:[-1,1,2])){const x=c.x+Math.cos(c.a)*2.6*s*-1,z=c.z-Math.sin(c.a)*2.6*s*-1;if(!blocked(x,z,.5)){P.x=x;P.z=z;break}P.x=c.x;P.z=c.z}if(!ps){c.drv=0;c.v=0}P.car=null;P.last=c;P.mesh.visible=true;DR.gas=DR.brk=DR.steer=0;wAng=0;wid=null;wheelEl.style.transform='';if(ONL)NET.unsit()}
let ACT_T=0;function act(){if(mode!=='play')return;{const t=performance.now();if(t-ACT_T<350)return;ACT_T=t}{const np=nearPl();if(!P.car&&np){np.go();return}}if(!P.car&&HS&&MD.house&&Math.hypot(P.x-HS.x,P.z-HS.z)<22){if(HS.own)toast('Evin burası — iyileşiyorsun');else if(P.money>=2000){P.money-=2000;HS.own=1;toast('EV SATIN ALINDI! −$2000');tone(660,.3,'triangle',.08)}else toast('Ev $2000 — paran yetmiyor');return}if(P.car)exitCar();else{let b=null,bd=5;for(const c of cars)if(!c.dead){const d=Math.hypot(c.x-P.x,c.z-P.z);if(d<bd){bd=d;b=c}}if(b){if(ONL)NET.sit(b);else enter(b)}}}
const angD=(t,a)=>((t-a+3*Math.PI)%TAU+TAU)%TAU-Math.PI;
function playerCar(c,dt){autoPilot(c);const gs=clamp(Math.max(J.y,0)+(K.KeyW||K.ArrowUp?1:0)+DR.gas,0,1),bk=clamp(Math.max(-J.y,0)+(K.KeyS||K.ArrowDown?1:0)+DR.brk,0,1),jx=clamp(J.x+(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+DR.steer,-1,1);
 if(gs>.05)c.v+=gs*30*dt*(c.v>26?.5:1)*(c.mx>34||HY?1.8:1);
 if(bk>.05){if(c.v>.6){c.v-=52*bk*dt;if(c.v>12&&R()<.25){puff(c.x-Math.sin(c.a)*1.5,.3,c.z-Math.cos(c.a)*1.5,0xdddddd);sfx(.04,.12,1800)}}else c.v-=16*bk*dt}
 if(gs<=.05&&bk<=.05)c.v-=Math.sign(c.v)*Math.min(Math.abs(c.v),6*dt);
 c.roll+=(-jx*clamp(c.v,0,34)/34*.07-c.roll)*Math.min(1,6*dt);c.pit+=((bk-gs)*.025-c.pit)*Math.min(1,6*dt);
 if(c.hp<40&&R()<.3)puff(c.x+Math.sin(c.a)*1.8,1.1,c.z+Math.cos(c.a)*1.8,0x333333);
 if(K.Space&&!P.car.fired){}c.v=clamp(c.v,-10,c.mx||(HY?58:34));const spd0=Math.abs(c.v),drift=!c.air&&c.kind<5&&c.v>13&&Math.abs(jx)>.5&&(gs>.5||bk>.4);if(c.vh===undefined||c.v<4||c.air)c.vh=c.a;
 c.a-=jx*2.25*(drift?1.35:1)/(1+Math.abs(c.v)/26)*dt*clamp(c.v/8,-1,1);
 c.vh+=angD(c.a,c.vh)*Math.min(1,(drift?2.4:16)*dt);const slip=Math.abs(angD(c.a,c.vh));if(drift&&slip>.1)c.v*=1-.12*slip*dt;
 const ox=c.x,oz=c.z,mvd=Math.abs(c.v*dt);mv(c,Math.sin(c.vh)*c.v*dt,Math.cos(c.vh)*c.v*dt,1.9);
 c.skd=(slip>.14&&spd0>8)||(bk>.6&&spd0>15);if(window.skidTick)skidTick(c,c.skd,slip,dt);
 if(mvd>.01&&Math.hypot(c.x-ox,c.z-oz)<mvd*.5){const s=Math.abs(c.v);if(s>8){shake=Math.min(1,s/20);c.hp-=s*.7;sfx(.3,.25,700);if(c.cop)heat(0)}c.v*=-.25}
 if(c.hp<=0&&!c.dead){c.dead=1;dk(c);exitCar();toast('Araç bozuldu!')}
 for(const o of cars){if(o===c||o.dead)continue;const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz);if(d<3.6&&d>.01){const s=Math.abs(c.v);c.x-=dx/d*(3.6-d)*.6;c.z-=dz/d*(3.6-d)*.6;if(s>9){c.hp-=s*.25;sfx(.2,.2,600)}c.v*=.7;o.stop=1;if(o.cop&&s>9)heat(0)}}
 for(const p of peds)if(!p.dead&&Math.abs(c.v)>5&&Math.hypot(p.x-c.x,p.z-c.z)<2.2){killPed(p);c.v*=.92}
 P.x=c.x;P.z=c.z;P.a=c.a}
function aiCar(c,dt){const rd=c.rd;c.cd-=dt;const z=rd.ax==='z',ta=z?(c.dir>0?0:Math.PI):(c.dir>0?Math.PI/2:-Math.PI/2),tgt=z?rd.c-3*c.dir:rd.c+3*c.dir,fx=Math.sin(c.a),fz=Math.cos(c.a);
 let want=c.sp;if(mode==='play'){for(const q of(ONL?NET.targets():[P])){const px=q.x-c.x,pz=q.z-c.z,ah=px*fx+pz*fz,sd=Math.abs(px*fz-pz*fx);if(ah>0&&ah<9&&sd<2.8){want=0;break}}}
 if(c.stop>0){c.stop-=dt;want=0}if(want>0&&tlStop(c))want=0;
 c.v+=(want-c.v)*Math.min(1,3*dt);c.a+=angD(ta,c.a)*Math.min(1,5*dt);
 const s0=z?c.z:c.x,ox=c.x,oz=c.z;c.x+=fx*c.v*dt;c.z+=fz*c.v*dt;if(z)c.x+=(tgt-c.x)*Math.min(1,3*dt);else c.z+=(tgt-c.z)*Math.min(1,3*dt);
 if(!walk(c.x,c.z)){c.x=ox;c.z=oz}
 const ns=z?c.z:c.x;
 if(c.dir>0?ns>rd.a1-1:ns<rd.a0+1){const nx=roads.find(r=>r!==rd&&r.ax===rd.ax&&Math.abs(r.c-rd.c)<1&&(c.dir>0?Math.abs(r.a0-rd.a1)<2:Math.abs(r.a1-rd.a0)<2));if(nx)c.rd=nx;else c.dir*=-1}
 else if(c.cd<=0)for(const r2 of roads){if(r2.ax===rd.ax)continue;if(Math.abs(s0-r2.c)<1.5&&rd.c>r2.a0&&rd.c<r2.a1){c.cd=1.4;if(R()<.4){c.rd=r2;c.dir=R()<.5?1:-1}break}}}
function copAI(c,dt){const dx=P.x-c.x,dz=P.z-c.z,d=Math.hypot(dx,dz);
 if(c.out){c.v*=Math.max(0,1-3*dt);mv(c,Math.sin(c.a)*c.v*dt,Math.cos(c.a)*c.v*dt,1.9);if(!c.offs||c.offs.every(o=>o.dead)){c.outT=(c.outT||0)+dt;if(c.outT>5){c.out=0;c.outT=0;c.offs=null}}return}
 if(d<24&&mode==='play'&&PG.police&&(c.nxt||0)<tt&&Math.abs(P.car?P.car.v:0)<14){c.nxt=tt+20;deployCops(c);if(c.out)return}c.a+=clamp(angD(Math.atan2(dx,dz),c.a),-2.2*dt,2.2*dt);
 const sp=(19+stars*2.5)*(d<9?.5:1);c.v+=(sp-c.v)*Math.min(1,2*dt);
 if(!mv(c,Math.sin(c.a)*c.v*dt,Math.cos(c.a)*c.v*dt,1.9)){c.stuck+=dt;c.a+=(c.id%2?1:-1)*1.6*dt;c.v*=.6}else c.stuck=Math.max(0,c.stuck-dt);
 if(c.stuck>3||d>260){const q=spawnPt(110,170);if(q){c.x=q[0];c.z=q[1];c.stuck=0}}
 if(d<(P.car?3.9:2.8)&&mode==='play'){P.hp-=(P.car?9:14)*dt;if(P.car)P.car.v*=.985}}
function spawnPt(a,b){for(let i=0;i<25;i++){const r=roads[R()*roads.length|0],t=r.a0+8+R()*(r.a1-r.a0-16),x=r.ax==='z'?r.c:t,z=r.ax==='z'?t:r.c,d=Math.hypot(x-P.x,z-P.z);if(d>a&&d<b&&walk(x,z))return[x,z]}return null}
function updWorld(dt){if(ONL)NET.tick(dt);updPuff(dt);dmgTick(dt);updRemotes(dt);
 for(const c of cars){if(c.dead){c.m.position.set(c.x,0,c.z);continue}
  if(c.drv)playerCar(c,dt);else if(ONL&&NET.ctl(c,dt)){}else if(c.cop&&stars>0&&mode==='play')copAI(c,dt);else if(c.ai){const dc=Math.hypot(c.x-cam.position.x,c.z-cam.position.z);if(dc<150)aiCar(c,dt);else if(((FR+c.id)&1)===0)aiCar(c,dt*2)}
  c.m.position.set(c.x,0,c.z);c.m.rotation.set(c.pit,c.a,c.roll);{const dd=Math.hypot(c.x-cam.position.x,c.z-cam.position.z);c.m.visible=!!(c.drv||c.cop)||dd<PF.vis;if(c.m.visible&&((FR+c.id)&3)===0)carLod(c,dd)}if(c.cop&&c.lr){const f=Math.sin(tt*14)>0;c.lr.color.set(f?0xff1111:0x330000);c.lb.color.set(f?0x112266:0x3366ff)}}
 for(let i=peds.length-1;i>=0;i--){const p=peds[i];if(ONL&&p.wid!=null&&NET.ped(p,dt))continue;const far=Math.hypot(p.x-cam.position.x,p.z-cam.position.z)>110;if(far&&((FR+i)%3))continue;const pdt=far?dt*3:dt;
  if(p.dead){p.t+=pdt;if(p.t>8){if(p.gang||p.cop){scene.remove(p.m);peds.splice(i,1)}else{const q=pedPos();p.x=q[0];p.z=q[1];p.dead=0;p.hp=40;p.m.rotation.x=0;p.m.position.y=0}}continue}
  if(p.cop){updCopPed(p,pdt,i);continue}
  const fear=!p.foe&&tt-shotT<6&&Math.hypot(p.x-shotX,p.z-shotZ)<35,sp=p.foe?(p.fsp||3.8):(fear?5.5:p.sp);
  if(p.foe){const fx=P.x-p.x,fz=P.z-p.z,fd=Math.hypot(fx,fz);p.a=Math.atan2(fx,fz);if(fd<6)p.a=Math.atan2(fx,fz)+Math.PI*.5*Math.sign(Math.sin(tt*.7+p.ph))}else if(fear)p.a=Math.atan2(p.x-shotX,p.z-shotZ);else if(R()<.01)p.a+=(R()-.5)*2;
  if(p.gang&&!fear&&!p.foe){const d=Math.hypot(P.x-p.x,P.z-p.z);if(d<22)p.a=Math.atan2(P.x-p.x,P.z-p.z)+Math.PI;}
  if(!mv(p,Math.sin(p.a)*sp*pdt,Math.cos(p.a)*sp*pdt,.5))p.a+=1.6+R();
  p.ph+=sp*pdt*2.2;const sw=Math.sin(p.ph)*.7;swingPed(p.m,sw);
  p.m.position.set(p.x,0,p.z);p.m.rotation.y=p.a;pedVis(p)}}
function playerFoot(dt){const f=[Math.sin(yaw),Math.cos(yaw)],r=[-Math.cos(yaw),Math.sin(yaw)];
 let ix=J.x+(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),iy=J.y+(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);const l=Math.hypot(ix,iy);if(l>1){ix/=l;iy/=l}
 if(l>.08){const dx=f[0]*iy+r[0]*ix,dz=f[1]*iy+r[1]*ix,sp=((B.run||K.ShiftLeft)?7.5:4)*(P.boost>0?1.4:1);mv(P,dx*sp*dt,dz*sp*dt,.5);if(!(B.fire||K.Space))P.a+=angD(Math.atan2(dx,dz),P.a)*Math.min(1,12*dt);P.ph+=sp*dt*2.2}
 const sw=l>.08?Math.sin(P.ph)*.8:0,q=P.mesh.parts;swingPed(P.mesh,sw);
 if(B.fire||K.Space){q[3].rotation.x=-1.5;P.mesh.elb[1].rotation.x=-.15;fire()}
 for(const c of cars)if(!c.dead&&Math.abs(c.v)>8){const d=Math.hypot(c.x-P.x,c.z-P.z);if(d<2.4){P.hp-=25*dt*3;c.v*=.9}}
 if(P.hp<100&&stars===0)P.hp=Math.min(100,P.hp+(HS&&HS.own&&Math.hypot(P.x-HS.x,P.z-HS.z)<26?12:1.5)*dt)}

const pf=[],pfG=new T.SphereGeometry(.5,6,5);let shake=0,DAY=1;
for(let i=0;i<30;i++){const m=new T.Mesh(pfG,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.userData.ns=1;m.visible=false;m.life=0;scene.add(m);pf.push(m)}
function puff(x,y,z,c){const m=pf.find(q=>!q.visible);if(!m)return;m.visible=true;m.life=1;m.position.set(x,y,z);m.scale.setScalar(.6);m.material.color.set(c)}
function updPuff(dt){for(const m of pf)if(m.visible){m.life-=dt*.9;m.position.y+=dt*1.6;m.scale.addScalar(dt*2.2);m.material.opacity=Math.max(0,m.life*.5);if(m.life<=0)m.visible=false}}
const HL=new T.SpotLight(0xfff0c0,0,85,.55,.6,1);HL.userData.ns=1;scene.add(HL,HL.target);
/* ---------- environment ---------- */
const colN=new T.Color(0x080c24),colD=new T.Color(0x7fc4ee),colS=new T.Color(0xff7a4a),skyC=new T.Color();
const rainG=new T.BufferGeometry(),RN=900,rd_=new Float32Array(RN*3),rp_=new Float32Array(RN*6);
for(let i=0;i<RN;i++){rd_[i*3]=(R()-.5)*60;rd_[i*3+1]=R()*30;rd_[i*3+2]=(R()-.5)*60}
rainG.setAttribute('position',new T.BufferAttribute(rp_,3));const rainL=new T.LineSegments(rainG,new T.LineBasicMaterial({color:0xaac8ff,transparent:true,opacity:.4}));rainL.frustumCulled=false;rainL.visible=false;scene.add(rainL);
function env(dt){hour=ONL?NET.hour():(hour+dt*[1/120,1/40,1/12][S.day])%24;const sa=(hour-6)/12*Math.PI,sv=Math.sin(sa),d=clamp((sv+.15)/.45,0,1);
 if(ONL)rainOn=NET.rain();else if(S.rain===1){rainT-=dt;if(rainT<=0){rainOn=!rainOn;rainT=rainOn?40+R()*50:80+R()*100}}else rainOn=S.rain===2?1:0;
 rainI+=((rainOn?1:0)-rainI)*Math.min(1,.5*dt);
 skyC.copy(colN).lerp(colD,d).lerp(colS,clamp(1-Math.abs(sv)/.3,0,1)*.55).multiplyScalar(1-.35*rainI);scene.background=skyC;scene.fog.color.copy(skyC);scene.fog.near=120-60*rainI;scene.fog.far=720-380*rainI;
 hemi.intensity=.28+.65*d;if(INT)hemi.intensity=Math.max(hemi.intensity,.9);sun.intensity=.08+.85*d*(1-.5*rainI);sun.position.set(P.x+Math.cos(sa)*140,Math.abs(sv)*140+45,P.z+80);sun.target.position.set(P.x,0,P.z);
 const nt=(1-d)*1.1;lampM.color.copy(lampOff).lerp(lampOn,1-d);DAY=d;for(const m of wms)m.emissiveIntensity=nt;
 rainL.visible=rainI>.05;if(rainL.visible){rainL.material.opacity=.45*rainI;const cx=cam.position.x,cz=cam.position.z;
  for(let i=0;i<RN;i++){let x=rd_[i*3],y=rd_[i*3+1]-45*dt,z=rd_[i*3+2];if(y<0)y+=30;if(x<cx-30)x+=60;else if(x>cx+30)x-=60;if(z<cz-30)z+=60;else if(z>cz+30)z-=60;rd_[i*3]=x;rd_[i*3+1]=y;rd_[i*3+2]=z;
   const o6=i*6;rp_[o6]=x;rp_[o6+1]=y;rp_[o6+2]=z;rp_[o6+3]=x-.1;rp_[o6+4]=y+.9;rp_[o6+5]=z-.1}rainG.attributes.position.needsUpdate=true}}

/* ---------- input ---------- */
const bind=(id,dn,up)=>{const e=$(id);e.addEventListener('pointerdown',ev=>{ev.preventDefault();dn()});if(up){e.addEventListener('pointerup',up);e.addEventListener('pointerleave',up);e.addEventListener('pointercancel',up)}};
bind('bFire',()=>B.fire=1,()=>B.fire=0);bind('bAct',act);bind('bRun',()=>{B.run=!B.run;$('bRun').style.background=B.run?'#ff9a3ccc':''});bind('bWep',()=>wheel(1));
bind('pGas',()=>DR.gas=1,()=>DR.gas=0);bind('pBrk',()=>DR.brk=1,()=>DR.brk=0);
$('dtk').innerHTML=Array.from({length:9},(_,i)=>{const a=(-90+i*22.5)*Math.PI/180;return `<line x1="${100+62*Math.sin(a)}" y1="${105-62*Math.cos(a)}" x2="${100+70*Math.sin(a)}" y2="${105-70*Math.cos(a)}"/>`}).join('');
const wheelEl=$('wheel');let wid=null;
let wAng=0,wLast=0;const WMAX=Math.PI*2*4,WLOCK=Math.PI*1.05;const stF=w=>{const x=clamp(w/WLOCK,-1,1),a=Math.abs(x);return Math.sign(x)*a*(2-a)};
const wPt=e=>{const r=wheelEl.getBoundingClientRect();return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))};
function wSet(v){wAng=clamp(v,-WMAX,WMAX);DR.steer=stF(wAng);wheelEl.style.transition='none';wheelEl.style.transform=`rotate(${wAng}rad)`}
function wm(e){const p=wPt(e);wSet(wAng+angD(p,wLast));wLast=p}
wheelEl.addEventListener('pointerdown',e=>{wid=e.pointerId;wheelEl.setPointerCapture(wid);wLast=wPt(e)});wheelEl.addEventListener('pointermove',e=>{if(e.pointerId===wid)wm(e)});
const wend=e=>{if(e.pointerId===wid)wid=null};wheelEl.addEventListener('pointerup',wend);wheelEl.addEventListener('pointercancel',wend);
{let wT=performance.now();(function wl(n){requestAnimationFrame(wl);const dt=Math.min(.05,(n-wT)/1000);wT=n;if(wid===null&&wAng!==0){const k=Math.max(Math.abs(wAng)*(1-Math.exp(-dt*6)),2.6*dt);wAng=Math.abs(wAng)<=k?0:wAng-Math.sign(wAng)*k;DR.steer=stF(wAng);wheelEl.style.transition='none';wheelEl.style.transform=wAng?`rotate(${wAng}rad)`:''}})(wT)}
addEventListener('keydown',e=>{K[e.code]=1;if((e.code==='KeyE'||e.code==='Enter')&&!e.repeat)act();if(e.code==='KeyQ')wheel(!WS)});addEventListener('keyup',e=>K[e.code]=0);
const joy=$('joy'),kn=$('kn');let jid=null;
function jm(e){const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.min(1,Math.hypot(dx,dy)/(r.width*.42)),a=Math.atan2(dy,dx);J.x=Math.cos(a)*l;J.y=-Math.sin(a)*l;kn.style.transform=`translate(${J.x*r.width*.3}px,${-J.y*r.width*.3}px)`}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);jm(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e)});
const jend=e=>{if(e.pointerId===jid){jid=null;J.x=J.y=0;kn.style.transform=''}};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
let did=null,dlx=0,dly=0,CP=0;const cvs=$('c');cvs.addEventListener('pointerdown',e=>{did=e.pointerId;dlx=e.clientX;dly=e.clientY});cvs.addEventListener('pointermove',e=>{if(e.pointerId===did){yaw-=(e.clientX-dlx)*.006;dlx=e.clientX;if(mode==='play')CP=clamp(CP-(e.clientY-dly)*.0045,0,1);dly=e.clientY;drag=2}});
cvs.addEventListener('pointerup',()=>did=null);cvs.addEventListener('pointercancel',()=>did=null);

/* ---------- menu & settings ---------- */
const show=(id)=>{$('fm').classList.add('hid');for(const x of['menu','set'])$(x).classList.toggle('hid',x!==id)};
function lbl(){$('oSnd').textContent='SES: '+(S.snd?'AÇIK':'KAPALI');$('oRain').textContent='YAĞMUR: '+['KAPALI','OTOMATİK','AÇIK'][S.rain];$('oDay').textContent='GÜN HIZI: '+['YAVAŞ','NORMAL','HIZLI'][S.day];$('oGfx').textContent='GRAFİK: '+['1 DÜŞÜK','2 NORMAL','3 YÜKSEK','4 HD','5 4K HD'][S.gfx];$('oAuto').textContent='OTO PERFORMANS: '+(S.auto?'AÇIK':'KAPALI')}
$('oSnd').onclick=()=>{S.snd^=1;saveCfg();lbl();if(S.snd)aInit()};$('oRain').onclick=()=>{S.rain=(S.rain+1)%3;saveCfg();lbl()};$('oDay').onclick=()=>{S.day=(S.day+1)%3;saveCfg();lbl()};$('oGfx').onclick=()=>{S.gfx=(S.gfx+1)%5;saveCfg();lbl();resize();setGfx()};$('oAuto').onclick=()=>{S.auto^=1;if(!S.auto){PF.lvl=0;PF.okS=0;perfApply()}saveCfg();lbl()};lbl();
$('bSet').onclick=()=>show('set');document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('menu'));
let started=0;
$('bPlay').onclick=()=>{aInit();try{const d=document.documentElement;(d.requestFullscreen?d.requestFullscreen():Promise.resolve()).then(()=>screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape')).catch(()=>{})}catch(e){}show('');mode='play';$('hud').classList.remove('hid');$('ctl').classList.remove('hid');$('bPlay').textContent='DEVAM';if(!started){started=1;startM();toast('GTA 67 — Hoş geldin')}};
$('pz').onclick=()=>{mode='menu';show('menu');$('hud').classList.add('hid');$('ctl').classList.add('hid');J.x=J.y=0;B.fire=0};

/* ---------- places, waypoint, taxi job ---------- */
let WPT=null,TJ=null;
const mkBeam=c=>{const m=new T.Mesh(new T.CylinderGeometry(1.2,1.2,60,12,1,true),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.35,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}));m.userData.ns=1;m.visible=false;scene.add(m);return m};
const wpM=mkBeam(0xff2fa8),tjM=mkBeam(0x00ffff);
const PI={market:['M','#3f3',0x33ff66,'ARAÇ: İçeri gir'],ammu:['S','#f33',0xff3344,'ARAÇ: İçeri gir'],clothes:['G','#6cf',0x66ccff,'ARAÇ: İçeri gir'],food:['R','#fa3',0xffaa33,'ARAÇ: İçeri gir'],mod:['C','#c6f',0xcc66ff,'ARAÇ: İçeri gir'],pizza:['Z','#f84',0xff8844,'ARAÇ: Pizza işi'],cargo:['N','#ca4',0xccaa44,'ARAÇ: Nakliye işi'],bus:['O','#4af',0x44aaff,'ARAÇ: Otobüs işi'],mail:['P','#fff',0xffffff,'ARAÇ: Posta işi'],tow:['Ç','#f55',0xff5555,'ARAÇ: Çekici işi'],garbage:['Ç','#8c4',0x88cc44,'ARAÇ: Çöp işi'],emlak:['E','#6bf',0x66bbff,'ARAÇ: İçeri gir'],home:['H','#fc6',0xffcc66,'ARAÇ: Eve gir'],chat:['S','#c9f',0xcc99ff,'ARAÇ: Sohbet et'],race:['Y','#fff',0xffffff,'ARAÇ: Yarışı başlat'],casino:['K','#ff0',0xffd700,'ARAÇ: İçeri gir'],club:['P','#f6c',0xff66cc,'ARAÇ: İçeri gir'],taxi:['T','#fd2',0xffd23c,'ARAÇ: Taksi işi'],courier:['K','#0ff',0x00ffff,'ARAÇ: Kurye işi'],cafe:['Ç','#da8',0xddaa88,'ARAÇ: İçeri gir'],pharm:['+','#4f8',0x44ff88,'ARAÇ: İçeri gir'],gym:['Y','#f84',0xff8844,'ARAÇ: İçeri gir'],galeri:['A','#8cf',0x88ccff,'ARAÇ: İçeri gir'],garage:['J','#0df',0x00ddff,'ARAÇ: Garaj'],factory:['F','#bbb',0xbbbbbb,'ARAÇ: Fabrika vardiyası']};
const PLC=[...doc.querySelectorAll('place')].map(e=>({t:e.getAttribute('type'),n:e.getAttribute('name'),x:+e.getAttribute('x'),z:+e.getAttribute('z'),ib:e.getAttribute('isl'),bi:e.getAttribute('bi'),bj:e.getAttribute('bj')}));
for(let i=PLC.length-1;i>=0;i--){const q=PLC[i];if(!RSVB[q.ib+':'+q.bi+':'+q.bj])PLC.splice(i,1)}
/* ---- doors, interiors, shops ---- */
var RHX=13,RHZ=10,RHY=4.6;const R0X=5000,R0Z=5000,ROOM=new T.Group(),DANC=[],IL=new T.PointLight(0xfff2d0,0,45,1.4);let MODCAR=null;scene.add(ROOM);IL.position.set(R0X,3.8,R0Z);scene.add(IL);lands.push({x1:R0X-14,z1:R0Z-11,x2:R0X+14,z2:R0Z+11});

const LG={},LOGO={
casino:(R,C,P,x)=>{R(-30,-30,60,60);x.fillStyle='#10131c';C(-14,-14,6);C(14,-14,6);C(0,0,6);C(-14,14,6);C(14,14,6)},
club:(R,C,P)=>{P([[-34,-28],[-14,-28],[-6,4],[20,12],[38,24],[32,32],[-14,18],[-24,36],[-31,36]])},
cafe:(R,C,P,x)=>{R(-26,-8,40,34);x.beginPath();x.arc(20,8,11,-1.4,1.4);x.stroke();R(-32,28,52,6);R(-18,-30,5,14);R(-4,-30,5,14)},
pharm:(R)=>{R(-12,-34,24,68);R(-34,-12,68,24)},
gym:(R)=>{R(-34,-10,10,20);R(-24,-20,8,40);R(-16,-5,32,10);R(16,-20,8,40);R(24,-10,10,20)},
galeri:(R,C,P)=>{P([[-36,6],[-28,-8],[-10,-18],[14,-18],[28,-6],[38,6],[38,16],[-36,16]]);C(-20,18,9);C(22,18,9)},
garage:(R,C,P)=>{P([[-38,-8],[0,-34],[38,-8],[38,34],[-38,34]]);R(-20,4,40,30)},
mod:(R,C,P,x)=>{x.rotate(-.8);R(-5,-8,10,46);C(0,-18,15);x.clearRect(-6,-36,12,16)},
market:(R,C,P,x)=>{x.beginPath();x.moveTo(-38,-26);x.lineTo(-26,-26);x.lineTo(-18,14);x.lineTo(24,14);x.lineTo(32,-14);x.lineTo(-24,-14);x.stroke();C(-12,28,6);C(20,28,6)},
ammu:(R,C,P,x)=>{x.beginPath();x.arc(0,0,22,0,7);x.stroke();R(-3,-38,6,22);R(-3,16,6,22);R(-38,-3,22,6);R(16,-3,22,6)},
clothes:(R,C,P)=>{P([[-14,-34],[14,-34],[38,-18],[28,-6],[18,-12],[18,34],[-18,34],[-18,-12],[-28,-6],[-38,-18]])},
food:(R,C,P,x)=>{x.beginPath();x.arc(0,-6,30,Math.PI,0);x.fill();R(-34,0,68,8);R(-34,14,68,6);x.beginPath();x.arc(0,22,30,0,Math.PI);x.fill()},
taxi:(R,C,P)=>{R(-12,-34,24,10);P([[-36,8],[-26,-8],[-10,-20],[14,-20],[28,-6],[38,8],[38,18],[-36,18]]);C(-20,20,8);C(22,20,8)},
courier:(R,C,P,x)=>{R(-30,-18,60,46);x.fillStyle='#10131c';R(-4,-18,8,46);x.fillStyle=x.strokeStyle},
factory:(R,C,P,x)=>{x.beginPath();x.arc(0,0,22,0,7);x.lineWidth=14;x.stroke();for(let i=0;i<8;i++){x.save();x.rotate(i*Math.PI/4);R(-6,-36,12,14);x.restore()}}
};
LOGO.pizza=LOGO.food;LOGO.cargo=LOGO.courier;LOGO.bus=LOGO.taxi;LOGO.mail=LOGO.courier;LOGO.tow=LOGO.mod;LOGO.garbage=LOGO.factory;LOGO.emlak=LOGO.garage;LOGO.home=LOGO.garage;LOGO.chat=(R,C,P)=>{R(-36,-30,72,44);P([[-20,14],[-20,34],[0,14]])};LOGO.race=R=>{for(let i=0;i<6;i++)for(let j=0;j<4;j++)if((i+j)%2==0)R(-36+i*12,-24+j*12,12,12)};
function logoTex(t){if(LG[t])return LG[t];const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d'),col='#'+PI[t][2].toString(16).padStart(6,'0');x.fillStyle='#10131c';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.strokeStyle=col;x.lineWidth=5;x.stroke();x.fillStyle=col;x.lineCap=x.lineJoin='round';x.translate(64,64);x.lineWidth=7;
 const R=(a,b,w,h)=>x.fillRect(a,b,w,h),C=(a,b,r)=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()},P=q=>{x.beginPath();q.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill()};
 x.save();(LOGO[t]||(()=>{}))(R,C,P,x);x.restore();return LG[t]=new T.CanvasTexture(cv)}
const gRing=new T.RingGeometry(1.7,2.4,28);
function mkDoor(p){const hs=[...p.n].reduce((a,c)=>a+c.charCodeAt(0),0)+(p.dx|0),FH=[6,9.5,13][hs%3],FCl=[0x15171d,0xf2f2f2,0xf1c40f,0xe67e22,0x1abc9c,0x8e44ad,0xc0392b,0x2d3436][hs%8],col=PI[p.t][2],g=new T.Group(),M=c=>new T.MeshBasicMaterial({color:c}),add=(m,x,y,z,sx,sy,sz)=>{m.position.set(x,y,z);if(sx)m.scale.set(sx,sy,sz);m.userData.ns=1;g.add(m);return m};
 add(new T.Mesh(gBox,M(FCl)),0,FH/2,0,1.2,FH,16+hs%3*4);for(let k=1;2+k*3.2<FH-1;k++)add(new T.Mesh(gBox,M(0x8fc4ef)),-.65,2.6+k*3.2,0,.2,1.5,12);add(new T.Mesh(gBox,M(col)),-.7,2,0,.5,4,3.6);add(new T.Mesh(gBox,M(0x0b0c10)),-.5,2,0,.4,3.6,3.2);add(new T.Mesh(gBox,M(col)),-.7,FH+.2,0,.6,.35,16);
 const sg=add(new T.Mesh(new T.PlaneGeometry(3.4,3.4),new T.MeshBasicMaterial({map:logoTex(p.t),side:T.DoubleSide})),-.8,5.8,0);sg.rotation.y=-Math.PI/2;
 const rg=new T.Mesh(gRing,new T.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));rg.rotation.x=-Math.PI/2;add(rg,-1.3,.12,0);
 g.position.set(p.dx+1.3,0,p.dz);scene.add(g)}
function mkBox(p){const B=RSVB[p.ib+':'+p.bi+':'+p.bj],ix=p.x,iz=p.z;p.x=B.cx;p.z=B.cz;const r=rnd(((ix*7+iz*13)|0)+5),col=PI[p.t][2],sm=r()<.5,w=sm?Math.max(16,Math.min(B.w-16,20+r()*8)):B.w-12-r()*4,d=sm?Math.max(16,Math.min(B.d-16,18+r()*8)):B.d-12-r()*4,h=sm?12+r()*2:13+r()*6,
 Lb=c=>new T.MeshLambertMaterial({color:c}),Mk=c=>new T.MeshBasicMaterial({color:c}),g=new T.Group(),
 ad=(par,geo,mat,x,y,z,sx,sy,sz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);par.add(m);return m},
 pal=[0xb8b2a6,0x9aa3ad,0xc9bfa5,0x8f9a8d,0xa79aa8,0xb0a090,0x7f8c99];
 {const fc=['#e8a87c','#c38d9e','#85cdca','#e27d60','#41b3a3','#f7d794','#9bb7d4','#d98880','#b8a9e0'],sw=wmat(fc[r()*fc.length|0],(w+d)/40,h/28),bm_=new T.Mesh(gBox,[sw,sw,roofM,roofM,sw,sw]);bm_.scale.set(w,h,d);bm_.position.y=.4+h/2;g.add(bm_);ad(g,gBox,Mk(col),0,.4+h*.55,0,w+.5,.3,d+.5)}ad(g,gBox,Lb(0x34373e),0,.55+h,0,w+.6,.3,d+.6);
 if(r()<.7)ad(g,gBox,Lb(0x555a62),(r()-.5)*w*.4,h+1.5,(r()-.5)*d*.4,2+r()*3,1.8,2+r()*3);
 if(r()<.5)ad(g,gTrunk,Lb(0x444444),(r()-.5)*w*.5,h+2.2,(r()-.5)*d*.5,1,2,1);
 const sdx=ix<B.cx?3:2,sdz=iz<B.cz?1:0,sd=r()<.5?sdx:sdz,len=sd<2?w:d,half=(sd<2?d:w)/2,sg_=sd<2?Math.sign(ix-B.cx)||1:Math.sign(iz-B.cz)||1,off=sg_*Math.max(0,len/2-8-r()*8),sc=.9+r()*.35,dg=new T.Group();
 ad(dg,gBox,Mk(col),0,.4+2.3*sc,.05,3.6*sc,4.6*sc,.5);ad(dg,gBox,Mk(0x07080b),0,.4+2*sc,.2,2.8*sc,4*sc,.5);
 const sg=new T.Mesh(new T.PlaneGeometry(3.2,3.2),new T.MeshBasicMaterial({map:logoTex(p.t),side:T.DoubleSide}));sg.position.set(0,.4+4.6*sc+2,.4);dg.add(sg);
 const rg=new T.Mesh(gRing,new T.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));rg.rotation.x=-Math.PI/2;rg.position.set(0,.12,3.6);dg.add(rg);
 const bm=new T.Mesh(new T.CylinderGeometry(.5,.5,30,8,1,true),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.22,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}));bm.position.set(0,15,3.6);dg.add(bm);
 {const tx=new T.Mesh(new T.PlaneGeometry(9,2.25),new T.MeshBasicMaterial({map:signTex(p.n,'#'+col.toString(16).padStart(6,'0')),side:T.DoubleSide}));tx.position.set(0,.4+4.6*sc+4.9,.45);dg.add(tx);ad(dg,gBox,Mk(col),0,.4+4.6*sc+.35,1.1,4.6*sc,.3,2.2)}
  dg.traverse(o=>{o.userData.ns=1});
 const pos=[[off,half],[off,-half],[half,off],[-half,off]][sd],nrm=[[0,1],[0,-1],[1,0],[-1,0]][sd];
 dg.position.set(pos[0],0,pos[1]);dg.rotation.y=[0,Math.PI,Math.PI/2,-Math.PI/2][sd];g.add(dg);
 g.position.set(p.x,0,p.z);scene.add(g);p.dx=p.x+pos[0]+nrm[0]*3.6;p.dz=p.z+pos[1]+nrm[1]*3.6;
 blds.push({x1:p.x-w/2,x2:p.x+w/2,z1:p.z-d/2,z2:p.z+d/2});
 {const c2=MMc.getContext('2d');c2.fillStyle='#8a8f9c';c2.fillRect((p.x-w/2-mnx)*MS,(p.z-d/2-mnz)*MS,w*MS,d*MS)}}
const NT=[["hastane", "H", "#ff4d4d", 16731469, 16055295, 15158332, "cross"], ["karakol", "K", "#4d7dff", 5078527, 2832981, 4025343, "shield"], ["banka", "B", "#59d47a", 5887098, 15266016, 3050327, "coin"], ["otel", "O", "#d4a24d", 13935181, 15984336, 12092939, "bed"], ["sinema", "S", "#b04dff", 11554303, 1839152, 9323693, "film"], ["bowling", "B", "#ff8c4d", 16747597, 2767445, 15105570, "pins"], ["berber", "B", "#4dd2c8", 5100232, 15135986, 1482885, "scissors"], ["benzinlik", "P", "#ffd24d", 16765517, 14540253, 15844367, "pump"], ["yikama", "Y", "#4db8ff", 5093631, 14676479, 3049182, "drop"], ["kutuphane", "K", "#c49a6c", 12884588, 15720648, 9263659, "book"], ["muze", "M", "#e0d0a0", 14733472, 15788760, 11901786, "column"], ["arcade", "A", "#ff4dc8", 16731592, 1182242, 16723880, "pad"], ["havuz", "H", "#4dd2ff", 5100287, 14218495, 43240, "wave"], ["firin", "F", "#e8b86d", 15251565, 16509384, 13208125, "bread"], ["cicekci", "Ç", "#ff7aa8", 16743080, 16771312, 15221651, "flower"], ["kuyumcu", "K", "#ffe14d", 16769357, 1710626, 16766720, "diamond"], ["telefon", "T", "#7ad0ff", 8048895, 15265525, 3447003, "phone"], ["dovme", "D", "#ff5d5d", 16735581, 1776415, 12597547, "star"], ["itfaiye", "İ", "#ff6a3d", 16738877, 16113880, 13849600, "flame"], ["petshop", "P", "#a8d45a", 11064410, 15923172, 8172354, "paw"], ["dondurma", "D", "#ffb3d9", 16757721, 16773367, 16744639, "cone"], ["kitapci", "K", "#b08968", 11569512, 15985375, 8344889, "book"], ["tiyatro", "T", "#d36cff", 13855999, 2756398, 10168239, "mask"], ["hamam", "H", "#9ad8d0", 10148048, 15333108, 5093036, "wave"], ["bilardo", "B", "#4dd27a", 5100154, 993820, 1999945, "ball"], ["balik", "B", "#5aa9e6", 5941734, 14937847, 2651302, "fish"], ["lastikci", "L", "#aaaaaa", 11184810, 2829104, 8359053, "tire"], ["parfum", "P", "#e7a8ff", 15182079, 16445695, 12282841, "bottle"], ["oyuncak", "O", "#ffc94d", 16763213, 16774876, 15965202, "bear"]];
const NIC={cross:g=>{g.fillRect(-.22,-.85,.44,1.7);g.fillRect(-.85,-.22,1.7,.44)},shield:g=>{g.beginPath();g.moveTo(-.7,-.8);g.lineTo(.7,-.8);g.lineTo(.7,.1);g.lineTo(0,.95);g.lineTo(-.7,.1);g.fill()},coin:g=>{g.beginPath();g.arc(0,0,.8,0,6.3);g.stroke();g.fillRect(-.1,-.55,.2,1.1)},bed:g=>{g.fillRect(-.95,.1,1.9,.4);g.fillRect(-.95,-.5,.2,1);g.beginPath();g.arc(-.45,-.1,.2,0,6.3);g.fill();g.fillRect(-.2,-.25,.9,.35)},film:g=>{g.strokeRect(-.8,-.6,1.6,1.2);g.fillRect(-.3,-.25,.6,.5)},pins:g=>{for(const x of[-.5,0,.5]){g.beginPath();g.arc(x,-.45,.2,0,6.3);g.fill();g.fillRect(x-.14,-.25,.28,.8)}},scissors:g=>{g.beginPath();g.moveTo(-.7,-.8);g.lineTo(.7,.8);g.moveTo(.7,-.8);g.lineTo(-.7,.8);g.stroke()},pump:g=>{g.fillRect(-.6,-.8,.9,1.6);g.beginPath();g.moveTo(.3,-.4);g.lineTo(.85,-.1);g.lineTo(.85,.6);g.stroke()},drop:g=>{g.beginPath();g.moveTo(0,-.9);g.lineTo(.6,.1);g.arc(0,.2,.6,0,3.14);g.lineTo(0,-.9);g.fill()},book:g=>{g.fillRect(-.8,-.6,.75,1.2);g.fillRect(.05,-.6,.75,1.2)},column:g=>{g.beginPath();g.moveTo(-.9,-.5);g.lineTo(0,-.9);g.lineTo(.9,-.5);g.fill();for(const x of[-.6,-.1,.4])g.fillRect(x,-.4,.3,1);g.fillRect(-.9,.65,1.8,.2)},pad:g=>{g.fillRect(-.9,-.4,1.8,.9);g.fillRect(-.3,-.8,.6,.4)},wave:g=>{for(const y of[-.4,.1,.6]){g.beginPath();g.moveTo(-.9,y);g.quadraticCurveTo(-.45,y-.4,0,y);g.quadraticCurveTo(.45,y+.4,.9,y);g.stroke()}},bread:g=>{g.beginPath();g.ellipse(0,0,.9,.55,0,0,6.3);g.fill()},flower:g=>{for(let i=0;i<5;i++){const a=i*1.2566;g.beginPath();g.arc(Math.cos(a)*.5,Math.sin(a)*.5-.1,.3,0,6.3);g.fill()}g.fillRect(-.06,.3,.12,.6)},diamond:g=>{g.beginPath();g.moveTo(0,-.9);g.lineTo(.8,0);g.lineTo(0,.9);g.lineTo(-.8,0);g.fill()},phone:g=>{g.fillRect(-.45,-.9,.9,1.8)},star:g=>{g.beginPath();for(let i=0;i<10;i++){const a=i*.6283-1.5708,r=i%2?.4:.95;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.fill()},flame:g=>{g.beginPath();g.moveTo(0,-.95);g.quadraticCurveTo(.9,0,.5,.6);g.quadraticCurveTo(0,1,-.5,.6);g.quadraticCurveTo(-.9,0,0,-.95);g.fill()},paw:g=>{g.beginPath();g.arc(0,.3,.45,0,6.3);g.fill();for(const x of[-.7,-.25,.25,.7]){g.beginPath();g.arc(x,-.35+(Math.abs(x)<.5?-.2:0),.18,0,6.3);g.fill()}},cone:g=>{g.beginPath();g.moveTo(-.5,-.1);g.lineTo(.5,-.1);g.lineTo(0,.95);g.fill();g.beginPath();g.arc(0,-.35,.5,0,6.3);g.fill()},mask:g=>{g.beginPath();g.ellipse(0,0,.7,.9,0,0,6.3);g.fill()},ball:g=>{g.beginPath();g.arc(0,0,.8,0,6.3);g.stroke();g.beginPath();g.arc(.2,-.2,.25,0,6.3);g.fill()},fish:g=>{g.beginPath();g.ellipse(-.1,0,.6,.4,0,0,6.3);g.fill();g.beginPath();g.moveTo(.4,0);g.lineTo(.95,-.4);g.lineTo(.95,.4);g.fill()},tire:g=>{g.beginPath();g.arc(0,0,.85,0,6.3);g.stroke();g.beginPath();g.arc(0,0,.25,0,6.3);g.fill()},bottle:g=>{g.fillRect(-.2,-.9,.4,.4);g.fillRect(-.55,-.5,1.1,1.4)},bear:g=>{g.beginPath();g.arc(0,.1,.6,0,6.3);g.fill();g.beginPath();g.arc(-.5,-.55,.25,0,6.3);g.fill();g.beginPath();g.arc(.5,-.55,.25,0,6.3);g.fill()}};
for(const[k,l,c,n,,,ic]of NT){PI[k]=[l,c,n,'ARAÇ: İçeri gir'];LOGO[k]=(R,C,P,x)=>{x.scale(34,34);x.strokeStyle=x.fillStyle;x.lineWidth=.22;x.lineCap='round';NIC[ic](x)}}
for(const p of PLC)mkBox(p);
const RC={market:[0xdfe6e9,0x2ecc71],ammu:[0x3a3f47,0xe74c3c],clothes:[0xf5e6ff,0x74b9ff],food:[0xffe8c2,0xe67e22],mod:[0x39424e,0xf1c40f],emlak:[0xeeeeee,0x2980b9],home:[0xf5efe6,0xa0522d],casino:[0x2a0a0a,0xffd700],club:[0x1a0a22,0xff2fa8],cafe:[0xf3e3cf,0x8d5a2b],pharm:[0xf4fff8,0x2ecc71],gym:[0x2b2f3a,0xff8844],galeri:[0xe8eef5,0x3498db],garage:[0x3a3f47,0x00d4ff]};
function buildRoom(t){while(ROOM.children.length)ROOM.remove(ROOM.children[0]);DANC.length=0;PLAYS.length=0;MODCAR=null;const[w,c]=RC[t];
 const b=(sx,sy,sz,x,y,z,col,em)=>{const m=new T.Mesh(gBox,em?new T.MeshBasicMaterial({color:col}):M(col));m.scale.set(sx,sy,sz);m.position.set(R0X+x,y,R0Z+z);ROOM.add(m);return m};
 b(26,.2,20,0,-.1,0,t==='club'?0x120a1a:0x9a9ca4);b(26,.3,20,0,4.6,0,w);b(26,4.5,.4,0,2.3,-10,w);b(26,4.5,.4,0,2.3,10,w);b(.4,4.5,20,-13,2.3,0,w);b(.4,4.5,20,13,2.3,0,w);
 b(3,3.4,.2,0,1.7,9.75,0x33ff88,1);b(10,1.1,1.6,0,.55,-5.3,c);b(10.2,.12,1.8,0,1.16,-5.3,0xffffff);
 const pk=[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71,0xe67e22];
 if(t==='market'||t==='ammu')for(let i=-2;i<=2;i++)if(i){b(1.4,1.8,6,i*4.6,.9,2,0x6d6f78);for(let k=0;k<5;k++)b(.9,.5,.9,i*4.6+(k%2?.35:-.35),2.05,-.6+k*1.2,t==='ammu'?0x222222:pk[k%5])}
 if(t==='food')for(let i=0;i<3;i++){b(2,.12,2,-8+i*3.4,.9,3.5,0xffffff);b(.2,.9,.2,-8+i*3.4,.45,3.5,0x555555);b(.7,.5,.7,-8+i*3.4,.25,5,0x8a5a2b)}
 if(t==='clothes')for(let i=0;i<3;i++){const q=mkPed(['#c0392b','#ecf0f1','#d4af37'][i],'#2c3e50','#e0ac69','#2a1c10');q.position.set(R0X-6+i*2.4,0,R0Z-8.6);ROOM.add(q)}
 if(t==='mod'||t==='galeri'||t==='garage'){b(8,.4,5,0,.2,2,0x444a54);if(MD.fast){MODCAR=(t==='galeri'&&MD.alfa?MD.alfa:MD.fast).clone();MODCAR.position.set(R0X,.4,R0Z+2);ROOM.add(MODCAR)}}
 if(t==='club'){const db=new T.Mesh(new T.SphereGeometry(.7,10,8),new T.MeshBasicMaterial({color:0xffffff}));db.position.set(R0X,4,R0Z);ROOM.add(db);MODCAR=db;
  for(let i=0;i<8;i++)b(3,.06,3,-9+(i%4)*6,.02,-3+Math.floor(i/4)*6,[0xff2fa8,0x00d4ff,0x7b2ff7,0xffd23c][i%4],1);
  for(let i=0;i<5;i++){const q=mkPed(['#ff2fa8','#7b2ff7','#00d4ff'][i%3],'#111','#e0ac69','#2a1c10');q.position.set(R0X-6+i*3,0,R0Z+(i%2)*2);q.ph=i;ROOM.add(q);DANC.push(q)}}
 decorRoom(t,b,w,c);const k=mkPed('#3498db','#2c3e50','#c68642','#1b1208','#111',1,1);k.position.set(R0X,0,R0Z-6.9);ROOM.add(k)}
function enterInt(p){if(!p.vis){p.vis=1;P.money+=50;setTimeout(()=>toast('Keşif bonusu +$50'),1200)}INT={t:p.t,n:p.n,rx:P.x,rz:P.z};buildRoom(p.t);P.x=R0X;P.z=R0Z+5;P.a=Math.PI;yaw=Math.PI;IL.intensity=p.t==='club'?1.6:1.3;IL.color.set(p.t==='club'?0xff2fa8:0xfff2d0);toast(p.n)}
function exitInt(){P.x=INT.rx;P.z=INT.rz;INT=null;IL.intensity=0;yaw=0}
const heal=n=>{P.hp=Math.min(100,P.hp+n);toast('+'+n+' can')},dress=(a,b)=>{P.mesh.mats[0].color.set(a);P.mesh.mats[1].color.set(b);if(P.mesh.glb)P.mesh.mats.forEach(m=>m.color.multiplyScalar(2.4))},
 modPaint=n=>{const c=P.last;if(!c||!c.glb||c.cop){toast('Önce bir GLB araba sür');return false}paint(c,COLN.indexOf(n));toast('Boyandı: '+n)},
 modEng=()=>{const c=P.last;if(!c){toast('Önce bir araba sür');return false}c.mx=42;toast('Motor +%25')};
const SH={market:[['Su',10,()=>heal(10)],['Sandviç',25,()=>heal(35)],['Sağlık paketi',60,()=>heal(100)],['Kurşun yeleği',150,()=>{P.arm=1;toast('Yelek takıldı: hasar yarı')}]],
 ammu:[['SMG',600,()=>{P.own[1]=1;toast('SMG alındı (SİLAH düğmesi)')}],['Bazuka',2500,()=>{P.own[3]=1;toast('Bazuka alındı!')}],['Pompalı',900,()=>{P.own[2]=1;toast('Pompalı alındı')}],['Hasar +%30',400,()=>{P.dm=1.3;toast('Hasar arttı')}]],
 clothes:[['Siyah takım',80,()=>dress('#1b1b1d','#59693f')],['Kırmızı ceket',100,()=>dress('#c0392b','#2c3e50')],['Beyaz takım',120,()=>dress('#ecf0f1','#bdc3c7')],['Altın ceket',400,()=>dress('#d4af37','#1b1b1d')]],
 food:[['Burger',20,()=>heal(25)],['Kebap',45,()=>heal(60)],['Lüks menü',120,()=>heal(100)]],
 mod:[...['kirmizi','mavi','sari','yesil','beyaz','siyah','mor','turuncu'].map(n=>['Boya: '+n,150,()=>modPaint(n)]),['Motor +%25',800,()=>modEng()]],
 emlak:[['2 katlı ev  (5.000)',5000,()=>{P.home=2;toast('Ev aldın: "Evim" yerine git')}],['Şık tek katlı ev (10.000)',10000,()=>{P.home=1;toast('Şık ev aldın: "Evim" yerine git')}]],
 home:[['Uyu (+8 saat)',0,()=>{hour=(hour+8)%24;P.hp=100;toast('İyi uyudun')}],['Yemek ye',20,()=>heal(60)],['Duş al',0,()=>heal(10)],['Kıyafet: siyah',0,()=>dress('#1b1b1d','#222')],['Kıyafet: kırmızı',0,()=>dress('#c0392b','#2c3e50')],['Kıyafet: takım',0,()=>dress('#2c2c34','#111')]],
 casino:[['Bahis $100',100,()=>bet(100)],['Bahis $500',500,()=>bet(500)],['Bahis $2000',2000,()=>bet(2000)]],club:[['İçki',40,()=>{drunk=20;toast('Kafa güzel...')}],['VIP şişe',250,()=>{drunk=45;heal(100)}],['Dans et',0,()=>toast('Sahne senin!')]],
 cafe:[['Kahve',15,()=>{P.boost=60;toast('Enerji! 60 sn hızlısın')}],['Çay',8,()=>heal(8)],['Tost',30,()=>heal(30)],['Espresso x3',45,()=>{P.boost=150;toast('Süper enerji')}]],
 pharm:[['Ağrı kesici',40,()=>heal(50)],['Antibiyotik',90,()=>heal(100)],['Vitamin',60,()=>{P.boost=90;heal(20)}]],
 gym:[['Koşu bandı',100,()=>{P.boost=180;toast('Kondisyon arttı')}],['Güç antrenmanı',300,()=>{P.dm=(P.dm||1)*1.2;toast('Hasar +%20')}],['Protein',50,()=>heal(40)]],
 galeri:[['Araba: kırmızı',1500,()=>buyCar('kirmizi')],['Araba: siyah',2000,()=>buyCar('siyah')],['Araba: altın',3500,()=>buyCar('altin')],['Araba: fuşya',2500,()=>buyCar('fusya')],['Kamyon',3000,()=>buyCar('turuncu',5)],['Otobüs',4500,()=>buyCar('sari',6)],['Alfa Romeo Giulia: kırmızı',9000,()=>buyAlfa('#8b0000','kırmızı')],['Alfa Romeo Giulia: beyaz',9000,()=>buyAlfa('#e8e8e8','beyaz')],['Alfa Romeo Giulia: siyah',9500,()=>buyAlfa('#151515','siyah')],['Alfa Romeo Giulia: mavi',9500,()=>buyAlfa('#1f3a8a','mavi')],['Alfa MiTo',7000,()=>buyMdl('mito','Alfa MiTo')],['Spor araba',12000,()=>buyMdl('sport','Spor araba')],['Moskvich 412',2500,()=>buyMdl('moskvich','Moskvich 412')]],
 garage:[['Berrari çal  ★5 (2 koltuk)',0,()=>gcar('ber',5,'Berrari')],['CMW çal  ★4 (4 koltuk)',0,()=>gcar('cmw',4,'CMW')],['Kercedes çal  ★3 (4 koltuk)',0,()=>gcar('ker',3,'Kercedes')],['F1 çal  ★3 (1 koltuk)',0,()=>gcar('f1',3,'F1')],['Bajaj Pulsar çal  ★2',0,()=>gcar('saz',2,'Sazuki')],['Helikopter çal  ★5 (4 koltuk)',0,()=>gcar('heli',5,'Helikopter')],['Uçak çal  ★5 (2 koltuk)',0,()=>gcar('plane',5,'Uçak')],
 ['Berrari satın al',60000,()=>gcar('ber',0,'Berrari')],['CMW satın al',30000,()=>gcar('cmw',0,'CMW')],['Kercedes satın al',25000,()=>gcar('ker',0,'Kercedes')],['F1 satın al',90000,()=>gcar('f1',0,'F1')],['Bajaj Pulsar satın al',9000,()=>gcar('saz',0,'Sazuki')],['Helikopter satın al',120000,()=>gcar('heli',0,'Helikopter')],['Uçak satın al',100000,()=>gcar('plane',0,'Uçak')],['Aracımı getir',0,()=>{const L=P.last;if(!L||L.dead){toast('Önce bir araç kullan');return false}L.x=INT.rx+7;L.z=INT.rz+7;L.hp=100;fixCar(L);L.v=0;toast('Araç kapıda, tamir edildi')}],['Tam tamir',100,()=>{const c=P.last;if(!c||c.dead){toast('Araç yok');return false}c.hp=100;fixCar(c);toast('Tamir edildi')}],['Motor +%25',800,()=>modEng()],['Nitro',1200,()=>{const c=P.last;if(!c){toast('Araç yok');return false}c.mx=60;toast('Nitro takıldı')}]]};
function openShop(t){mode='shop';J.x=J.y=0;B.fire=0;$('shop').classList.remove('hid');$('stt').textContent=INT.n;renderShop(t)}
function renderShop(t){$('smn').textContent='$'+P.money;$('sit').innerHTML='';for(const[n,pr,fn]of SH[t]){const b=document.createElement('button');b.className='mb';b.textContent=n+(pr?'  $'+pr:'');b.onclick=()=>{if(P.money<pr)return toast('Paran yetmiyor');P.money-=pr;if(fn()===false)P.money+=pr;renderShop(t)};$('sit').appendChild(b)}}
$('sx').onclick=()=>{mode='play';$('shop').classList.add('hid')};
function nearPl(){if(mode!=='play')return null;if(INT){if(Math.hypot(P.x-R0X,P.z-R0Z-8.6)<3)return{p:'ARAÇ: Çıkış',go:exitInt};if(Math.hypot(P.x-R0X,P.z-R0Z+5.3)<4.5)return{p:'ARAÇ: '+INT.n+' — alışveriş',go:()=>openShop(INT.t)};{const q=PLAYS.find(s=>Math.hypot(P.x-R0X-s.x,P.z-R0Z-s.z)<s.r);if(q)return{p:'ARAÇ: '+q.l,go:q.go}}return null}
 if(P.car)return null;for(const p of PLC)if(Math.hypot(P.x-p.dx,P.z-p.dz)<4.2)return{p:p.n+' — '+PI[p.t][3],go:()=>placeAct(p)};return null}
function placeAct(p){if(p.t==='chat')return openChat();if(p.t==='home'&&!P.home)return toast('Önce Emlak\'tan ev satın al');if(SH[p.t])enterInt(p);else startJob(p)}
const JBS={pizza:['courier','Pizza kuryesi',1.4],cargo:['taxi','Nakliye',2],bus:['taxi','Otobüs şoförü',1.6],mail:['courier','Postacı',1.2],tow:['courier','Çekici',1.8],garbage:['factory','Çöpçü',1.3]};
function startJob(p){if(TJ){TJ=null;tjM.visible=false;return toast('İş bitti')}
 if(p.t==='race'){TJ={k:'race',nm:'Yarış',n:5,x:-318+70,z:208};return toast('Yarış başladı! Kontrol noktalarını geç (araçla)')}
 const jb=JBS[p.t];if(jb)p={...p,t:jb[0],jn:jb};
 if(p.t==='taxi'){const q=spawnPt(70,260)||[-45,100];TJ={k:'taxi',st:'pickup',x:q[0],z:q[1],nm:p.jn&&p.jn[1],mul:p.jn&&p.jn[2]};toast('Taksi: yolcuyu al (araçla)')}
 else if(p.t==='courier'){const q=spawnPt(60,300)||[-45,100];TJ={k:'kur',st:'pickup',x:q[0],z:q[1],nm:p.jn&&p.jn[1],mul:p.jn&&p.jn[2]};toast('Kurye: paketi al')}
 else{TJ={k:'fab',st:'pick',n:5,px:p.x-34,pz:p.z,dx:p.x+34,dz:p.z,x:p.x-34,z:p.z,nm:p.jn&&p.jn[1]};toast('Fabrika: kasaları taşı (yaya)')}}
function updTJ(dt){if(WPT&&Math.hypot(P.x-WPT.x,P.z-WPT.z)<9){WPT=null;wpM.visible=false;toast('Hedefe vardın')}
 if(!TJ)return;tjM.visible=true;tjM.position.set(TJ.x,30,TJ.z);const d=Math.hypot(P.x-TJ.x,P.z-TJ.z),pay=(a,b)=>{const m=Math.round((a+Math.hypot(TJ.x-TJ.sx,TJ.z-TJ.sz)*b)*(TJ.mul||1));P.money+=m;toast('Ücret +$'+m);tone(880,.25,'triangle',.08)},
  nx=(a,b)=>{const q=spawnPt(a,b)||[TJ.x+100,TJ.z];TJ.sx=TJ.x;TJ.sz=TJ.z;TJ.x=q[0];TJ.z=q[1]};
 if(TJ.k==='race'){if(P.car&&d<14){TJ.n--;if(TJ.n<=0){P.money+=1500;toast('Yarış bitti +$1500');TJ=null;tjM.visible=false;return}const a=TJ.n*1.256;TJ.x=-318+Math.cos(a)*70;TJ.z=208+Math.sin(a)*70;toast('Kontrol noktası! '+TJ.n+' kaldı')}return}
 if(TJ.k==='taxi'&&P.car&&d<8){if(TJ.st==='pickup'){TJ.st='drop';nx(150,380);toast('Yolcu bindi! Hedefe götür')}else{pay(120,.6);nx(70,260);TJ.st='pickup'}}
 else if(TJ.k==='kur'&&d<7){if(TJ.st==='pickup'){TJ.st='drop';nx(100,380);toast('Paketi teslim et')}else{pay(100,.5);nx(60,300);TJ.st='pickup'}}
 else if(TJ.k==='fab'&&!P.car&&d<4){if(TJ.st==='pick'){TJ.st='drop';TJ.x=TJ.dx;TJ.z=TJ.dz;toast('Kasayı banda bırak')}else{P.money+=100;TJ.n--;tone(880,.2,'triangle',.07);if(TJ.n<=0){P.money+=200;toast('Vardiya bitti +$300');TJ=null;tjM.visible=false;return}TJ.st='pick';TJ.x=TJ.px;TJ.z=TJ.pz;toast('Kasa: '+TJ.n+' kaldı')}}}
const NODES=[],ADJ=[];
(function(){const key=new Map(),nd=(x,z)=>{const k=Math.round(x)+','+Math.round(z);let i=key.get(k);if(i===undefined){i=NODES.length;key.set(k,i);NODES.push([x,z]);ADJ.push([])}return i};
 for(const r of roads)r.n=[];
 for(const a of roads)if(a.ax==='z')for(const b of roads)if(b.ax==='x'&&a.c>b.a0-1&&a.c<b.a1+1&&b.c>a.a0-1&&b.c<a.a1+1){const i=nd(a.c,b.c);a.n.push([b.c,i]);b.n.push([a.c,i])}
 for(const r of roads){const z=r.ax==='z';r.n.push([r.a0,z?nd(r.c,r.a0):nd(r.a0,r.c)],[r.a1,z?nd(r.c,r.a1):nd(r.a1,r.c)]);r.n.sort((p,q)=>p[0]-q[0]);for(let i=1;i<r.n.length;i++){const u=r.n[i-1],v=r.n[i];if(u[1]!==v[1]){const w=Math.abs(v[0]-u[0]);ADJ[u[1]].push([v[1],w]);ADJ[v[1]].push([u[1],w])}}}})();
function route(sx,sz,tx,tz){const tmp=[],att=(x,z)=>{let bs=null,bd=1e9;for(const r of roads){const al=r.ax==='z'?z:x,cr=r.ax==='z'?x:z,pa=clamp(al,r.a0,r.a1),d=Math.hypot(cr-r.c,al-pa);if(d<bd){bd=d;bs={r,pa}}}
  const r=bs.r,pa=bs.pa,i=NODES.length;NODES.push(r.ax==='z'?[r.c,pa]:[pa,r.c]);ADJ.push([]);tmp.push(i);let lo=null,hi=null;
  for(const q of r.n){if(q[0]<=pa&&(!lo||q[0]>lo[0]))lo=q;if(q[0]>=pa&&(!hi||q[0]<hi[0]))hi=q}
  for(const q of[lo,hi])if(q){const w=Math.abs(q[0]-pa);ADJ[i].push([q[1],w]);ADJ[q[1]].push([i,w])}return i};
 const a=att(sx,sz),b=att(tx,tz),n=NODES.length,D=new Float32Array(n).fill(1e9),Pv=new Int32Array(n).fill(-1),Dn=new Uint8Array(n);D[a]=0;
 for(;;){let u=-1,m=1e9;for(let i=0;i<n;i++)if(!Dn[i]&&D[i]<m){m=D[i];u=i}if(u<0||u===b)break;Dn[u]=1;for(const e of ADJ[u]){if(D[u]+e[1]<D[e[0]]){D[e[0]]=D[u]+e[1];Pv[e[0]]=u}}}
 const pts=[];for(let u=b;u>=0;u=Pv[u])pts.push(NODES[u]);pts.reverse();
 for(const i of tmp)for(const e of ADJ[i]){const l=ADJ[e[0]];for(let k=l.length-1;k>=0;k--)if(l[k][0]===i)l.splice(k,1)}NODES.length-=2;ADJ.length-=2;
 return[[sx,sz],...pts,[tx,tz]]}
const RIB=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xff2fa8,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide})),RN2=500;RIB.userData.ns=1;RIB.frustumCulled=false;RIB.renderOrder=5;scene.add(RIB);
RIB.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(RN2*12),3));RIB.geometry.setIndex(Array.from({length:RN2},(_,i)=>[i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3]).flat());RIB.geometry.setDrawRange(0,0);
let RT=[],RK=null,routeT=0;
function setRoute(pts,col){RT=pts;RIB.material.color.set(col);const a=RIB.geometry.attributes.position.array;let n=0;
 for(let i=1;i<pts.length&&n<RN2;i++){const x1=pts[i-1][0],z1=pts[i-1][1],x2=pts[i][0],z2=pts[i][1],dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz);if(l<.5)continue;const nx=-dz/l*1.1,nz=dx/l*1.1;a.set([x1+nx,.15,z1+nz,x1-nx,.15,z1-nz,x2-nx,.15,z2-nz,x2+nx,.15,z2+nz],n*12);n++}
 RIB.geometry.attributes.position.needsUpdate=true;RIB.geometry.setDrawRange(0,n*6)}
function tgt(){return WPT?{x:WPT.x,z:WPT.z,c:0xff2fa8}:TJ?{x:TJ.x,z:TJ.z,c:0x00ffff}:ms[mi]?{x:ms[mi].x,z:ms[mi].z,c:0xffd23c}:null}
function updRoute(dt){routeT-=dt;const t=tgt();if(!t){if(RT.length){RT=[];RIB.geometry.setDrawRange(0,0)}return}if(routeT<=0||!RK||RK.x!==t.x||RK.z!==t.z){routeT=1.5;RK=t;setRoute(route(P.x,P.z,t.x,t.z),t.c)}}
const ICO={cart:(g,c)=>{g.beginPath();g.moveTo(-.9,-.6);g.lineTo(-.55,-.6);g.lineTo(-.25,.35);g.lineTo(.7,.35);g.lineTo(.9,-.3);g.lineTo(-.5,-.3);g.fill();g.beginPath();g.arc(-.1,.7,.16,0,6.3);g.arc(.6,.7,.16,0,6.3);g.fill()},
 cup:g=>{g.beginPath();g.moveTo(-.6,-.4);g.lineTo(.5,-.4);g.lineTo(.4,.6);g.lineTo(-.5,.6);g.fill();g.beginPath();g.arc(.65,0,.28,-1.5,1.5);g.stroke()},
 fork:g=>{for(const x of[-.6,-.4,-.2]){g.beginPath();g.moveTo(x,-.8);g.lineTo(x,-.1);g.stroke()}g.beginPath();g.moveTo(-.6,-.1);g.lineTo(-.2,-.1);g.stroke();g.beginPath();g.moveTo(-.4,-.1);g.lineTo(-.4,.8);g.stroke();g.beginPath();g.moveTo(.4,-.8);g.lineTo(.4,.8);g.lineTo(.62,.8);g.lineTo(.62,-.2);g.quadraticCurveTo(.8,-.6,.4,-.8);g.fill()},
 gun:g=>{g.beginPath();g.moveTo(-.9,-.3);g.lineTo(.8,-.3);g.lineTo(.8,.05);g.lineTo(-.05,.05);g.lineTo(-.25,.8);g.lineTo(-.6,.8);g.lineTo(-.5,.05);g.lineTo(-.9,.05);g.fill()},
 shirt:g=>{g.beginPath();g.moveTo(-.4,-.8);g.lineTo(-.95,-.4);g.lineTo(-.65,0);g.lineTo(-.5,-.1);g.lineTo(-.5,.8);g.lineTo(.5,.8);g.lineTo(.5,-.1);g.lineTo(.65,0);g.lineTo(.95,-.4);g.lineTo(.4,-.8);g.quadraticCurveTo(0,-.4,-.4,-.8);g.fill()},
 gear:(g,c)=>{g.beginPath();for(let i=0;i<16;i++){const a=i/16*6.283,rr=i%2?.62:.95;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fill();g.fillStyle=c;g.beginPath();g.arc(0,0,.3,0,6.3);g.fill()},
 car:(g,c)=>{g.beginPath();g.moveTo(-.95,.35);g.lineTo(-.95,-.1);g.lineTo(-.55,-.15);g.lineTo(-.3,-.6);g.lineTo(.4,-.6);g.lineTo(.65,-.15);g.lineTo(.95,-.1);g.lineTo(.95,.35);g.fill();for(const x of[-.5,.5]){g.fillStyle=c;g.beginPath();g.arc(x,.38,.3,0,6.3);g.fill();g.fillStyle='#10131c';g.beginPath();g.arc(x,.38,.19,0,6.3);g.fill()}},
 glass:g=>{g.beginPath();g.moveTo(-.85,-.8);g.lineTo(.85,-.8);g.lineTo(0,.1);g.fill();g.beginPath();g.moveTo(0,.1);g.lineTo(0,.8);g.moveTo(-.4,.8);g.lineTo(.4,.8);g.stroke()},
 box:(g,c)=>{g.fillRect(-.75,-.55,1.5,1.25);g.fillStyle=c;g.fillRect(-.08,-.55,.16,1.25)},
 cross:g=>{g.fillRect(-.22,-.85,.44,1.7);g.fillRect(-.85,-.22,1.7,.44)},
 dumb:g=>{g.fillRect(-.95,-.5,.28,1);g.fillRect(.67,-.5,.28,1);g.fillRect(-.65,-.7,.2,1.4);g.fillRect(.45,-.7,.2,1.4);g.fillRect(-.5,-.12,1,.24)},
 fact:g=>{g.beginPath();g.moveTo(-.95,.8);g.lineTo(-.95,-.1);g.lineTo(-.45,-.4);g.lineTo(-.45,-.1);g.lineTo(.05,-.4);g.lineTo(.05,-.1);g.lineTo(.55,-.4);g.lineTo(.55,-.85);g.lineTo(.95,-.85);g.lineTo(.95,.8);g.fill()},
 home:(g,c)=>{g.beginPath();g.moveTo(-.95,-.1);g.lineTo(0,-.9);g.lineTo(.95,-.1);g.fill();g.fillRect(-.65,-.1,1.3,.9);g.fillStyle=c;g.fillRect(-.16,.25,.32,.55)},
 flag:g=>{g.beginPath();g.moveTo(-.5,-.9);g.lineTo(-.5,.9);g.stroke();g.beginPath();g.moveTo(-.5,-.8);g.lineTo(.85,-.35);g.lineTo(-.5,.1);g.fill()},
 diamond:g=>{g.beginPath();g.moveTo(0,-.9);g.lineTo(.8,0);g.lineTo(0,.9);g.lineTo(-.8,0);g.fill()},
 dot:g=>{g.beginPath();g.arc(0,0,.4,0,6.3);g.fill()}};
const IMAP={market:'cart',cafe:'cup',food:'fork',ammu:'gun',clothes:'shirt',mod:'gear',garage:'gear',galeri:'car',taxi:'car',club:'glass',courier:'box',pharm:'cross',gym:'dumb',factory:'fact',home:'home',wp:'flag',job:'diamond'};
function drawIc(g,t,col,x,y,r){g.save();g.translate(x,y);g.fillStyle='#10131c';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(0,0,r,0,6.3);g.fill();g.stroke();g.fillStyle=col;g.beginPath();g.arc(0,0,r-1.6,0,6.3);g.fill();
 g.scale(r*.62,r*.62);g.fillStyle='#10131c';g.strokeStyle='#10131c';g.lineWidth=.24;g.lineCap='round';(ICO[IMAP[t]]||ICO.dot)(g,col);g.restore()}
const pts=()=>[...PLC.map(p=>({x:p.dx,z:p.dz,c:PI[p.t][1],l:PI[p.t][0],t:p.t})),...(WPT?[{x:WPT.x,z:WPT.z,c:'#ff2fa8',l:'',t:'wp'}]:[]),...(TJ?[{x:TJ.x,z:TJ.z,c:'#0ff',l:'',t:'job'}]:[])];
/* ---------- full map + camera ---------- */
let fp=0;$('cv').onclick=()=>{fp^=1;toast(fp?'Birinci şahıs':'Üçüncü şahıs')};
let MZ={s:1,ox:0,oy:0};const fcv=$('fc'),fg=fcv.getContext('2d');
function drawMap(){const k=Math.min(innerWidth/MMc.width,innerHeight/MMc.height),w=MMc.width*k,h=MMc.height*k;fcv.width=w;fcv.height=h;fg.setTransform(MZ.s,0,0,MZ.s,MZ.ox,MZ.oy);const iz=1/MZ.s;fg.drawImage(MMc,0,0,w,h);for(const q of MATES){fg.fillStyle=q.c;fg.beginPath();fg.arc((q.x-mnx)*MS*k,(q.z-mnz)*MS*k,7*iz,0,TAU);fg.fill();fg.strokeStyle='#fff';fg.lineWidth=2*iz;fg.stroke()}
 const X=x=>(x-mnx)/(mxx-mnx)*w,Y=z=>(z-mnz)/(mxz-mnz)*h;
 if(RT.length>1){fg.strokeStyle='#'+RIB.material.color.getHexString();fg.lineWidth=3*iz;fg.beginPath();RT.forEach((q,i)=>{i?fg.lineTo(X(q[0]),Y(q[1])):fg.moveTo(X(q[0]),Y(q[1]))});fg.stroke()}
 for(const c of cars)if(c.cop&&!c.dead){fg.fillStyle='#f22';fg.fillRect(X(c.x)-3*iz,Y(c.z)-3*iz,6*iz,6*iz)}
 if(HS)drawIc(fg,'home',HS.own?'#3f3':'#fff',X(HS.x),Y(HS.z),6*iz)
 for(const d of pts())drawIc(fg,d.t,d.c,X(d.x),Y(d.z),6*iz)
 const m=ms[mi];if(m){fg.fillStyle='#ffd23c';fg.beginPath();fg.arc(X(m.x),Y(m.z),7*iz,0,TAU);fg.fill();fg.strokeStyle='#000';fg.lineWidth=iz;fg.stroke()}
 fg.save();fg.translate(X(P.x),Y(P.z));fg.scale(iz,iz);fg.rotate(Math.PI-(P.car?P.car.a:P.a));fg.fillStyle='#fff';fg.strokeStyle='#000';fg.beginPath();fg.moveTo(0,-10);fg.lineTo(7,8);fg.lineTo(-7,8);fg.closePath();fg.fill();fg.stroke();fg.restore()}
function mapT(){if(mode==='play'){mode='map';MZ={s:1,ox:0,oy:0};try{drawMap()}catch(e){console.warn(e)};show('');$('fm').classList.remove('hid');J.x=J.y=0;B.fire=0}else if(mode==='map'){mode='play';$('fm').classList.add('hid')}}
document.addEventListener('pointerdown',e=>{if(mode!=='play')return;const r=$('mm').getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){e.preventDefault();e.stopPropagation();mapT()}},true);$('fx').onclick=mapT;
{const fl=$('fl'),fli=$('fli'),fb=$('fmn');let built=0;
 const focusPl=p=>{const w=fcv.width,h=fcv.height,X=(p.dx-mnx)/(mxx-mnx)*w,Y=(p.dz-mnz)/(mxz-mnz)*h;MZ.s=3.2;MZ.ox=w/2-X*MZ.s;MZ.oy=h/2-Y*MZ.s;mzClamp();WPT={x:p.dx,z:p.dz};wpM.visible=true;wpM.position.set(p.dx,30,p.dz);toast(p.n+' işaretlendi');drawMap();fl.classList.add('hid');fb.textContent='▼'};
 const build=()=>{built=1;fli.innerHTML='';for(const p of[...PLC].sort((a,b)=>a.n.localeCompare(b.n,'tr'))){const d=document.createElement('div');d.className='fit';const c=document.createElement('canvas');c.width=c.height=32;try{drawIc(c.getContext('2d'),p.t,PI[p.t][1],16,16,14)}catch(e){}const sp=document.createElement('span');sp.textContent=p.n;d.append(c,sp);d.onclick=()=>focusPl(p);fli.appendChild(d)}};
 fb.onclick=()=>{if(!built)build();const o=fl.classList.toggle('hid');fb.textContent=o?'▼':'▲'};}
const mzClamp=()=>{const w=fcv.width,h=fcv.height;MZ.s=Math.max(1,Math.min(7,MZ.s));MZ.ox=Math.min(0,Math.max(w-w*MZ.s,MZ.ox));MZ.oy=Math.min(0,Math.max(h-h*MZ.s,MZ.oy))};
const mzAt=(cx,cy,f)=>{const s0=MZ.s;MZ.s=Math.max(1,Math.min(7,s0*f));const r=MZ.s/s0;MZ.ox=cx-(cx-MZ.ox)*r;MZ.oy=cy-(cy-MZ.oy)*r;mzClamp();drawMap()};
const mzPt=ev=>{const q=fcv.getBoundingClientRect();return[(ev.clientX-q.left)/q.width*fcv.width,(ev.clientY-q.top)/q.height*fcv.height]};
const mzTap=e=>{const[cx,cy]=mzPt(e),x=mnx+((cx-MZ.ox)/MZ.s)/fcv.width*(mxx-mnx),z=mnz+((cy-MZ.oy)/MZ.s)/fcv.height*(mxz-mnz);if(TAXI&&TAXI.pick&&P.car===TAXI.car)return taxiGo(x,z);
 if(WPT&&Math.hypot(WPT.x-x,WPT.z-z)<25/MZ.s){WPT=null;wpM.visible=false;toast('İşaret silindi')}else{WPT={x,z};wpM.visible=true;wpM.position.set(x,30,z);toast('İşaret konuldu')}drawMap()};
{const PT=new Map();let pin=null,mv_=0,x0_=0,y0_=0;
 fcv.addEventListener('pointerdown',e=>{try{fcv.setPointerCapture(e.pointerId)}catch(_){}PT.set(e.pointerId,[e.clientX,e.clientY]);if(PT.size===1){mv_=0;x0_=e.clientX;y0_=e.clientY}if(PT.size===2){const[a,b]=[...PT.values()];pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,s:MZ.s}}});
 fcv.addEventListener('pointermove',e=>{const pv=PT.get(e.pointerId);if(!pv)return;
  if(PT.size===1){if(Math.hypot(e.clientX-x0_,e.clientY-y0_)>8)mv_=1;if(mv_){const q=fcv.getBoundingClientRect();MZ.ox+=(e.clientX-pv[0])/q.width*fcv.width;MZ.oy+=(e.clientY-pv[1])/q.height*fcv.height;mzClamp();drawMap()}}
  PT.set(e.pointerId,[e.clientX,e.clientY]);
  if(PT.size===2&&pin){mv_=1;const[a,b]=[...PT.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),m=mzPt({clientX:(a[0]+b[0])/2,clientY:(a[1]+b[1])/2});mzAt(m[0],m[1],pin.s*d/pin.d/MZ.s)}});
 const up=e=>{if(!PT.has(e.pointerId))return;const was=PT.size;PT.delete(e.pointerId);if(PT.size<2)pin=null;if(was===1&&!mv_&&e.type==='pointerup')mzTap(e)};
 fcv.addEventListener('pointerup',up);fcv.addEventListener('pointercancel',up);
 fcv.addEventListener('wheel',e=>{e.preventDefault();const m=mzPt(e);mzAt(m[0],m[1],e.deltaY<0?1.25:.8)},{passive:false});
 $('fzp').onclick=()=>mzAt(fcv.width/2,fcv.height/2,1.4);$('fzm').onclick=()=>mzAt(fcv.width/2,fcv.height/2,1/1.4);
 addEventListener('keydown',e=>{if(mode!=='map')return;if(e.key==='+'||e.key==='=')$('fzp').click();if(e.key==='-'||e.key==='_')$('fzm').click()})}
addEventListener('keydown',e=>{if(e.code==='KeyM')mapT();if(e.code==='KeyV')$('cv').click();if(e.code==='Backquote')cmdOpen()});
/* ---------- CMD ---------- */
const clog=$('clog'),cin=$('cin');
const say=t=>{const d=document.createElement('div');d.textContent=t;clog.appendChild(d);clog.scrollTop=1e5};
function cmdOpen(){if(mode==='cmd'){mode='play';$('cmd').classList.add('hid');return}if(mode!=='play')return;mode='cmd';$('cmd').classList.remove('hid');J.x=J.y=0;B.fire=0;if(!clog.childNodes.length)say('GTA 67 konsol — /help');setTimeout(()=>cin.focus(),60)}
$('cb').onclick=cmdOpen;$('cx').onclick=cmdOpen;
cin.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){const v=cin.value.trim();cin.value='';if(v){say('> '+v);runCmd(v)}}});
const SPAL={helicopter:'heli',helikopter:'heli',helikop:'heli',ucak:'plane','uçak':'plane',airplane:'plane',jet:'plane',ucakk:'plane',polis:'police-car',police:'police-car',otobus:'bus','otobüs':'bus',kamyon:'truck',motor:'bajaj',motosiklet:'bajaj',moto:'bajaj',giulia:'alfa',spor:'sport',araba:'car',moskvic:'moskvich',moskvi:'moskvich',ferrari:'berrari',bmw:'cmw',mercedes:'kercedes',suzuki:'sazuki'};
(()=>{const w=$('cchips');if(!w)return;for(const [n,k] of [['Helikopter','heli'],['Uçak','plane'],['Alfa Giulia','alfa'],['Alfa MiTo','mito'],['Spor','sport'],['Moskvich','moskvich'],['Bajaj Motor','bajaj'],['Otobüs','bus'],['Kamyon','truck'],['Polis','police-car'],['Berrari','berrari'],['CMW','cmw'],['F1','f1']]){const b=document.createElement('button');b.textContent=n;b.onclick=()=>{say('> /spawn '+k);runCmd('/spawn '+k)};w.appendChild(b)}})();
function runCmd(v){const a=v.replace(/^\//,'').split(/\s+/),c=a[0].toLowerCase(),x0=(a[1]||'').toLowerCase(),x=c==='spawn'?(SPAL[x0]||x0):x0,n=+a[1];
 const C={
  help:()=>{say('/spawn police-car | car | bus | truck | berrari | cmw | kercedes | bajaj | alfa | mito | sport | moskvich | f1 | heli | plane   /money N   /wanted 0-5   /tp yer   /heal   /weapons');say('/time 0-24   /weather rain|clear   /turbo   /fix   /gps x z   /where   /cars   /clear   /home');say('/armor /day /night /nitro /speed N /color renk /tpm /boost /unlock /radio   /secret ???  (ipucu: all-weapons, fast-run, unlimited-health, god-mode, rich, tank, ghost-cops, slowmo, hyper-speed, disco, nightcity, off)')},
  spawn:()=>{const fx=Math.sin(P.a),fz=Math.cos(P.a),px=P.x+fx*7,pz=P.z+fz*7,ci=COLN.indexOf((a[2]||'').toLowerCase());let k;
   if(x==='police-car')k=mkCar(4,'#f4f4f4',px,pz,P.a);else if(x==='moskvich'||x==='clio'||x==='volvo'||x==='alfa'||x==='mito'||x==='sport'){k=mkCar(0,'#c0392b',px,pz,P.a);if(k.mroot){k.m.remove(k.mroot);k.glb=0}k.mdl=x;if(!MD[x])return say(x+' modeli yükleniyor, tekrar dene');skin(k)}else if(VT[x])k=mkVeh(VT[x],px,pz,P.a);else if(x==='bus')k=mkCar(6,'#2e86de',px,pz,P.a);else if(x==='truck')k=mkCar(5,'#e67e22',px,pz,P.a);else if(x==='good-glb-car'||x==='car'||!x){k=mkCar(x==='good-glb-car'?1:(R()<.5?0:1),'#c0392b',px,pz,P.a);paint(k,ci>=0?ci:R()*20|0)}else return say('spawn: heli | plane | police-car | car | alfa | mito | sport | moskvich | clio | volvo | bajaj | bus | truck | berrari | cmw | kercedes | f1');
   k.ai=0;say('araç hazır'+(k.glb?'':' (model yükleniyor, kutu araç)'))},
  money:()=>{if(isNaN(n))return say('/money 5000');P.money+=n;say('+$'+n)},
  wanted:()=>{P.heat=clamp(n||0,0,5)*30;say('aranma '+(n||0))},
  tp:()=>{const nz=v=>String(v||'').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/-/g,' ').trim(),xx=nz(x),mm=PLC.filter(p=>p.t===xx||nz(p.n)===xx),mm2=mm.length?mm:PLC.filter(p=>nz(p.n).startsWith(xx)||nz(p.t)===xx),mm3=mm2.length?mm2:(xx.length>2?PLC.filter(p=>nz(p.n).includes(xx)):[]),q=mm3[Math.max(0,(+a[2]||1)-1)]||mm3[0]||{spor:{x:-300,z:-405},drift:{x:-318,z:-300},yaris:{x:-318,z:208},koy:{x:867,z:-45},guney:{x:-109,z:387},dag:{x:-109,z:-375},vadi:{x:557,z:-45},sahil:{x:-281,z:-45},liman:{x:-96,z:192},sanayi:{x:509,z:193},merkez:{x:-45,z:-45},banliyo:{x:358,z:-70}}[x];if(!q){say('/tp <yer> [sıra]  örn: /tp galeri 2');say('Mekanlar: '+[...new Set(PLC.map(p=>nz(p.n).replace(/ /g,'-')))].join(' '));return say('Bölgeler: dag vadi sahil liman sanayi merkez banliyo koy guney spor drift yaris')}
   if(INT)exitInt();P.x=q.dx!==undefined?q.dx-3:q.x+3;P.z=q.dx!==undefined?q.dz:q.z+3;for(let i=0;i<25&&hitB(P.x,P.z,1);i++)P.x-=2;if(P.car){P.car.x=P.x;P.car.z=P.z}say('ışınlandın')},
  fly:()=>{P.fly=1;say('[+] uçuş modu AÇIK')},unfly:()=>{P.fly=0;say('[-] uçuş modu kapalı')},luck:()=>{LK=!LK;say('[*] şans modu '+(LK?'AÇIK (kumarda %90)':'kapalı'))},phone:()=>openPh(),
  heal:()=>{P.hp=100;say('can dolu')},
  weapons:()=>{P.own=[1,1,1,1];say('tüm silahlar')},
  time:()=>{hour=(isNaN(n)?12:clamp(n,0,24))%24;say('saat '+hour)},
  weather:()=>{S.rain=x==='rain'?2:x==='clear'?0:1;say('hava '+x);lbl()},
  turbo:()=>{const c=P.car||P.last;if(!c)return say('araç yok');c.mx=70;say('turbo!')},
  cars:()=>say(COLN.join(', ')),
  clear:()=>{clog.innerHTML=''},
  armor:()=>{P.arm=1;say('yelek takıldı')},day:()=>{hour=12;say('gündüz')},night:()=>{hour=0;say('gece')},
  nitro:()=>{const c=P.car||P.last;if(!c)return say('araç yok');c.mx=60;say('nitro')},
  speed:()=>{const c=P.car||P.last;if(!c||isNaN(n))return say('/speed 30-90');c.mx=clamp(n,10,120);say('hız sınırı '+c.mx)},
  color:()=>{const c=P.car||P.last,i=COLN.indexOf(x);if(!c||i<0)return say('renkler: '+COLN.join(', '));paint(c,i);say('boyandı')},
  tpm:()=>{if(!WPT)return say('önce haritada işaret koy');P.x=WPT.x;P.z=WPT.z;say('işarete gittin')},
  boost:()=>{P.boost=600;say('10 dk hızlı koşu')},unlock:()=>{P.own=[1,1,1,1];say('tüm silahlar açıldı')},
  radio:()=>{RAD=isNaN(n)?(RAD+1)%5:clamp(n,0,4);say('radyo '+RAD)},
  seats:()=>{const c=P.car||P.last;say(c?('koltuk: '+(c.seats||4)):'araç yok')},
  fix:()=>{const c=P.car||P.last;if(!c||c.dead)return say('araç yok');c.hp=100;fixCar(c);say('araç tamir edildi')},
  gps:()=>{const z=+a[2];if(isNaN(n)||isNaN(z))return say('/gps x z');WPT={x:n,z};wpM.visible=true;wpM.position.set(n,30,z);say('GPS işaretlendi')},
  where:()=>say(Math.round(P.x)+', '+Math.round(P.z)),
  home:()=>{if(HS){P.x=HS.x+14;P.z=HS.z+14;if(P.car){P.car.x=P.x;P.car.z=P.z}say('Eve ışınlandın')}else say('Ev yok')},
  secret:()=>{const S2={'unlimited-health':()=>{P.inf=1},'god-mode':()=>{P.god=1;P.inf=1},'nightcity':()=>{hour=0;S.day=0;lbl()},'hyper-speed':()=>{HY=1},'disco':()=>{DISCO=!DISCO},'all-weapons':()=>{P.own=[1,1,1,1]},'fast-run':()=>{P.boost=99999},'rich':()=>{P.money+=1000000},'big-head':()=>{HEADS(2.2)},'normal':()=>{HEADS(1);P.mesh.scale.setScalar(1)},'giant':()=>{P.mesh.scale.setScalar(1.7)},'tiny':()=>{P.mesh.scale.setScalar(.55)},'rainbow':()=>{RB=!RB},'tank':()=>{TANK=1},'ghost-cops':()=>{GHOST=1},'slowmo':()=>{SLOW=!SLOW},'off':()=>{P.god=P.inf=0;HY=0;DISCO=0;SLOW=TANK=GHOST=0}};(S2[x]||(()=>say('???')))();say('gizli: '+x)}};
 (C[c]||(()=>say('bilinmeyen komut: '+c)))()}
/* ---------- main loop ---------- */
let last=performance.now();
function hud(){const m=ms[mi];$('mny').textContent='$'+P.money;$('hp').style.width=clamp(P.hp,0,100)+'%';
 $('stars').innerHTML=[1,2,3,4,5].map(i=>i<=stars?'<u>★</u>':'★').join('');const np=nearPl();$('wn').textContent=P.car?(TJ?'İŞ: '+(TJ.nm||({taxi:'Taksi',kur:'Kurye',fab:'Fabrika'})[TJ.k])+(TJ.st==='drop'?' • teslim et':' • al'):''):np?np.p:(HS&&MD.house&&Math.hypot(P.x-HS.x,P.z-HS.z)<22?(HS.own?'Ev: sana ait':'ARAÇ düğmesi: ev al $2000'):WP[P.wep].n);
 $('ms').textContent=m?m.title+' • '+Math.round(Math.hypot(P.x-m.x,P.z-m.z))+' m'+(m.time?' • '+Math.ceil(mTime)+' sn':'')+(m.t==='kill'?' • '+kills+'/'+m.n:''):'Tüm görevler tamam!';
 const h=Math.floor(hour),mn=Math.floor((hour-h)*60);$('tm').textContent=String(h).padStart(2,'0')+':'+String(mn).padStart(2,'0')+(rainI>.3?' ☔':'');
 $('mm').classList.toggle('hid',!!INT);$('bAct').textContent=P.car?'İN':np?(INT?'ÇIK':'GİR'):'ARAÇ';$('bFire').textContent=P.car?'KORNA':'ATEŞ';
 {const c=P.car;$('drv').classList.toggle('hid',!c);$('joy').classList.toggle('hid',!!c);$('bt').classList.toggle('dv',!!c);$('dash').classList.toggle('hid',!c);if(c){const g=c.v<-.5?'R':c.v<1?'N':Math.min(5,1+Math.floor(c.v/7)),k=Math.abs(c.v)*3.9,f=Math.min(k/160,1);$('dk').textContent=Math.round(k);$('dg').textContent=g;$('dn').style.transform='rotate('+(-90+f*180)+'deg)';$('darc').setAttribute('stroke-dasharray',(f*251)+' 400');$('dh').setAttribute('width',Math.max(0,c.hp)*.8)}}}
function mini(){const g=mmx,sc=130/150,hd=P.car?P.car.a:P.a;g.clearRect(0,0,130,130);g.save();g.beginPath();g.arc(65,65,65,0,TAU);g.clip();g.fillStyle='#0f3a5a';g.fillRect(0,0,130,130);
 g.drawImage(MMc,(P.x-mnx-75)*MS,(P.z-mnz-75)*MS,150*MS,150*MS,0,0,130,130);
 if(RT.length>1){g.strokeStyle='#'+RIB.material.color.getHexString();g.lineWidth=3;g.beginPath();RT.forEach((q,i)=>{const x=65+(q[0]-P.x)*sc,y=65+(q[1]-P.z)*sc;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()}
 for(const c of cars)if(c.cop&&!c.dead){const x=65+(c.x-P.x)*sc,y=65+(c.z-P.z)*sc;g.fillStyle=Math.sin(tt*10)>0?'#f22':'#37f';g.fillRect(x-3,y-3,6,6)}
 for(const q of MATES){let x=(q.x-P.x)*sc,y=(q.z-P.z)*sc;const l=Math.hypot(x,y);if(l>58){x*=58/l;y*=58/l}g.fillStyle=q.c;g.beginPath();g.arc(65+x,65+y,4,0,TAU);g.fill();g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();g.lineWidth=1}
 if(HS){let x=(HS.x-P.x)*sc,y=(HS.z-P.z)*sc;const l=Math.hypot(x,y);if(l>58){x*=58/l;y*=58/l}drawIc(g,'home',HS.own?'#3f3':'#fff',65+x,65+y,6.5)}
 for(const d of pts()){let x=(d.x-P.x)*sc,y=(d.z-P.z)*sc;const l=Math.hypot(x,y);if(l>58){x*=58/l;y*=58/l}drawIc(g,d.t,d.c,65+x,65+y,6.5)}
 const m=ms[mi];if(m){let x=(m.x-P.x)*sc,y=(m.z-P.z)*sc;const l=Math.hypot(x,y);if(l>58){x*=58/l;y*=58/l}g.fillStyle='#ffd23c';g.beginPath();g.arc(65+x,65+y,5,0,TAU);g.fill();g.strokeStyle='#000';g.stroke()}
 g.translate(65,65);g.rotate(Math.PI-hd);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-7);g.lineTo(5,6);g.lineTo(-5,6);g.fill();g.restore()}
function loop(now){requestAnimationFrame(loop);FR++;perfTick(now);ren.shadowMap.needsUpdate=(FR%PF.sh)===0&&ren.shadowMap.enabled;try{step(now)}catch(e){if(!loop.w){loop.w=1;console.warn(e);$('ms').textContent='Hata: '+e.message}}if(window.__skipR&&window.__skipR()){}else if(comp&&S.gfx>=3&&PF.bloom)comp.render();else ren.render(scene,cam);if(window.SNAP){window.SNAP=0;snapDone()}}
function step(now){const dt=Math.min(.05,(now-last)/1000)*(SLOW||WS?.3:1);last=now;tt+=dt;env(dt);try{updSur(dt)}catch(e){}for(const h of HOUSES)h.visible=Math.hypot(h.position.x-cam.position.x,h.position.z-cam.position.z)<PF.house;
 if(mode==='menu'){const a=tt*.1;cam.position.set(30+Math.cos(a)*170,70,10+Math.sin(a)*170);cam.lookAt(30,5,10);updWorld(dt)}
 else{
  if(mode==='play'){
   P.cd-=dt;if(P.boost>0)P.boost-=dt;if(!P.car)playerFoot(dt);else if(B.fire||K.Space){if(AC&&Math.sin(tt*30)>.9)tone(380,.15,'square',.04);for(const p of peds)if(Math.hypot(p.x-P.car.x,p.z-P.car.z)<10&&!p.dead)p.a+=1}
   if(fp&&!P.car)P.a=yaw;P.mesh.visible=!fp&&!P.car;P.mesh.position.set(P.x,P.flr?(P.fy||0):0,P.z);P.mesh.rotation.y=P.a;
   if(P.hp<P.lhp&&P.arm)P.hp+=(P.lhp-P.hp)*.5;P.lhp=P.hp;if(P.inf)P.hp=100;if(P.god||GHOST)P.heat=0;if((P.god||TANK)&&P.car)P.car.hp=100
   if(!INT){updM(dt);updTJ(dt);updRoute(dt)}else{P.x=clamp(P.x,R0X-RHX+.7,R0X+RHX-.7);P.z=clamp(P.z,R0Z-RHZ+.7,R0Z+RHZ-.7);for(const d of DANC){swingPed(d,Math.sin(tt*6+d.ph)*.5);d.parts[2].rotation.x=d.parts[3].rotation.x=-2.4;d.position.y=Math.abs(Math.sin(tt*6+d.ph))*.1}}
   if(MODCAR)MODCAR.rotation.y+=dt*.8;
   stars=P.heat<=0?0:Math.min(5,Math.ceil(P.heat/30));
   const want=stars*2,cops=cars.filter(c=>c.cop&&!c.drv&&!c.dead);
   if(stars>0){copOff=0;if(cops.length<want){const q=spawnPt(110,170);if(q&&R()<.05){const c=mkCar(4,'#f4f4f4',q[0],q[1],0);c.ai=0}}}
   else{copOff+=dt;if(copOff>5)for(const c of cops){const i=cars.indexOf(c);scene.remove(c.m);cars.splice(i,1)}}
   const near=cops.some(c=>Math.hypot(c.x-P.x,c.z-P.z)<70);P.heat=Math.max(0,P.heat-(near?.6:3)*dt);
   if(P.hp<=0){mode='dead';$('wst').classList.remove('hid');if(P.car)exitCar();P.mesh.visible=true;P.mesh.rotation.x=-Math.PI/2;P.mesh.position.y=.3+(P.fy||0);
    if(window.GTA_DIE&&window.GTA_DIE()){}else setTimeout(()=>{P.mesh.rotation.x=0;P.x=HS&&HS.own?HS.x:-45;P.z=HS&&HS.own?HS.z:-45;P.hp=100;P.heat=0;stars=0;P.money=Math.floor(P.money*.9);$('wst').classList.add('hid');mode='play'},3000)}
  }
  updWorld(dt);
  const dist=P.car?(P.car.fly?18:11):8.5,hgt=P.car?4.8:4.2,tx=P.x,tz=P.z;
  if(drag>0)drag-=dt;else if(P.car)yaw+=angD(P.car.a,yaw)*Math.min(1,2.5*dt);
  if(fp&&mode!=='dead'){const h=P.car?1.5:1.75,o=P.car?.6:0;cam.position.set(tx+Math.sin(yaw)*o,h,tz+Math.cos(yaw)*o);cam.lookAt(tx+Math.sin(yaw)*9,h-.1,tz+Math.cos(yaw)*9)}else{cam.position.set(tx-Math.sin(yaw)*dist,hgt+(P.fy||0)+(P.car?1:0),tz-Math.cos(yaw)*dist);cam.lookAt(tx,1.8+(P.fy||0),tz)}
  if(P.car&&P.car.fly&&!INT&&!fp){const al=P.car.alt||0;cam.position.y+=al;cam.lookAt(tx,1.8+al*.96,tz)}
  if(INT){cam.position.x=clamp(cam.position.x,R0X-RHX+.6,R0X+RHX-.6);cam.position.z=clamp(cam.position.z,R0Z-RHZ+.6,R0Z+RHZ-.6);cam.position.y=Math.min(cam.position.y,RHY-.8);cam.lookAt(P.x,1.6,P.z)}
  if(drunk>0){drunk-=dt;cam.rotation.z+=Math.sin(tt*2)*.07*Math.min(1,drunk/3)}
  if(DISCO&&(tt*2|0)!==lastD){lastD=tt*2|0;for(const c of cars)if(c.glb&&!c.cop)paint(c,R()*20|0)}
  if(!INT&&!fp&&!(P.car&&P.car.fly&&(P.car.alt||0)>6)){let k=0;while(k++<10&&hitB(cam.position.x,cam.position.z,.6)){cam.position.x+=(P.x-cam.position.x)*.25;cam.position.z+=(P.z-cam.position.z)*.25;cam.position.y+=(2-cam.position.y)*.1}cam.lookAt(P.x,1.8,P.z)}
  if(!INT&&!fp&&mode!=='dead'){if(P.car&&drag<=0)CP*=Math.max(0,1-dt*1.2);else if(mode!=='play')CP*=Math.max(0,1-dt*3);if(CP>.012){cam.position.y=Math.max(.75,cam.position.y-CP*(cam.position.y-.75)*.82);cam.lookAt(P.x,1.8+CP*17,P.z)}}
  marker.scale.x=marker.scale.z=1+.1*Math.sin(tt*4);
  {const c=P.car;if(c){HL.position.set(c.x+Math.sin(c.a)*2,.9,c.z+Math.cos(c.a)*2);HL.target.position.set(c.x+Math.sin(c.a)*28,0,c.z+Math.cos(c.a)*28);HL.intensity=clamp(1.6*(1-DAY)+.7*rainI,0,2)}else HL.intensity=0}
  const tf=65+(P.car?Math.abs(P.car.v)*.55:0);if(Math.abs(cam.fov-tf)>.1){cam.fov+=(tf-cam.fov)*Math.min(1,4*dt);cam.updateProjectionMatrix()}
  if(shake>0){cam.position.x+=(R()-.5)*shake;cam.position.y+=(R()-.5)*shake*.6;shake=Math.max(0,shake-dt*2.5)}
  hudT-=dt;if(hudT<=0){hudT=.1;hud()}if((FR&3)===0)mini();
  if(msgT>0){msgT-=dt;if(msgT<=0)msgEl.style.opacity=0}
 }
 for(const l of trc)if(l.visible){l.t-=dt;if(l.t<=0)l.visible=false}
 if(AC){const on=S.snd?1:0;EG.gain.value=on*(P.car&&mode==='play'?.03+.05*Math.min(1,Math.abs(P.car.v)/30):0);EO.frequency.value=40+(P.car?Math.abs(P.car.v):0)*3.5;RG.gain.value=on*.07*rainI;
  let md=999;for(const c of cars)if(c.cop&&!c.dead&&!c.drv)md=Math.min(md,Math.hypot(c.x-P.x,c.z-P.z));SG.gain.value=on*(stars>0&&mode==='play'?clamp(1-md/160,0,1)*.03:0);SO.frequency.value=800+300*Math.sin(tt*8)}
}
function mkComp(){if(comp||!T.EffectComposer||!T.UnrealBloomPass||!T.RenderPass)return;try{const c=new T.EffectComposer(ren);c.addPass(new T.RenderPass(scene,cam));c.addPass(new T.UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.5,.6,.85));c.setPixelRatio(Math.min(devicePixelRatio,.8));c.setSize(innerWidth,innerHeight);comp=c}catch(e){comp=null;console.warn(e)}}
function setGfx(){if(S.gfx>=3)mkComp();ren.shadowMap.enabled=S.gfx>0;sun.castShadow=S.gfx>0&&PF.lvl<3;const q=[256,512,512,1024,2048][S.gfx];if(sun.shadow.mapSize.x!==q){sun.shadow.mapSize.set(q,q);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)})}
/* ---------- GLB models ---------- */
const gl=T.GLTFLoader?new T.GLTFLoader():null;
function b64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
function loadM(k,len,car){if(!gl)return;gl.parse(b64(MB[k]),'',gltf=>{const g=gltf.scene,w=new T.Group(),v=new T.Vector3(),bx=new T.Box3();w.add(g);
 const bb=()=>{w.updateMatrixWorld(true);bx.setFromObject(w);return bx.getSize(v)};
 let z=bb();if(car&&z.x>z.z){g.rotation.y=Math.PI/2;z=bb()}
 g.scale.setScalar(len/(car?z.z:Math.max(z.x,z.z)));z=bb();const c=bx.getCenter(new T.Vector3());g.position.set(-c.x,-bx.min.y,-c.z);z=bb();
 w.userData={h:z.y,sx:z.x,sz:z.z};{const cm=new Map(),conv=m=>{if(!m||!m.isMeshStandardMaterial)return m;if(cm.has(m))return cm.get(m);const n=new T.MeshLambertMaterial({map:m.map||null,color:m.color?m.color.clone():0xffffff,emissive:m.emissive?m.emissive.clone():0x000000,emissiveMap:m.emissiveMap||null,emissiveIntensity:m.emissiveIntensity==null?1:m.emissiveIntensity,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest||0,side:m.side,vertexColors:!!m.vertexColors});n.name=m.name;cm.set(m,n);return n};w.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(conv):conv(o.material)})}
 MD[k]=w;w.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(/glass|window/i.test(m.name||'')||m.name==='Material_237'){m.transparent=true;m.opacity=Math.min(m.opacity,.4);if(!/red/i.test(m.name))m.color.set(0x9fd0f0);if('metalness' in m)m.metalness=0;m.depthWrite=false;m.userData.glass=1}})});if(k==='fast')w.traverse(o=>{if(o.isMesh&&o.material.map&&!MD.fastImg){MD.fastMap=o.material.map;MD.fastImg=o.material.map.image;MD.fastEnc=o.material.map.encoding}});
 if(k==='house'){const sites=[{x:HS.x,z:HS.z,s:1,r:0},...HX.map((q,n)=>({x:q.x,z:q.z,s:1.35,r:n%4}))];for(const q of sites){const h=w.clone();h.scale.setScalar(q.s);h.rotation.y=q.r*Math.PI/2;h.position.set(q.x,.4,q.z);h.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true}});scene.add(h);HOUSES.push(h);const od=q.r%2,sx=(od?z.z:z.x)*q.s,sz=(od?z.x:z.z)*q.s;blds.push({x1:q.x-sx/2+1,x2:q.x+sx/2-1,z1:q.z-sz/2+1,z2:q.z+sz/2-1})}}
 else{cars.forEach(skin);cars.forEach(c=>{if((k==='maz'&&c.vt==='bus')||(k==='bajaj'&&c.vt==='saz'))swapVis(c,k)})}},undefined,e=>console.warn('GLB',k,e))}
scene.traverse(o=>{if(o.isMesh&&!o.userData.ns)o.castShadow=o.receiveShadow=true});setGfx();requestAnimationFrame(loop);

/* ---------- GLB insanlar / agaclar (extra.js) ---------- */
const PG={},PVT={};let pPend=0;
const pLam=m=>{const n=new T.MeshLambertMaterial({map:m.map||null,color:m.color?m.color.clone():0xffffff,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest||0});n.name=m.name;if(m.transparent&&/hair|face|bandana/.test(m.name)){n.transparent=false;n.alphaTest=.45}return n};
function regP(k,g){const lm=new Map();g.traverse(o=>{if(o.isMesh){if(!lm.has(o.material))lm.set(o.material,pLam(o.material));o.material=lm.get(o.material)}});PG[k]=g}
function pvTex(key,base){if(PVT[key])return PVT[key];const t=base.clone(),im=new Image();im.onload=()=>{t.image=im;t.needsUpdate=true};im.src=PM.tex[key];t.needsUpdate=true;return PVT[key]=t}
function varMats(v){if(v._mm)return v._mm;const mm=new Map();PG[v.m].traverse(o=>{if(o.isMesh&&!mm.has(o.material)){const k=v.tex[o.material.name];if(k&&o.material.map){const n=o.material.clone();n.map=pvTex(k,o.material.map);mm.set(o.material,n)}}});return v._mm=mm}
function mkGPed(k,v,own){const src=PG[k];if(!src)return null;const g=src.clone(true),mm=v?varMats(v):null,cl=new Map();
 g.traverse(o=>{if(!o.isMesh)return;let m=o.material;if(mm&&mm.has(m))m=mm.get(m);if(own){if(!cl.has(m))cl.set(m,m.clone());m=cl.get(m);o.castShadow=o.receiveShadow=true;o.userData.ns=0}else o.userData.ns=1;o.material=m});
 const N=n=>g.getObjectByName(n)||new T.Group(),G=()=>new T.Group(),mt=n=>{let r=null;g.traverse(o=>{if(!r&&o.isMesh&&o.material.name===n)r=o.material});return r||new T.MeshBasicMaterial()};
 g.parts=[N('legN'),N('legP'),N('armN'),N('armP')];g.knees=[G(),G()];g.elb=[G(),G()];g.glb=1;g.mats=[mt('top'),mt('legs')];scene.add(g);return g}
function pickGPed(gang,rr){rr=rr||R;try{const V=PM.variants,pool=(gang?V.gang:(rr()<.55?V.girl:V.boy)).filter(v=>PG[v.m]);if(!pool.length)return null;const v=pool[(rr()*pool.length)|0];return mkGPed(v.m,v,0)}catch(e){console.warn('ped',e);return null}}
function upgradePeds(){PRDY=1;for(const o of peds){if(o.m.glb)continue;const m=pickGPed(o.gang,o.sd!=null?rnd(o.sd):null);if(!m)continue;m.position.copy(o.m.position);m.rotation.copy(o.m.rotation);scene.remove(o.m);o.m=m}
 try{if(PG.michael){const old=P.mesh,g=mkGPed('michael',null,1);if(g){g.position.copy(old.position);g.rotation.copy(old.rotation);g.visible=old.visible;scene.remove(old);P.mesh=g}}}catch(e){console.warn(e)}}
function loadP(){if(!gl||typeof PM==='undefined')return;const ks=Object.keys(PM.models);pPend=ks.length;const fin=()=>{if(--pPend===0)try{upgradePeds()}catch(e){console.warn(e)}};
 ks.forEach(k=>{try{gl.parse(b64(PM.models[k]),'',g=>{try{regP(k,g.scene)}catch(e){console.warn(e)}fin()},e=>{console.warn('GLB',k,e);fin()})}catch(e){console.warn(e);fin()}})}
function upgradeTrees(g){let mesh=null;g.traverse(o=>{if(o.isMesh&&!mesh)mesh=o});if(!mesh||!TPOS.length)return;const mat=pLam(mesh.material);mat.side=T.DoubleSide;mat.transparent=false;mat.alphaTest=.35;
 const im=new T.InstancedMesh(mesh.geometry.clone(),mat,TPOS.length),d=new T.Object3D();
 TPOS.forEach((q,i)=>{const s=(4.6+R()*2)/1.16;d.position.set(q[0],0,q[1]);d.rotation.set(0,R()*TAU,0);d.scale.set(s,s*(.9+R()*.3),s);d.updateMatrix();im.setMatrixAt(i,d.matrix)});
 im.userData.ns=1;im.frustumCulled=false;scene.add(im);TOBJ.forEach(o=>scene.remove(o))}
function loadTree(){if(!gl||!MB.plant)return;try{gl.parse(b64(MB.plant),'',g=>{try{upgradeTrees(g.scene)}catch(e){console.warn(e)}},e=>console.warn('plant',e))}catch(e){console.warn(e)}}

/* ---------- v16: arac gorunumu, polis memurlari, duraklar ---------- */
function swapVis(k,key){const m=MD[key];if(!m)return;const pg=k.pg;while(pg.children.length)pg.remove(pg.children[0]);const c=m.clone();c.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});pg.add(c);k.mroot=c;k.mdl=key;k.glb=1}
function deployCops(c){if(c.out||!PG.police)return;const offs=[];for(let i=0;i<2;i++){const m=mkGPed('police',null,0);if(!m)break;const s=i?1:-1,x=c.x+Math.cos(c.a)*2.4*s,z=c.z-Math.sin(c.a)*2.4*s;m.position.set(x,0,z);const o={m,x,z,a:c.a,hp:60,dead:0,t:0,gang:0,cop:1,ph:R()*6,sp:4.8,sh:.6+i*.5,car:c,gone:0};peds.push(o);offs.push(o)}
 if(offs.length){c.out=1;c.offs=offs;c.outT=0;toast('Polis arabadan indi!')}}
function updCopPed(p,dt,i){const rel=()=>{scene.remove(p.m);peds.splice(i,1);p.dead=1;if(p.car&&p.car.offs&&p.car.offs.every(o=>o.dead)){p.car.out=0;p.car.offs=null}};
 const tx=P.car?P.car.x:P.x,tz=P.car?P.car.z:P.z,dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
 if(stars<=0||mode!=='play'){p.gone+=dt;if(p.gone>3)rel();p.m.position.set(p.x,0,p.z);return}
 if(d>85){rel();return}
 p.a=Math.atan2(dx,dz);let sw=0;
 if(d>9){const sp=p.sp*(d>30?1.25:1);if(!mv(p,Math.sin(p.a)*sp*dt,Math.cos(p.a)*sp*dt,.5)){p.a+=1.2;mv(p,Math.sin(p.a)*sp*dt,Math.cos(p.a)*sp*dt,.5)}p.ph+=sp*dt*2.2;sw=Math.sin(p.ph)*.7}
 else{p.sh-=dt;if(p.sh<=0){p.sh=.9+R()*.8;if(R()<.6&&mode==='play'){P.hp-=(P.car?4:7);tracer(p.x+Math.sin(p.a)*.8,1.3,p.z+Math.cos(p.a)*.8,tx,tz);sfx(.25,.12,2400)}}}
 swingPed(p.m,sw);if(d<=9&&p.m.parts&&p.m.parts[3])p.m.parts[3].rotation.x=-1.4;
 p.m.position.set(p.x,0,p.z);p.m.rotation.y=p.a;p.m.visible=Math.hypot(p.x-cam.position.x,p.z-cam.position.z)<120}
const STOPS=[];function placeStops(g){g.traverse(o=>{if(o.isMesh)o.userData.ns=1});let n=0;const cand=[],onRd=(x,z,m)=>roads.some(r2=>{const u=r2.ax==='z'?x:z,v=r2.ax==='z'?z:x;return Math.abs(u-r2.c)<r2.w/2+m&&v>r2.a0-m&&v<r2.a1+m});
 for(const r of roads){if(r.a1-r.a0<150)continue;for(let t=r.a0+40;t<r.a1-40;t+=110+((R()*50)|0))for(const sd of[-1,1])if(R()<.5)cand.push([r,t,sd])}
 for(const[r,t,sd]of cand){if(n>=18)break;const off=r.w/2+2.9,x=r.ax==='z'?r.c+sd*off:t,z=r.ax==='z'?t:r.c+sd*off,ux=r.ax==='z'?0:1,uz=r.ax==='z'?1:0;
  if(roads.some(r2=>r2.ax!==r.ax&&Math.abs((r2.ax==='z'?x:z)-r2.c)<r2.w/2+9&&(r2.ax==='z'?z:x)>r2.a0-1&&(r2.ax==='z'?z:x)<r2.a1+1))continue;
  let bad=0;for(const i of[-3,-1.5,0,1.5,3])for(const j of[-1,0,1]){const qx=x+ux*i+uz*j,qz=z+uz*i+ux*j;if(onRd(qx,qz,1)||blocked(qx,qz,.8))bad=1}if(bad)continue;
  const m=g.clone(true);m.position.set(x,0,z);m.rotation.y=r.ax==='z'?-sd*Math.PI/2:(sd<0?0:Math.PI);scene.add(m);STOPS.push({x,z,ax:r.ax,c:r.c,sd,rd:r});for(let i=-2;i<=2;i++)addSol(x+ux*i*1.2,z+uz*i*1.2,.9);n++}}
function loadBS(){if(!gl||!MB.busstop)return;try{gl.parse(b64(MB.busstop),'',g=>{try{placeStops(g.scene)}catch(e){console.warn(e)}},e=>console.warn('busstop',e))}catch(e){console.warn(e)}}
try{loadM('fast',4.7,1);loadM('police',4.8,1);loadM('clio',3.9,1);loadM('volvo',4.7,1);loadM('alfa',4.2,1);loadM('mito',4.0,1);loadM('sport',3.9,1);loadM('moskvich',4.1,1);loadM('maz',10.3,1);loadM('bajaj',2.1,1);loadP();loadTree();loadBS();setTimeout(()=>cars.forEach(skin),13000);if(HS)loadM('house',20,0)}catch(e){console.warn(e)}

function buyMdl(key,nm){if(!MD[key])return toast('Model yükleniyor, birkaç saniye sonra dene');const k=mkCar(1,'#c0392b',(INT?INT.rx:P.x)+7,(INT?INT.rz:P.z)+7,0);k.ai=0;if(k.mroot){k.m.remove(k.mroot);k.glb=0}k.mdl=key;skin(k);toast(nm+' kapıda')}
function buyAlfa(hex,nm){if(!MD.alfa)return toast('Alfa modeli yükleniyor, birkaç saniye sonra dene');const k=mkCar(1,'#c0392b',(INT?INT.rx:P.x)+7,(INT?INT.rz:P.z)+7,0);k.ai=0;if(k.mroot){k.m.remove(k.mroot);k.glb=0}k.mdl='alfa';skin(k);k.m.traverse(o=>{if(o.isMesh&&o.material.name==='body')o.material.color.set(hex)});toast('Alfa Romeo kapıda: '+nm)}
function buyCar(n,kd){const k=mkCar(kd||1,'#c0392b',(INT?INT.rx:P.x)+7,(INT?INT.rz:P.z)+7,0);k.ai=0;k.own=1;if(kd>=5)k.bm.color.set(n==='sari'?'#f1c40f':'#e67e22');skin(k);paint(k,Math.max(0,COLN.indexOf(n)));toast('Araban kapıda: '+n)}
$('rd').onclick=()=>{RAD=(RAD+1)%5;toast('Radyo: '+['Neon FM','Synth FM','Retro Jazz','Lo-Fi Gece','Kapalı'][RAD])};
addEventListener('keydown',e=>{if(e.code==='KeyR'&&mode==='play')$('rd').click()});

const WIC=['<path d="M8 30h46v10H34l-4 14H20l4-14H8z"/>','<path d="M4 28h44v8H34l-3 16h-9l3-16H4zM48 26h12v4H48z"/>','<path d="M2 30h60v6H2zM14 36h18l-3 14h-8z"/>','<path d="M2 24h52v12H2zM54 22l8 8-8 8zM14 36h10l-3 16h-8z"/>'],WNM=['Tabanca','SMG','Pompalı','Bazuka'];
function wheel(o){WS=o?1:0;const w=$('ww');w.classList.toggle('hid',!o);if(!o)return;w.innerHTML=WNM.map((n,i)=>{const a=i/4*6.283-1.57;return `<button class="wb${P.wep===i?' on':''}${P.own[i]?'':' lk'}" data-i="${i}" style="left:calc(50% + ${Math.cos(a)*100}px);top:calc(50% + ${Math.sin(a)*100}px)"><svg viewBox="0 0 64 64">${WIC[i]}</svg><span>${n}</span></button>`}).join('')+'<i class="wc"></i><button class="wxb" id="wx">X</button>'}
addEventListener('keydown',e=>{if(e.code==='Escape'&&WS)wheel(0)});
$('ww').addEventListener('pointerdown',e=>{e.preventDefault();const b=e.target.closest('.wb');if(b&&P.own[+b.dataset.i])P.wep=+b.dataset.i;wheel(0)});


/* ---------- 20 sürpriz ---------- */
let RB=0,RBT=0,PKG=0;
const SUR_pk=[],SUR_cash=[],bigR=lands[0],sr=rnd(4242);
const HEADS=k=>{P.mesh.traverse(o=>{if(o.geometry===gHd||o.geometry===gHair)o.scale.setScalar(k)})};
const gPk=new T.OctahedronGeometry(.9),mPk=new T.MeshBasicMaterial({color:0xff2fa8}),gBm=new T.CylinderGeometry(.35,.35,40,8,1,true),mBm=new T.MeshBasicMaterial({color:0xff2fa8,transparent:true,opacity:.28,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}),gCs=new T.BoxGeometry(1.1,.8,.8),mCs=new T.MeshBasicMaterial({color:0x33ff66});
function freeSpot(r){for(let k=0;k<500;k++){const x=bigR.x1+30+sr()*(bigR.x2-bigR.x1-60),z=bigR.z1+30+sr()*(bigR.z2-bigR.z1-60);if(!blocked(x,z,r))return[x,z]}return null}
for(let i=0;i<20;i++){const q=freeSpot(3);if(!q)continue;const m=new T.Mesh(gPk,mPk),b=new T.Mesh(gBm,mBm);m.position.set(q[0],1.6,q[1]);b.position.set(q[0],20,q[1]);m.userData.ns=b.userData.ns=1;scene.add(m,b);SUR_pk.push({m,b,x:q[0],z:q[1]})}
for(let i=0;i<30;i++){const rd=roads[sr()*roads.length|0],t=rd.a0+12+sr()*(rd.a1-rd.a0-24),x=rd.ax==='z'?rd.c:t,z=rd.ax==='z'?t:rd.c,m=new T.Mesh(gCs,mCs);m.position.set(x,1,z);m.userData.ns=1;scene.add(m);SUR_cash.push({m,x,z,v:100+((sr()*5)|0)*100})}
const ZEP=new T.Group();{const lm=c=>new T.MeshLambertMaterial({color:c});ZEP.add(new T.Mesh(new T.SphereGeometry(1,14,10).scale(18,6,6),lm(0xdddddd)));
 const f=new T.Mesh(gBox,lm(0xc0392b));f.scale.set(5,9,.6);f.position.set(-16,0,0);ZEP.add(f);const st=new T.Mesh(gBox,new T.MeshBasicMaterial({color:0xffd23c}));st.scale.set(14,.8,12.2);ZEP.add(st);const gd=new T.Mesh(gBox,lm(0x333333));gd.scale.set(6,1.5,2.5);gd.position.set(0,-6.5,0);ZEP.add(gd)}
ZEP.traverse(o=>{o.userData.ns=1});scene.add(ZEP);
const UFO=new T.Group();{const dsk=new T.Mesh(new T.SphereGeometry(1,14,8).scale(5,1,5),new T.MeshLambertMaterial({color:0x9aa3ad})),dm=new T.Mesh(new T.SphereGeometry(1.6,10,8),new T.MeshBasicMaterial({color:0x66ff99})),bm=new T.Mesh(new T.CylinderGeometry(.6,3.2,36,12,1,true),new T.MeshBasicMaterial({color:0x66ff99,transparent:true,opacity:.18,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}));dm.position.y=.8;bm.position.y=-18;UFO.add(dsk,dm,bm)}
UFO.traverse(o=>{o.userData.ns=1});UFO.visible=false;scene.add(UFO);let ufoSeen=0;
function updSur(dt){if(mode!=='play')return;const px=P.car?P.car.x:P.x,pz=P.car?P.car.z:P.z;
 for(const k of SUR_pk)if(!k.got){k.m.rotation.y+=dt*2;k.m.position.y=1.6+Math.sin(tt*3+k.x)*.3;if(Math.hypot(px-k.x,pz-k.z)<3.2){k.got=1;k.m.visible=k.b.visible=false;PKG++;P.money+=500;if(PKG>=SUR_pk.length){P.money+=20000;toast('TÜM PAKETLER! +$20000')}else toast('Gizli paket '+PKG+'/'+SUR_pk.length+'  +$500');tone(880,.2,'triangle',.08)}}
 for(const k of SUR_cash)if(!k.got){k.m.rotation.y+=dt*3;if(Math.hypot(px-k.x,pz-k.z)<2.6){k.got=1;k.m.visible=false;P.money+=k.v;toast('Para çantası +$'+k.v)}}
 const ca=(bigR.x1+bigR.x2)/2,cb=(bigR.z1+bigR.z2)/2,an=tt*.03;ZEP.position.set(ca+Math.cos(an)*380,115,cb+Math.sin(an)*260);ZEP.rotation.y=-an-Math.PI/2;
 const night=hour<5||hour>21;UFO.visible=night;if(night){const u=tt*.35;UFO.position.set(px+Math.cos(u)*70,48,pz+Math.sin(u)*70);UFO.rotation.y=u*3;if(!ufoSeen){ufoSeen=1;toast('Gökyüzünde bir UFO var!')}}else ufoSeen=0;
 if(RB&&P.car){RBT-=dt;if(RBT<0){RBT=.25;const c=P.car;if(c.glb)paint(c,(Math.random()*20)|0);else c.bm.color.setHSL(Math.random(),.8,.5)}}}
{const gear=(k,m)=>{if(P.mesh[k])P.mesh.remove(P.mesh[k]);P.mesh[k]=m;P.mesh.add(m)},L=c=>new T.MeshLambertMaterial({color:c}),K=(geo,mt,x,y,z)=>{const m=new T.Mesh(geo,mt);m.position.set(x,y,z);return m};
 SH.market.push(['Piyango bileti',30,()=>{const r=Math.random();if(r<.02){P.money+=5000;toast('JACKPOT! +$5000')}else if(r<.1){P.money+=300;toast('Kazandın +$300')}else if(r<.4){P.money+=60;toast('Küçük ikramiye +$60')}else toast('Boş çıktı...')}],['Enerji içeceği',40,()=>{P.boost=120;toast('Enerji! 2 dk hızlısın')}],['Hediye kutusu',100,()=>{const r=Math.random();if(r<.3)heal(100);else if(r<.5){P.arm=1;toast('Yelek çıktı!')}else if(r<.7){P.money+=250;toast('İçinden $250 çıktı')}else if(r<.85){P.own[1]=1;toast('SMG çıktı!')}else{P.boost=200;toast('Süper enerji!')}}]);
 SH.club.push(['Slot makinesi',100,()=>{const a=['🍒','🍋','💎','7️⃣'],q=[0,0,0].map(()=>a[(Math.random()*4)|0]);if(q[0]===q[1]&&q[1]===q[2]){P.money+=1500;toast(q.join(' ')+' +$1500!')}else if(q[0]===q[1]||q[1]===q[2]){P.money+=150;toast(q.join(' ')+' +$150')}else toast(q.join(' ')+' kaybettin')}],['Zar at',50,()=>{if(Math.random()<.45){P.money+=100;toast('Kazandın +$100')}else toast('Kaybettin')}]);
 SH.gym.push(['Boks eldiveni',250,()=>{P.dm=Math.min(3,(P.dm||1)*1.1);toast('Yumruk güçlendi')}]);
 SH.pharm.push(['Adrenalin',200,()=>{P.god=1;toast('Adrenalin! 15 sn ölümsüz');setTimeout(()=>{P.god=0},15000)}]);
 SH.food.push(['Sürpriz menü',60,()=>{const r=Math.random();if(r<.2){P.hp=Math.max(5,P.hp-15);toast('Bayat çıktı...')}else heal(20+((Math.random()*80)|0))}]);
 SH.clothes.push(['Şapka',60,()=>{const h=new T.Group();h.add(K(new T.CylinderGeometry(.19,.19,.02,14),L(0x2c3e50),0,1.8,0),K(new T.CylinderGeometry(.1,.11,.1,12),L(0x2c3e50),0,1.85,0));gear('hat',h);toast('Şapka takıldı')}],
  ['Güneş gözlüğü',50,()=>{const h=new T.Group();h.add(K(new T.BoxGeometry(.21,.035,.03),L(0x050505),0,1.725,.128));gear('glasses',h);toast('Gözlük takıldı')}],
  ['Kırmızı bere',40,()=>{const h=new T.Group();h.add(K(new T.SphereGeometry(.128,12,8,0,TAU,0,Math.PI*.6).scale(.95,1.2,1.05),L(0xc0392b),0,1.72,0),K(new T.SphereGeometry(.03,6,6),L(0xffffff),0,1.9,0));gear('beanie',h);toast('Bere takıldı')}])}

let LK=0;const bet=n=>{if(Math.random()<(LK?.9:.42)){P.money+=n*2;toast('KAZANDIN +$'+n)}else toast('Kaybettin -$'+n)};
setInterval(()=>{const t=P.fly?26:(P.flr||0);P.fy=(P.fy||0)+(t-(P.fy||0))*.12},33);
/* ---- telefon ---- */
let SNAP=0;const sp=t=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='en-US';speechSynthesis.speak(u)}catch(e){}};
function horror(){if(!AC)return;const n=AC.currentTime,o=(f,ty,v,d,sw)=>{const a=AC.createOscillator(),b=AC.createGain();a.type=ty;a.frequency.setValueAtTime(f,n);if(sw)a.frequency.linearRampToValueAtTime(sw,n+d);b.gain.setValueAtTime(0,n);b.gain.linearRampToValueAtTime(v,n+1);b.gain.linearRampToValueAtTime(0,n+d);a.connect(b);b.connect(AC.destination);a.start(n);a.stop(n+d)};o(55,'sawtooth',.25,7);o(58.5,'sawtooth',.22,7);o(1900,'sine',.08,6,2300);o(220,'square',.05,7,110);for(let i=0;i<5;i++)setTimeout(()=>{o(80+Math.random()*900,'sawtooth',.2,.25)},1200*i+600);const f=$('phf');f.classList.remove('hid');setTimeout(()=>f.classList.add('hid'),6500);sp('Why did you call')}
function openPh(){if(mode==='cmd')cmdOpen();if(mode!=='play')return;mode='phone';J.x=J.y=0;B.fire=0;$('ph').classList.remove('hid');phHome();clearInterval(phClk);phClk=setInterval(phClock,1000)}
function closePh(){$('ph').classList.add('hid');clearInterval(phClk);if(mode==='phone')mode='play'}
function snapDone(){const u=$('c').toDataURL('image/png'),a=document.createElement('a');a.href=u;a.download='gta67-foto.png';a.click();toast('Fotoğraf kaydedildi')}
function callNum(){const v=$('pn').value.trim(),st=$('pst');if(!v)return;st.textContent='Aranıyor...';setTimeout(()=>{if(v==='666'){st.textContent='...';horror()}else if(v==='67'){st.textContent='Bagirov Ekber — açtı';sp('Bro, this is for you. Plus five thousand dollars cash. Check WhatsApp');P.money+=5000;toast('+$5000 nakit (WhatsApp)');waPush('Bro, this is for you. Plus five thousand dollars cash.')}else if(v==='100'||v==='taksi'){st.textContent='Taksi yolda';callTaxi()}else{st.textContent='Açıldı';sp(['Hello? Who is this?','Hey buddy, what is up','I am busy right now, call me later'][Math.random()*3|0])}},1500)}
function callTaxi(){const px=P.x+Math.sin(P.a)*9,pz=P.z+Math.cos(P.a)*9,k=mkCar(3,'#f2c40f',px,pz,P.a);try{skin(k)}catch(e){}k.ai=0;toast('Taksi geldi, yanında')}
const PH_IC={
tel:'<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"/></svg>',
msg:'<svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>',
cam:'<svg viewBox="0 0 24 24"><path d="M9 4L7.5 6H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3.5L15 4z"/><circle class="cut" cx="12" cy="13" r="4.2"/><circle cx="12" cy="13" r="2.2"/></svg>',
taxi:'<svg viewBox="0 0 24 24"><rect x="9.5" y="2" width="5" height="2.4" rx=".8"/><path d="M5 12l1.6-5A2 2 0 018.5 5.6h7A2 2 0 0117.4 7L19 12h1a1 1 0 011 1v5h-2v1.5a1 1 0 01-1 1h-1a1 1 0 01-1-1V18H8v1.5a1 1 0 01-1 1H6a1 1 0 01-1-1V18H3v-5a1 1 0 011-1z"/><circle class="cut" cx="7.2" cy="15" r="1.3"/><circle class="cut" cx="16.8" cy="15" r="1.3"/></svg>',
map:'<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7z"/><circle class="cut" cx="12" cy="9" r="2.7"/></svg>',
wa:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/><path class="cut" d="M8.6 7.5c.3-.3.8-.3 1 .1l.8 1.7c.1.3 0 .6-.2.8l-.6.6a6 6 0 002.9 2.9l.6-.6c.2-.2.5-.3.8-.2l1.7.8c.4.2.4.7.1 1-.9 1-2.2 1.3-3.5.7a8.4 8.4 0 01-4.2-4.2c-.6-1.3-.3-2.6.6-3.6z"/></svg>',
set:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="6.8" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 2.4v3M12 18.6v3M2.4 12h3M18.6 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>'};
const PH_APPS=[['tel','Telefon','linear-gradient(#58d86e,#1c9c45)','#27a84f'],['msg','Mesajlar','linear-gradient(#5ac8fa,#0a6cf0)','#2a8ff5'],['cam','Kamera','linear-gradient(#9a9aa0,#3a3a3e)','#5a5a60'],['taxi','Taksi','linear-gradient(#ffd60a,#ff9f0a)','#ffb90a'],['map','Harita','linear-gradient(#3ed16a,#0a84ff)','#1aa8a0'],['wa','WhatsApp','linear-gradient(#5bd66f,#128c3e)','#1fa84f'],['set','Ayarlar','linear-gradient(#a2a2a8,#5a5a5f)','#7c7c82']];
const MSGS=[['Taksi Durağı','Taksi için 100 numarasını ara ya da Taksi uygulamasını kullan.'],['Bilinmeyen','666 numarasını aramasan iyi olur.'],['Banka','Hesabın aktif. Hoş geldin.']];
const WA=[{n:'Bagirov Ekber',m:[['in','Selam kardeş, 67 numarasını aradın mı?']]},{n:'Kral34',m:[['in','Yarışa hazır mısın?']]},{n:'Selin',m:[['in','Bu akşam pavyonda mıyız?']]}];
let phCur=null,phClk=0,waI=-1;
const phTime=()=>String(Math.floor(hour)%24).padStart(2,'0')+':'+String(Math.floor((hour%1)*60)).padStart(2,'0');
function phClock(){$('pclk').textContent=phTime();$('pwt').textContent=phTime()}
function phHome(){phCur=null;waI=-1;$('pap').classList.add('hid');$('phs').classList.remove('hid');phClock()}
function waPush(t){WA[0].m.push(['in',t]);if(phCur==='wa'&&waI===0)waRender()}
function waRender(){const c=$('pac');if(waI<0){$('pat').textContent='WhatsApp';c.innerHTML=WA.map((w,i)=>`<button class="prow" data-i="${i}"><span><b>${w.n}</b><br><small>${w.m[w.m.length-1][1]}</small></span></button>`).join('');c.onclick=e=>{const b=e.target.closest('.prow');if(b){waI=+b.dataset.i;waRender()}};return}
 const w=WA[waI];$('pat').textContent=w.n;c.onclick=null;c.innerHTML=w.m.map(m=>`<div class="bb ${m[0]}">${m[1].replace(/</g,'&lt;')}</div>`).join('')+'<div class="wai"><input id="wai" placeholder="Mesaj" autocomplete="off"><button id="was">Gönder</button></div>';c.scrollTop=1e9;
 const send=()=>{const v=$('wai').value.trim();if(!v)return;w.m.push(['out',v]);setTimeout(()=>{w.m.push(['in',['Tamamdır!','Haha, olur','Sonra konuşalım','Bro, 67 numarasını ara :)'][Math.random()*4|0]]);if(phCur==='wa'&&WA[waI]===w)waRender()},900);waRender()};$('was').onclick=send;$('wai').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')send()}}
const PH_VIEW={
tel:c=>{c.innerHTML='<input id="pn" readonly placeholder="Numara"><div id="pst">Hazır</div><div id="pk"></div><div class="pcb"><button id="pdel">SİL</button><button id="pcall" aria-label="Ara">'+PH_IC.tel+'</button></div>';$('pk').innerHTML='123456789*0#'.split('').map(k=>`<button>${k}</button>`).join('');$('pk').onclick=e=>{if(e.target.tagName==='BUTTON')$('pn').value+=e.target.textContent};$('pcall').onclick=callNum;$('pdel').onclick=()=>{$('pn').value=$('pn').value.slice(0,-1)}},
msg:c=>{c.innerHTML=MSGS.map(m=>`<div class="pcard"><b>${m[0]}</b>${m[1]}</div>`).join('')},
cam:c=>{c.innerHTML='<div class="vf"><i></i><i></i><i></i><i></i><button id="pcm" aria-label="Fotoğraf çek"></button></div>';$('pcm').onclick=()=>{closePh();setTimeout(()=>{if(window.startSelfie)window.startSelfie();else window.SNAP=1},150)}},
taxi:c=>{c.innerHTML='<div class="pcard"><b>Taksi</b>Bulunduğun yere en yakın taksi gönderilir.</div><button id="ptx" class="pbig">TAKSİ ÇAĞIR</button>';$('ptx').onclick=()=>{closePh();callTaxi()}},
map:c=>{c.innerHTML='<div class="pcard"><b>Harita</b>Tam ekran harita: yakınlaştır, sürükle, dokunup GPS işareti koy.</div><button id="pmo" class="pbig b">HARİTAYI AÇ</button>';$('pmo').onclick=()=>{closePh();setTimeout(()=>{if(mode==='play')mapT()},120)}},
wa:c=>{waI=-1;waRender()},
set:c=>{const R=[['oSnd','Ses'],['oRain','Yağmur'],['oDay','Gün hızı'],['oGfx','Grafik']];c.innerHTML=R.map(r=>`<button class="prow" data-id="${r[0]}"><span>${r[1]}</span><span class="v">${($(r[0])&&$(r[0]).textContent)||''}</span></button>`).join('');c.onclick=e=>{const b=e.target.closest('.prow');if(!b)return;const o=$(b.dataset.id);if(o){o.click();setTimeout(()=>{b.querySelector('.v').textContent=o.textContent},30)}}}};
function phOpenApp(id){phCur=id;$('phs').classList.add('hid');$('pap').classList.remove('hid');const c=$('pac');c.onclick=null;c.innerHTML='';$('pat').textContent=PH_APPS.find(a=>a[0]===id)[1];PH_VIEW[id](c);c.scrollTop=0}
$('pgrid').innerHTML=PH_APPS.map(a=>`<button class="pap" data-a="${a[0]}"><span class="pic" style="background:${a[2]};--cut:${a[3]}">${PH_IC[a[0]]}</span>${a[1]}</button>`).join('');
$('pgrid').onclick=e=>{const b=e.target.closest('.pap');if(b)phOpenApp(b.dataset.a)};
$('pbk').onclick=()=>{if(phCur==='wa'&&waI>=0){waI=-1;waRender()}else phHome()};$('phm').onclick=phHome;$('px').onclick=closePh;
/* ---- hub ---- */
$('hub').onclick=()=>$('hubp').classList.toggle('hid');$('hCmd').onclick=()=>{$('hubp').classList.add('hid');cmdOpen()};$('hRad').onclick=()=>$('rd').click();$('hTel').onclick=()=>{$('hubp').classList.add('hid');openPh()};
/* ---- hesap / oda ---- */
let USR=null,ROOM_OK=0;const US=()=>JSON.parse(localStorage.getItem('g67u')||'{}');try{const cu=localStorage.getItem('g67cur');if(cu&&US()[cu])USR=cu}catch(e){}
const HP=async p=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('g67:'+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return btoa(p)}};
const toRoom=u=>{USR=u;try{localStorage.setItem('g67cur',u)}catch(e){}$('acc').classList.add('hid');rmShow(1)};
function rmShow(n){$('rmx').classList.remove('hid');for(let i=1;i<=3;i++)$('rs'+i).classList.toggle('hid',i!==n);$('rt').textContent=n===2?'ODA OLUŞTUR':n===3?'ODA GİR':'ÇEVRİMİÇİ';$('rc').textContent='';$('rl').innerHTML=''}
$('aReg').onclick=async()=>{const u=$('au').value.trim(),p=$('ap').value;if(u.length<3||p.length<3)return $('am').textContent='Kullanıcı adı ve şifre en az 3 karakter';const d=US();if(d[u])return $('am').textContent='Bu kullanıcı adı alınmış, GİR\'e bas';d[u]=await HP(p);localStorage.setItem('g67u',JSON.stringify(d));$('am').textContent='';toRoom(u)};
$('aLog').onclick=async()=>{const u=$('au').value.trim(),p=$('ap').value,d=US();if(!d[u])return $('am').textContent='Hesap yok. Önce KAYIT OL';if(d[u]===await HP(p)||d[u]===btoa(p))toRoom(u);else $('am').textContent='Hatalı şifre'};
$('bOnl').onclick=()=>{$('menu').classList.add('hid');if(USR)rmShow(1);else{$('am').textContent='Çevrimiçi oynamak için kayıt ol veya giriş yap';$('acc').classList.remove('hid')}};
$('aBack').onclick=()=>{$('acc').classList.add('hid');$('menu').classList.remove('hid')};$('rBack').onclick=()=>{if(!$('rs1').classList.contains('hid')){$('rmx').classList.add('hid');$('menu').classList.remove('hid')}else rmShow(1)};
$('rGoMk').onclick=()=>{rmShow(2);$('rn').value=$('rn').value||((USR||'Oyuncu')+' odası');rcCnt()};$('rGoJn').onclick=()=>rmShow(3);
function rcCnt(){$('lRN').textContent='NPC SAYISI: '+$('sRN').value+' / 250';$('lRC').textContent='ARAÇ SAYISI: '+$('sRC').value+' / 275'}$('sRN').oninput=$('sRC').oninput=rcCnt;
$('rOff').onclick=()=>{ROOM_OK=1;$('rmx').classList.add('hid');$('bPlay').click()};
$('rMk').onclick=()=>{const c=String(Math.floor(1000000+Math.random()*9000000));$('rc').textContent='Oda kodu: '+c+($('rp').value?' (şifreli)':'')+' • max 4 kişi';ROOM_OK=1;startMates();setTimeout(()=>{$('rmx').classList.add('hid');$('bPlay').click()},1800)};
/* ---- atmosfer ---- */
{const mk=(c,s)=>{const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),r=x.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,c);r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,64,64);return new T.CanvasTexture(cv)},ct=mk('rgba(255,255,255,.95)'),sunT=mk('#fff6c0'),moonT=mk('#cfe3ff'),CL=[];
 const sp_=(t,o,s)=>{const m=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,opacity:o,fog:false,depthWrite:false}));m.scale.set(s,s,1);scene.add(m);return m};
 for(let i=0;i<22;i++){const c=sp_(ct,.75,110+Math.random()*90);c.scale.y*=.45;c.userData={a:Math.random()*6.28,r:200+Math.random()*450,y:150+Math.random()*60};CL.push(c)}
 const sn=sp_(sunT,1,150),mn=sp_(moonT,1,90);
 setInterval(()=>{const a=(hour-6)/12*Math.PI,cx=cam.position.x,cz=cam.position.z;sn.position.set(cx+Math.cos(a)*520,Math.sin(a)*420,cz-150);mn.position.set(cx-Math.cos(a)*520,-Math.sin(a)*420,cz+150);sn.visible=Math.sin(a)>-.05;mn.visible=Math.sin(a)<.05;const d=Math.max(.25,Math.min(1,Math.sin(a)+.5));for(const c of CL){const u=c.userData;u.a+=.0004;c.position.set(cx+Math.cos(u.a)*u.r,u.y,cz+Math.sin(u.a)*u.r);c.material.opacity=.75*d*(1-rainI*.3)}},50)}
setTimeout(()=>{say('GTA67 TERMINAL v6.7 [root access]');say('> /fly /unfly /luck /phone /spawn /money /secret ...')},300);

/* ---- spor alanları + toplar + drift (şehre bitişik) ---- */
{const L=c=>new T.MeshLambertMaterial({color:c}),bx=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),L(c));m.position.set(x,y,z);m.userData.ns=1;scene.add(m);return m},FX=-330,FZ=-430,BX=-258,BZ=-430,DX=-318,DZ=-310;
 bx(70,.1,44,0x2e8b3a,FX,.06,FZ);bx(.5,.12,44,0xffffff,FX,.08,FZ);bx(70,.12,.5,0xffffff,FX,.08,FZ-22);bx(70,.12,.5,0xffffff,FX,.08,FZ+22);
 for(const s of[-1,1]){bx(.3,2.4,.3,0xffffff,FX+s*35,1.2,FZ-5);bx(.3,2.4,.3,0xffffff,FX+s*35,1.2,FZ+5);bx(.3,.3,10.3,0xffffff,FX+s*35,2.4,FZ)}
 bx(28,.1,15,0xc9854a,BX,.06,BZ);bx(.4,.12,15,0xffffff,BX,.08,BZ);
 for(const s of[-1,1]){bx(.3,3.2,.3,0x555555,BX+s*13.5,1.6,BZ);bx(1.8,1.2,.2,0xffffff,BX+s*13,3.4,BZ);bx(1,.12,1,0xff6600,BX+s*12.2,2.9,BZ)}
 const dc=new T.Mesh(new T.CylinderGeometry(48,48,.1,40),L(0x2b2b30));dc.position.set(DX,.05,DZ);dc.userData.ns=1;scene.add(dc);
 for(let i=0;i<10;i++){const a=i/10*6.283,c=new T.Mesh(new T.ConeGeometry(.6,1.4,8),L(0xff7a00));c.position.set(DX+Math.cos(a)*34,.7,DZ+Math.sin(a)*34);c.userData.ns=1;scene.add(c)}
 {const rc=new T.Mesh(new T.RingGeometry(66,74,48),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,side:T.DoubleSide}));rc.rotation.x=-Math.PI/2;rc.position.set(-318,.07,208);rc.userData.ns=1;scene.add(rc)}
 const mkB=(r,c,x,z,bn)=>{const m=new T.Mesh(new T.SphereGeometry(r,14,10),L(c));m.userData.ns=1;scene.add(m);return{m,r,x,z,vx:0,vz:0,y:r,vy:0,bn}},BL=[mkB(.7,0xffffff,FX,FZ,0),mkB(.45,0xff7a00,BX,BZ,1)];
 setInterval(()=>{if(mode!=='play')return;for(const b of BL){const dx=b.x-P.x,dz=b.z-P.z,d=Math.hypot(dx,dz);if(!P.car&&d<b.r+1.1&&d>.01){b.vx=dx/d*9;b.vz=dz/d*9;b.vy=b.bn?5:2.5}if(P.car&&d<b.r+2.6&&d>.01){const s=Math.max(8,Math.abs(P.car.v||0)*1.4);b.vx=dx/d*s;b.vz=dz/d*s;b.vy=3}
  b.x+=b.vx*.033;b.z+=b.vz*.033;b.vy-=18*.033;b.y+=b.vy*.033;if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy)*(b.bn?.75:.4);if(b.vy<.8)b.vy=0}b.vx*=.985;b.vz*=.985;b.m.position.set(b.x,b.y,b.z)}},33)}
/* ---- bazuka ---- */
function rocket(){const dx=Math.sin(P.a),dz=Math.cos(P.a);let t=60;for(const c of[...peds.filter(p=>!p.dead),...cars.filter(c=>!c.dead&&c!==P.car)]){const rx=c.x-P.x,rz=c.z-P.z,u=rx*dx+rz*dz;if(u>3&&u<t&&Math.abs(rx*dz-rz*dx)<3)t=u}
 const m=new T.Mesh(new T.SphereGeometry(.4,8,6),new T.MeshBasicMaterial({color:0xffcc33}));m.userData.ns=1;m.position.set(P.x,1.4,P.z);scene.add(m);const ex=P.x+dx*t,ez=P.z+dz*t;let s=0;sfx(.4,.3,300);
 const iv=setInterval(()=>{s+=.1;m.position.set(P.x+(ex-P.x)*s,1.4,P.z+(ez-P.z)*s);if(s>=1){clearInterval(iv);scene.remove(m);boom(ex,ez)}},40)}
function boom(x,z){const f=new T.Mesh(new T.SphereGeometry(1,14,10),new T.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:.9}));f.userData.ns=1;f.position.set(x,2,z);scene.add(f);let k=0;const iv=setInterval(()=>{k++;f.scale.setScalar(1+k*1.6);f.material.opacity=.9-k*.09;if(k>9){clearInterval(iv);scene.remove(f)}},40);sfx(.6,.5,120);heat(40);
 for(const p of peds)if(!p.dead&&Math.hypot(p.x-x,p.z-z)<12)killPed(p);for(const c of cars)if(!c.dead&&c!==P.car&&Math.hypot(c.x-x,c.z-z)<13){c.hp=0;c.dead=1;try{dk(c)}catch(e){}}if(Math.hypot(P.x-x,P.z-z)<8&&!P.god){P.hp-=40}}
/* ---- sohbet ---- */
const CN=['Ayşe','Mehmet','Kral34','Zeynep','Burak','NightRider','Selin','Ekber'],CR=['Selam! Nerelisin?','Bu şehirde pavyon çok iyi bence','Kumarhanede şansım hiç yok','Yarış için hazır mısın?','/luck komutunu duydun mu :)','Bazuka aldım, herkes kaçsın','Garaj bu hafta çok kalabalık','Taksi çağırmak için telefonda 100'];
function openChat(){if(mode!=='play'||!ONL)return;mode='chat';$('cht').classList.remove('hid');chm('Sohbet odası: '+(USR||'misafir')+(ONL_CODE?' • Map ID: '+ONL_CODE:''))}
function chm(t){const d=document.createElement('div');d.textContent=t;$('chl').appendChild(d);$('chl').scrollTop=1e9;if(window.feedAdd&&mode!=='chat')feedAdd(t,1)}
$('chs').onclick=()=>{};
$('chx').onclick=()=>{$('cht').classList.add('hid');mode='play'};

var MATES=[];
function startMates(){if(MATES.length)return;['#ff4d4d','#4dd2ff','#ffd24d'].forEach((c,i)=>{const m=new T.Mesh(gBox,M(c));m.scale.set(.6,1.7,.6);m.userData.ns=1;scene.add(m);MATES.push({c,m,x:P.x+6+i*4,z:P.z+6,a:Math.random()*6.28,n:'Oyuncu'+(i+2)})})}
setInterval(()=>{for(const q of MATES){if(!q.bot)continue;if(Math.random()<.04)q.a+=(Math.random()-.5)*2.5;const nx=q.x+Math.sin(q.a)*.12,nz=q.z+Math.cos(q.a)*.12;if(hitB(nx,nz,1))q.a+=2;else{q.x=nx;q.z=nz}q.m.position.set(q.x,.9,q.z)}
 for(const c of cars)if(c.air){const t=(P.car===c)?(c.fly?(c.alt||0):(c.vt==='heli'?16:30)):(c.fly?(c.alt||0):0);c.pg.position.y+=(t-c.pg.position.y)*(c.fly?1:.05);if(c.rotor){if(c.vt==='heli')c.rotor.rotation.y+=c.pg.position.y>.5?.9:0;else c.rotor.rotation.z+=.9}}},33);
/* ---------- v12 eklemeler ---------- */
function signTex(txt,col){const k=txt+col;if(sgc[k])return sgc[k];const cv=document.createElement('canvas');cv.width=512;cv.height=128;const g=cv.getContext('2d');g.fillStyle='rgba(8,10,16,.9)';g.fillRect(0,0,512,128);g.strokeStyle=col;g.lineWidth=8;g.strokeRect(6,6,500,116);let f=64;g.font='bold '+f+'px sans-serif';while(g.measureText(txt.toUpperCase()).width>470&&f>20){f-=4;g.font='bold '+f+'px sans-serif'}g.textAlign='center';g.textBaseline='middle';g.shadowColor=col;g.shadowBlur=16;g.fillStyle='#fff';g.fillText(txt.toUpperCase(),256,68);return sgc[k]=new T.CanvasTexture(cv)}
function pay(n){if(P.money<n){toast('Paran yetmiyor');return false}P.money-=n;return true}
const cdM=new Map();const once=(k,sec,f)=>()=>{if((cdM.get(k)||-99)>tt-sec){toast('Biraz bekle');return}cdM.set(k,tt);f()};
function slot(){if(!pay(50))return;const Y=['7','★','♦','♣','♥','BAR'],a=[0,0,0].map(()=>Y[R()*6|0]);let w=0;if(a[0]===a[1]&&a[1]===a[2])w=a[0]==='7'?1500:500;else if(a[0]===a[1]||a[1]===a[2]||a[0]===a[2])w=70;P.money+=w;toast('[ '+a.join(' | ')+' ] '+(w?'KAZANDIN +$'+w:'Kaybettin −$50'));tone(w?880:200,.2,'square',.06)}
function bj(b){if(!pay(b))return;const dr=()=>Math.min(10,1+(R()*13|0));let p=dr()+dr(),d=dr()+dr();while(p<17&&R()<.9)p+=dr();while(d<17)d+=dr();const r=p>21?-1:(d>21||p>d)?1:p===d?0:-1;P.money+=r>0?b*2:r===0?b:0;toast('Sen '+p+' · Krupiye '+d+' → '+(r>0?'KAZANDIN +$'+b:r===0?'Berabere':'Kaybettin −$'+b))}
function poker(){if(!pay(200))return;const H=['Yüksek kart','Çift','İki çift','Üçlü','Straight','Flush','Full house','Kare','Royal flush'],W=[0,150,300,450,700,900,1400,3000,8000],pr=[.45,.3,.1,.07,.03,.025,.012,.008,.005];let x=R(),i=0,a=0;for(;i<8;i++){a+=pr[i];if(x<a)break}P.money+=W[i];toast('El: '+H[i]+(W[i]?' +$'+W[i]:' — kaybettin'))}
function rulet(){if(!pay(100))return;const n=R()*37|0,win=n>0&&n%2===1;if(win)P.money+=200;toast('Top '+n+' ('+(n===0?'yeşil':n%2?'kırmızı':'siyah')+') — kırmızıya oynadın: '+(win?'+$100':'−$100'))}
const BZ={cafe:['Kafe',8000,60],market:['Market',15000,120],club:['Pavyon',35000,320],casino:['Kumarhane',60000,600]};
const bizInc=()=>Object.keys(BIZ).reduce((a,k)=>a+BZ[k][2]*BIZ[k],0);
function bizItems(){return Object.keys(BZ).map(k=>{const[n,pr,inc]=BZ[k],l=BIZ[k]|0;return[(l?n+' geliştir (Sv '+(l+1)+')':n+' aç')+' · +$'+inc+'/dk',Math.round(pr*(l?1.6*l:1)),()=>{BIZ[k]=l+1;toast(n+(l?' geliştirildi':' açıldı')+'! Toplam gelir $'+bizInc()+'/dk')}]})}
{const E0=SH.emlak;Object.defineProperty(SH,'emlak',{get:()=>[...E0,...bizItems()],configurable:true})}
{let n=0;setInterval(()=>{const i=bizInc();if(!i||mode==='menu'||mode==='dead')return;P.money+=Math.round(i/6);if(++n%6===0)toast('İşletme geliri +$'+i)},10000)}
function decorRoom(t,b,w,c){const hx=n=>'#'+n.toString(16).padStart(6,'0'),st=(x,z,l,go,r)=>PLAYS.push({x,z,l,go,r:r||2.1});
 for(const x of[-11.6,11.6])for(const z of[-8.6,7]){b(.8,.5,.8,x,.25,z,0x8a5a2b);b(1.1,1.4,1.1,x,1.2,z,0x2e8b57)}
 if(t!=='club')b(8,.03,5,0,.02,1.5,c);
 [-10,-7.5,7.5,10].forEach((x,i)=>{b(2.9,1.9,.1,x,2.9,-9.78,0x1b1b1f);b(2.5,1.5,.1,x,2.9,-9.7,[0xff6b6b,0x4dd2ff,0xffd24d,0x9b59b6][i],1)});
 for(const[x,z]of[[-6,0],[6,0],[-6,6],[6,6]])b(2,.1,.8,x,4.4,z,0xffffee,1);
 {const sg=new T.Mesh(new T.PlaneGeometry(8,2),new T.MeshBasicMaterial({map:signTex(INT.n,hx(c)),transparent:true}));sg.position.set(R0X,3.2,R0Z-9.6);ROOM.add(sg)}
 if(t==='casino'){for(const z of[-4,0,4]){b(1.3,2.4,1.5,11.7,1.2,z,0x8b1a1a);b(.1,.9,1,10.98,1.7,z,0xffe14d,1);b(.5,.1,1,11,.55,z,0xaaaaaa);st(10,z,'Slot oyna ($50)',slot)}
  for(const[z,l,f]of[[-1,'Blackjack ($100)',()=>bj(100)],[4,'Poker ($200)',poker]]){b(4.2,.9,2.6,-8.5,.45,z,0x0b6b3a);b(4.5,.12,2.9,-8.5,.95,z,0x5a2d0c);for(let i=0;i<3;i++)b(.55,.03,.8,-9.5+i,1.03,z,0xffffff,1);st(-5.6,z,l,f,2.2)}
  b(3,.9,3,5,.45,3,0x7a0f0f);b(2.4,.1,2.4,5,.95,3,0x111111);for(let i=0;i<6;i++)b(.4,.05,.4,4.2+(i%3)*.8,1.02,2.2+(i/3|0)*.8,i%2?0xdd2222:0xeeeeee,1);st(5,5.4,'Rulet ($100)',rulet,2)}
 else if(t==='club'){b(4,1.1,1.6,-8,.55,-8.2,0x222233);b(3.6,.08,1.2,-8,1.15,-8.2,0xff2fa8,1);st(-8,-6.2,'DJ: şarkıyı değiştir',()=>{RAD=(RAD+1)%5;toast('Radyo: '+['Neon FM','Synth FM','Retro Jazz','Lo-Fi Gece','Kapalı'][RAD])},1.9)}
 else if(t==='gym'){b(1.2,.5,3,-8,.25,4,0x333344);b(3.4,.2,.2,-8,1.1,4,0xaaaaaa);st(-8,4,'Bench press',once('bench',20,()=>{P.boost=90;toast('Güçlendin! 90 sn enerji')}));b(1.2,.3,3,8,.25,4,0x222222);b(1.2,1,.3,8,.9,2.7,0x111111);st(8,4,'Koşu bandı',once('tm',20,()=>{P.boost=150;heal(10)}))}
 else{b(4,.6,1.4,-9.5,.3,3.5,0x8d5a2b);b(4,1.2,.4,-9.5,.9,4.3,0x8d5a2b);st(-9.5,3.5,'Otur ve dinlen (+can)',once('sit',25,()=>heal(15)))}
 if(t==='ammu'){for(const x of[-12.6,12.6])for(const z of[-6,-2,2,6]){b(.1,1.2,2.2,x,2.5,z,0x2a2d33);b(.14,.14,1.1,x,2.7,z,0x111111);b(.14,.5,.25,x,2.3,z+.4,0x111111)}st(8,2,'Atış poligonu ($20)',()=>{if(!pay(20))return;const h=R()*11|0;P.money+=h*7;toast('Poligon: 10 atışta '+h+' isabet'+(h*7?' +$'+h*7:''))})}
 if(t==='clothes'){b(.2,3,2.6,12.7,2,0,0xbfe3ff,1);st(9,0,'Aynada yeni stil dene',()=>{const rc=()=>'#'+(R()*0xffffff|0).toString(16).padStart(6,'0');dress(rc(),rc());toast('Yeni stil!')})}
 if(t==='pharm')st(8,2,'Tansiyon ölç (+can)',once('bp',30,()=>heal(8)));
 if(t==='emlak')st(8,2,'İşletme defteri',()=>toast(bizInc()?'İşletme gelirin: $'+bizInc()+'/dk':'Henüz işletmen yok — tezgâhtan aç'));
 if(t==='market')st(8,2,'Ücretsiz numune',once('smp',40,()=>heal(5)));
 if(t==='galeri'||t==='mod'||t==='garage')st(8,2,'Aracı incele',()=>toast('Motor sesi harika...'))}
function breakGlass(c){if(c.gb)return;c.gb=1;c.m.traverse(o=>{if(o.isMesh&&o.material&&!Array.isArray(o.material)&&o.material.userData&&o.material.userData.glass){o.userData.og=o.material;o.material=crackM}});sfx(.3,.2,3000);for(let i=0;i<5;i++)puff(c.x,1.3,c.z,0xcfe8ff)}
function flatTire(c){c.flat=(c.flat|0)+1;if(c.flat>4)c.flat=4;if(c.y0===undefined){c.y0=c.pg.position.y;c.mx0=c.mx;c.sp0=c.sp}c.pg.rotation.z+=(R()<.5?-1:1)*.03;c.pg.position.y=c.y0-.05*c.flat;c.mx=c.flat>1?9:16;c.sp=Math.min(c.sp||9,3);puff(c.x,.3,c.z,0x222222);sfx(.3,.15,900);toast('Lastik patladı!')}
function fixCar(c){c.gb=0;c.dent=0;c.m.traverse(o=>{if(o.userData.og){o.material=o.userData.og;o.userData.og=null}});c.pg.scale.set(1,1,1);if(c.flat){c.flat=0;c.pg.rotation.z=0;c.pg.position.y=c.y0;c.mx=c.mx0;c.sp=c.sp0}}
function dmgTick(dt){for(const c of cars){if(c.dead||!c.pg)continue;if(c.hp>=95)continue;if(!c.gb&&c.hp<88)breakGlass(c);if(!c.dent&&c.hp<50){c.dent=1;c.pg.scale.set(1,.95,.94)}if(c.flat&&c.drv)c.a+=(c.flat%2?1:-1)*.12*dt*clamp(c.v/20,-1,1)}}
function shootCars(dx,dz,bt){let hit=null,bd=bt;for(const c of cars){if(c.dead||c.cop||c===P.car)continue;const rx=c.x-P.x,rz=c.z-P.z,t=rx*dx+rz*dz;if(t<1||t>bd)continue;if(Math.abs(rx*dz-rz*dx)<2.1){bd=t;hit=c}}if(!hit)return;const r=R();if(r<.5)flatTire(hit);else if(r<.8)breakGlass(hit);else{hit.hp-=12;sfx(.2,.15,1200)}puff(P.x+dx*bd,1,P.z+dz*bd,0xffffaa)}
const crackM=new T.MeshBasicMaterial({map:ct(128,128,g=>{g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=2;for(let i=0;i<9;i++){g.beginPath();g.moveTo(64,64);let x=64,y=64,a=i/9*TAU;for(let k=0;k<4;k++){a+=(R()-.5)*.8;x+=Math.cos(a)*20;y+=Math.sin(a)*20;g.lineTo(x,y)}g.stroke()}}),transparent:true,opacity:.85,color:0xdfeaff,depthWrite:false,side:T.DoubleSide});
glassM.transparent=true;glassM.opacity=.45;glassM.depthWrite=false;glassM.userData.glass=1;
function autoPilot(c){}
function seatToggle(){if(P.car&&ONL)NET.swap()}
const tf=document.createElement('div');tf.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .5s;z-index:60;display:flex;align-items:center;justify-content:center;color:#ffd23c;font:700 26px sans-serif';document.body.appendChild(tf);
function taxiGo(x,z){const k=TAXI.car;let bs=null,bd=1e9;for(const r of roads){const px=r.ax==='z'?r.c:clamp(x,r.a0+8,r.a1-8),pz=r.ax==='z'?clamp(z,r.a0+8,r.a1-8):r.c,d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;bs=[px,pz,r.ax==='z'?0:Math.PI/2]}}
 if(!bs||bd>60){toast('Oraya yol yok — yola yakın bir yer seç');return}
 const d=Math.hypot(bs[0]-k.x,bs[1]-k.z),fare=Math.round(8+d*.22);if(P.money<fare){toast('Taksi ücreti $'+fare+' — paran yetmiyor');return}
 P.money-=fare;TAXI=null;mode='play';$('fm').classList.add('hid');tf.textContent='Taksi yolda · −$'+fare;tf.style.opacity=1;
 setTimeout(()=>{k.x=bs[0];k.z=bs[1];k.a=bs[2];k.v=0;hour=(hour+d/900)%24;if(P.car===k)exitCar();k.ai=0;tf.style.opacity=0;toast('Vardık! Ücret $'+fare+' ('+Math.round(d)+' m)');setTimeout(()=>{k.dead=1;k.m.visible=false;k.x=k.z=1e5},4000)},1600)}
function callTaxi(){if(P.car){toast('Önce araçtan in');return}closePh();const k=mkCar(3,'#f2c40f',P.x+Math.sin(P.a)*6,P.z+Math.cos(P.a)*6,P.a+Math.PI);try{skin(k)}catch(e){}k.ai=0;k.taxi=1;enter(k);TAXI={car:k,pick:1};setTimeout(()=>{if(mode==='play')mapT()},350);toast('Taksiye bindin — haritada gideceğin yeri seç')}
{const bt=document.createElement('button');bt.style.cssText='position:fixed;left:12px;top:46%;z-index:30;padding:10px 14px;font:700 14px sans-serif;border-radius:10px;border:2px solid #fff;background:#7b2ff7;color:#fff;display:none';bt.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();seatToggle()});document.body.appendChild(bt);setInterval(()=>{bt.style.display=(P.car&&mode==='play'&&ONL)?'block':'none';bt.textContent='KOLTUK • '+(NET.seatName?NET.seatName():'')},300)}

/* ---------- v13: yeni mekanlar ---------- */
for(const[k,,,,w,c,ic]of NT){RC[k]=[w,c];IMAP[k]=ic}Object.assign(ICO,NIC);
Object.assign(ICO,{pizza:g=>{g.beginPath();g.moveTo(-.85,-.7);g.lineTo(.85,-.7);g.lineTo(0,.95);g.fill()},
 bus:(g,c)=>{g.fillRect(-.9,-.65,1.8,1.2);g.fillStyle=c;g.fillRect(-.72,-.45,.5,.4);g.fillRect(-.1,-.45,.5,.4);g.fillRect(.5,-.45,.3,.4);g.fillStyle='#10131c';g.beginPath();g.arc(-.5,.7,.22,0,6.3);g.fill();g.beginPath();g.arc(.5,.7,.22,0,6.3);g.fill()},
 mail:(g,c)=>{g.fillRect(-.9,-.55,1.8,1.1);g.strokeStyle=c;g.lineWidth=.16;g.beginPath();g.moveTo(-.9,-.55);g.lineTo(0,.1);g.lineTo(.9,-.55);g.stroke()},
 tow:g=>{g.lineWidth=.3;g.beginPath();g.moveTo(.2,-.9);g.lineTo(.2,.2);g.arc(-.2,.2,.4,0,Math.PI);g.stroke()},
 bin:g=>{g.beginPath();g.moveTo(-.6,-.4);g.lineTo(.6,-.4);g.lineTo(.45,.9);g.lineTo(-.45,.9);g.fill();g.fillRect(-.8,-.7,1.6,.2);g.fillRect(-.2,-.9,.4,.2)},
 key:g=>{g.lineWidth=.26;g.beginPath();g.arc(-.4,0,.4,0,6.3);g.stroke();g.beginPath();g.moveTo(0,0);g.lineTo(.9,0);g.moveTo(.6,0);g.lineTo(.6,.45);g.stroke()},
 chat:g=>{g.beginPath();g.ellipse(0,-.1,.9,.6,0,0,6.3);g.fill();g.beginPath();g.moveTo(-.4,.3);g.lineTo(-.6,.9);g.lineTo(.15,.45);g.fill()},
 chk:g=>{g.lineWidth=.2;g.beginPath();g.moveTo(-.75,-.9);g.lineTo(-.75,.9);g.stroke();for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(-.6+i*.5,-.85+j*.5,.5,.5)},
 dice:(g,c)=>{g.fillRect(-.75,-.75,1.5,1.5);g.fillStyle=c;for(const[x,y]of[[-.4,-.4],[.4,.4],[0,0],[.4,-.4],[-.4,.4]]){g.beginPath();g.arc(x,y,.14,0,6.3);g.fill()}}});
Object.assign(IMAP,{pizza:'pizza',cargo:'box',bus:'bus',mail:'mail',tow:'tow',garbage:'bin',emlak:'key',chat:'chat',race:'chk',casino:'dice'});
let BNK=0;setInterval(()=>{if(BNK&&mode==='play')BNK=Math.round(BNK*1.01)},60000);
const gam=(n,pr,win,txt)=>()=>{const w=R()<win;if(w)P.money+=Math.round(pr*2.2);toast(txt+(w?' — KAZANDIN +$'+Math.round(pr*1.2):' — olmadı −$'+pr))};
const carFix=(a,pr)=>[a,pr,()=>{const c=P.last;if(!c||c.dead){toast('Önce bir araç kullan');return false}c.hp=100;fixCar(c);toast('Araç hazır')}];
const sleepH=n=>{hour=(hour+n)%24;P.hp=100};
Object.assign(SH,{
hastane:[['Muayene',50,()=>heal(100)],['Kurşun yeleği',180,()=>{P.arm=1;toast('Yelek takıldı')}],['Kan bağışı (+$80)',0,()=>{if(P.hp<40){toast('Çok zayıfsın');return false}P.hp-=20;P.money+=80;toast('+$80')}]],
karakol:[['Sicil temizle',500,()=>{P.heat=0;toast('Arama kaydın silindi')}],['İhbar ver (+$150)',0,once('ihb',60,()=>{P.money+=150;toast('+$150 ödül')})],['Polis kahvesi',10,()=>heal(10)]],
banka:[['Yatır $1000',1000,()=>{BNK+=1000;toast('Hesap: $'+BNK+' (dakikada %1 faiz)')}],['Hepsini çek',0,()=>{if(!BNK){toast('Hesap boş');return false}P.money+=BNK;toast('Çekildi $'+BNK);BNK=0}],['Bakiye sorgula',0,()=>toast('Hesabında $'+BNK+' var')]],
otel:[['Oda (uyu +8 saat)',150,()=>{sleepH(8);toast('İyi uyudun')}],['Spa',100,()=>{heal(100);P.boost=90}],['Kahvaltı',40,()=>heal(40)],['VIP süit (+12 saat)',500,()=>{sleepH(12);P.boost=300;toast('Süper dinlendin')}]],
sinema:[['Komedi bileti',40,()=>{heal(15);toast('Çok güldün')}],['Korku bileti',50,()=>{heal(10);toast('Çığlık çığlığa...')}],['Mısır + kola',25,()=>heal(20)]],
bowling:[['Bir oyun',60,()=>{const s=R()*11|0;if(s>=8){P.money+=150;toast('STRIKE! '+s+' lobut +$150')}else toast(s+' lobut devirdin')}],['Pizza',35,()=>heal(35)]],
berber:[['Saç tıraşı',40,()=>toast('Yepyeni göründün')],['Saç boyası',70,()=>{const c='#'+(R()*0xffffff|0).toString(16).padStart(6,'0');P.mesh.traverse(o=>{if(o.geometry===gHair||(o.material&&o.material.name==='hair')){o.material=o.material.clone();o.material.color.set(c)}});toast('Yeni saç rengi')}],['Sakal bakımı',30,()=>heal(5)]],
benzinlik:[carFix('Araç tamir + dolum',60),['Enerji içeceği',20,()=>{P.boost=60;toast('Enerji!')}],['Sigara yok, sakız',5,()=>heal(2)]],
yikama:[carFix('Araç yıka (tamir)',80),['Cila (ekstra can)',120,()=>{const c=P.last;if(!c||c.dead){toast('Araç yok');return false}c.hp=100;fixCar(c);toast('Parlıyor!')}]],
kutuphane:[['Roman oku',15,()=>{heal(10);toast('Güzel kitaptı')}],['Sessiz köşe',0,()=>heal(5)]],
muze:[['Giriş bileti',30,()=>{heal(10);toast('Tarihi eserleri gezdin')}],['Rehberli tur',80,()=>{P.boost=90;toast('Çok şey öğrendin')}]],
arcade:[['Pinball ($25)',25,gam('p',25,.4,'Pinball')],['Yarış oyunu ($40)',40,gam('y',40,.4,'Yarış')],['Dans makinesi ($60)',60,gam('d',60,.35,'Dans')]],
havuz:[['Yüzme',30,()=>{heal(30);P.boost=60}],['Sauna',50,()=>heal(60)]],
firin:[['Simit',5,()=>heal(8)],['Poğaça',10,()=>heal(15)],['Pasta',40,()=>heal(40)]],
cicekci:[['Gül buketi',60,()=>{heal(15);toast('Güzel kokuyor')}],['Papatya',20,()=>heal(5)],['Saksı çiçeği',35,()=>toast('Eve güzel gider')]],
kuyumcu:[['Altın yüzük',500,()=>{P.ring=1;toast('Yüzük aldın')}],['Yüzük sat (+$350)',0,()=>{if(!P.ring){toast('Yüzüğün yok');return false}P.ring=0;P.money+=350;toast('+$350')}]],
telefon:[['Telefon kılıfı',40,()=>toast('Şık kılıf')],['Şarj aleti',25,()=>toast('Şarj doldu')],['Yeni telefon',300,()=>toast('Telefon yenilendi')]],
dovme:[['Dövme yaptır',150,()=>{P.dm=(P.dm||1)*1.05;toast('Sert görünüyorsun: hasar +%5')}],['Piercing',60,()=>toast('Havalısın')]],
itfaiye:[['Gönüllü ol (+$80)',0,once('itf',60,()=>{P.money+=80;toast('Yangın tatbikatı +$80')})],['Bağış',100,()=>toast('Teşekkürler!')]],
petshop:[['Mama',20,()=>heal(5)],['Kedi sahiplen',100,()=>toast('Kedin seni bekliyor')],['Kuş yemi',10,()=>toast('Kuşlar mutlu')]],
dondurma:[['Dondurma',10,()=>heal(10)],['Üçlü top',25,()=>heal(25)],['Milkshake',20,()=>heal(15)]],
kitapci:[['Roman',25,()=>toast('Güzel bir roman')],['Şehir haritası',40,()=>toast('Harita incelendi')],['Gazete',5,()=>toast('Gündem karışık')]],
tiyatro:[['Oyun bileti',60,()=>{heal(20);toast('Alkışlar!')}],['Balkon koltuğu',120,()=>{heal(40);P.boost=60}]],
hamam:[['Hamam + kese',80,()=>{heal(100);P.boost=120}],['Çay',8,()=>heal(8)]],
bilardo:[['Bir el ($50)',50,gam('b',50,.45,'Bilardo')],['Bahisli maç ($200)',200,gam('bm',200,.4,'Bilardo maçı')],['Çay',8,()=>heal(8)]],
balik:[['Balık ekmek',30,()=>heal(35)],['Taze balık',70,()=>heal(70)],['Hamsi tava',45,()=>heal(50)]],
lastikci:[carFix('Lastik + cam değiştir',60),['Jant cilası',80,()=>toast('Jantlar parlıyor')]],
parfum:[['Parfüm',100,()=>toast('Güzel kokuyorsun')],['Kolonya',20,()=>heal(3)]],
oyuncak:[['Oyuncak araba',40,()=>toast('Vroom!')],['Peluş ayı',30,()=>toast('Sevimli')],['Lego seti',90,()=>toast('Saatlerce vakit geçer')]]});
const STN_NEW={bowling:['Bowling at ($40)',()=>{if(!pay(40))return;const s=R()*11|0;if(s>=8)P.money+=120;toast(s+' lobut'+(s>=8?' STRIKE +$120':''))}],arcade:['Oyun makinesi ($25)',gam('a',25,.4,'Skor')],bilardo:['Bilardo masası ($50)',gam('bl',50,.45,'Bilardo')],havuz:['Havuza dal',once('pl',20,()=>{heal(20);P.boost=45})],sinema:['Perdeyi izle',once('sn',25,()=>heal(10))],hastane:['Yatağa uzan (+can)',once('hb',30,()=>heal(25))],banka:['ATM: bakiye',()=>toast('Hesabında $'+BNK)],berber:['Koltuğa otur',once('br',30,()=>heal(5))],hamam:['Sıcak mermer',once('hm',30,()=>heal(20))],muze:['Tabloyu incele',()=>toast('Güzel bir eser')],tiyatro:['Sahneye çık',once('th',30,()=>{P.money+=40;toast('Alkış +$40')})],kuyumcu:['Vitrine bak',()=>toast('Pırıl pırıl')],lastikci:['Lastik yığını',()=>toast('Lastik kokusu')]};
{const dr0=decorRoom;decorRoom=function(t,b,w,c){dr0(t,b,w,c);const q=STN_NEW[t];if(q){b(3,.9,2.4,8,.45,4,0x555555);PLAYS.push({x:8,z:4,l:q[0],go:q[1],r:2.4})}}}

/* ---------- v17: trafik ışıkları + tabelalar (GLB), NPC/araç ayarı, çevrimiçi (Replit) ---------- */
const TL={ints:[],N:36,lastP:-1,sg:[]};
(function(){const seen={};for(const rz of roads){if(rz.ax!=='z')continue;for(const rx of roads){if(rx.ax!=='x')continue;
 const mz=rx.w/2+3,mx=rz.w/2+3;
 if(rx.c>rz.a0+mz&&rx.c<rz.a1-mz&&rz.c>rx.a0+mx&&rz.c<rx.a1-mx){const key=Math.round(rz.c/3)+','+Math.round(rx.c/3);if(seen[key])continue;seen[key]=1;
  TL.ints.push({x:rz.c,z:rx.c,hw:rz.w/2,hd:rx.w/2});(rz.ints=rz.ints||[]).push({s:rx.c,hw:rx.w/2});(rx.ints=rx.ints||[]).push({s:rz.c,hw:rz.w/2})}}}})();
/* 0: z yeşil, 1: z sarı, 2: x yeşil, 3: x sarı  (toplam 20 sn) */
function tlPhase(){const t=(ONL?NET.nt():tt)%20;return t<8?0:t<10?1:t<18?2:3}
function tlSt(ax){const p=tlPhase();return ax==='z'?(p===0?'g':p===1?'y':'r'):(p===2?'g':p===3?'y':'r')}
function tlStop(c){const rd=c.rd;if(!rd||!rd.ints||!rd.ints.length||c.drv)return 0;const st=tlSt(rd.ax);if(st==='g')return 0;const s=rd.ax==='z'?c.z:c.x;
 for(const it of rd.ints){const d=c.dir>0?it.s-s:s-it.s,line=it.hw+3;if(d>line-1.2&&d<line+(st==='y'?4:11))return 1}return 0}
const TLM={};for(const a of['z','x'])TLM[a]={g:new T.MeshBasicMaterial({color:0x0f2a14}),y:new T.MeshBasicMaterial({color:0x2e2606}),r:new T.MeshBasicMaterial({color:0x3a0c0a})};
const TLH={g:[0x3dff5a,0x0f2a14],y:[0xffd23c,0x2e2606],r:[0xff3b2f,0x3a0c0a]};
function tlColors(){const p=tlPhase();if(p===TL.lastP)return;TL.lastP=p;for(const a of['z','x']){const s=tlSt(a);for(const k of['g','y','r'])TLM[a][k].color.setHex(TLH[k][s===k?0:1])}}
let TLP=null,TLD={z:[],x:[]};const _b=new T.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1),_o=new T.Object3D(),_m=new T.Matrix4();
function trafficLights(sc){const ms=[];sc.traverse(o=>{if(o.isMesh)ms.push(o)});const pole=ms[1];if(!pole||!TL.ints.length)return;
 const mk=(geo,mat)=>{const im=new T.InstancedMesh(geo,mat,TL.N*4);im.count=0;im.frustumCulled=false;im.userData.ns=1;scene.add(im);return im};
 const pm=pLam(pole.material);TLP=mk(pole.geometry,pm);
 const lamp=x=>{const g=new T.CircleGeometry(.112,14);g.rotateX(-Math.PI/2);g.translate(x,.15,-1.679);return g},LX={g:2.691,y:2.982,r:3.274};
 for(const a of['z','x'])for(const k of['g','y','r'])TLD[a].push(mk(lamp(LX[k]),TLM[a][k]));
 tlRefresh();tlColors();setInterval(()=>{try{tlRefresh();tlColors();signsVis()}catch(e){}},300)}
function tlRefresh(){if(!TLP)return;const cx=cam.position.x,cz=cam.position.z,near=[];
 for(const it of TL.ints){const d=(it.x-cx)*(it.x-cx)+(it.z-cz)*(it.z-cz);if(d<150*150)near.push([d,it])}
 near.sort((a,b)=>a[0]-b[0]);if(near.length>TL.N)near.length=TL.N;
 let n=0,nz=0,nx=0;const sc=1.7;
 for(const [,it] of near){const hx=it.hw+1.4,hz=it.hd+1.4;
  for(const q of[[it.x+hx,it.z+hz,0,'z'],[it.x-hx,it.z-hz,Math.PI,'z'],[it.x+hx,it.z-hz,Math.PI/2,'x'],[it.x-hx,it.z+hz,-Math.PI/2,'x']]){
   _o.position.set(q[0],0,q[1]);_o.rotation.set(0,q[2],0);_o.scale.setScalar(sc);_o.updateMatrix();_m.multiplyMatrices(_o.matrix,_b);
   TLP.setMatrixAt(n++,_m);const ds=TLD[q[3]];const i=q[3]==='z'?nz++:nx++;for(const d of ds)d.setMatrixAt(i,_m)}}
 TLP.count=n;TLP.instanceMatrix.needsUpdate=true;for(const a of['z','x'])for(const d of TLD[a]){d.count=a==='z'?nz:nx;d.instanceMatrix.needsUpdate=true}}
const SGN=[];
function trafficSigns(sc){const ms=[];sc.traverse(o=>{if(o.isMesh)ms.push(o)});
 /* sadece trafik tabelaları (hız, yasak, çalışma, park) */
 const ok=[0,1,2,3,4,5,6,7,8,9,18,19,16,17,20,21,22,23,24,28,39,40,41,42,43],tp=[];
 for(const i of ok){const m=ms[i];if(!m)continue;const mm=new T.MeshLambertMaterial({map:m.material.map||null,color:0xffffff});tp.push([m.geometry,mm])}
 if(!tp.length)return;
 for(const it of TL.ints){const hx=it.hw+1.4,hz=it.hd+1.4,h=(Math.imul(it.x|0,73856093)^Math.imul(it.z|0,19349663))>>>0;
  const ap=[[it.x+hx+.4,it.z+hz+10,0],[it.x-hx-.4,it.z-hz-10,Math.PI],[it.x+hx+10,it.z-hz-.4,Math.PI/2],[it.x-hx-10,it.z+hz+.4,-Math.PI/2]];
  for(let k=0;k<4;k++){if(!((h>>k)&1))continue;const a=ap[k];if(!walk(a[0],a[1]))continue;const t=tp[(h>>>(4+k*3))%tp.length],g=new T.Group(),m=new T.Mesh(t[0],t[1]);
   m.rotation.x=-Math.PI/2;m.scale.setScalar(.1);m.userData.ns=1;g.add(m);g.position.set(a[0],0,a[1]);g.rotation.y=a[2];g.visible=false;g.userData.ns=1;scene.add(g);SGN.push(g)}}}
function signsVis(){const cx=cam.position.x,cz=cam.position.z;for(const g of SGN){const d=(g.position.x-cx)*(g.position.x-cx)+(g.position.z-cz)*(g.position.z-cz);g.visible=d<140*140}}
if(gl&&typeof TB!=='undefined'){
 try{gl.parse(b64(TB.lights),'',g=>{try{trafficLights(g.scene)}catch(e){console.warn('TL',e)}},e=>console.warn('TL glb',e))}catch(e){console.warn(e)}
 try{gl.parse(b64(TB.signs),'',g=>{try{trafficSigns(g.scene);signsVis()}catch(e){console.warn('TS',e)}},e=>console.warn('TS glb',e))}catch(e){console.warn(e)}}

/* ---------- NPC / araç sayısı (ayarlar + ☰ menü), sınır 250 NPC / 275 araç ---------- */
const MAXN=250,MAXC=275;
function applyCounts(){if(ONL){toast('Çevrimiçi modda NPC/araç sayısı herkes için sabit');cntSync();return}S.npc=clamp(S.npc|0,0,MAXN);S.car=clamp(S.car|0,0,MAXC);saveCfg();
 const far=(a,b)=>Math.hypot(b.x-P.x,b.z-P.z)-Math.hypot(a.x-P.x,a.z-P.z);
 const pa=peds.filter(p=>!p.gang&&!p.cop);while(pa.length<S.npc)pa.push(addPed());
 if(pa.length>S.npc){pa.sort(far);for(let n=pa.length-S.npc,i=0;i<n;i++){const p=pa[i],k=peds.indexOf(p);if(k>=0){scene.remove(p.m);peds.splice(k,1)}}}
 const ca=cars.filter(c=>c.ai&&!c.cop&&!c.drv&&!c.dead&&c.rd);while(ca.length<S.car)ca.push(trafficCar());
 if(ca.length>S.car){ca.sort(far);for(let n=ca.length-S.car,i=0;i<n;i++){const c=ca[i],k=cars.indexOf(c);if(k>=0){scene.remove(c.m);cars.splice(k,1)}}}}
function cntSync(){for(const r of[['sNpc','lNpc','npc','NPC',MAXN],['sCar','lCar','car','ARAÇ',MAXC],['sNpc2','lNpc2','npc','NPC',MAXN],['sCar2','lCar2','car','ARAÇ',MAXC]]){const e=$(r[0]);if(!e)continue;e.value=S[r[2]];$(r[1]).textContent=r[3]+' SAYISI: '+S[r[2]]+' / '+r[4]}}
for(const r of[['sNpc','lNpc','npc','NPC',MAXN],['sCar','lCar','car','ARAÇ',MAXC],['sNpc2','lNpc2','npc','NPC',MAXN],['sCar2','lCar2','car','ARAÇ',MAXC]]){const e=$(r[0]);e.max=r[4];e.oninput=()=>{$(r[1]).textContent=r[3]+' SAYISI: '+e.value+' / '+r[4]};e.onchange=()=>{S[r[2]]=clamp(+e.value|0,0,r[4]);applyCounts();cntSync()}}
cntSync();
$('hCnt').onclick=()=>{$('hubp').classList.add('hid');if(mode!=='play')return;mode='cnt';J.x=J.y=0;B.fire=0;cntSync();$('cnt').classList.remove('hid')};
$('cx2').onclick=()=>{$('cnt').classList.add('hid');if(mode==='cnt')mode='play'};

/* ---------- çevrimiçi: Replit relay (WebSocket /ws) ---------- */
const ONL_URL=window.GTA_WS||((/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)&&(location.protocol==='http:'||location.protocol==='https:'))?(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws':'wss://gta67-relay.onrender.com/ws');
let WSK=null,MYID=null,ONL_CB=null;const RMT={};
const rcSay=t=>{$('rc').textContent=t};
const onlName=()=>(USR||'Oyuncu').slice(0,16);
function onlSend(o){if(WSK&&WSK.readyState===1)try{if(WSK.bufferedAmount>30000&&(o.t==='u'||o.t==='w'))return;WSK.send(JSON.stringify(o))}catch(e){}}
function onlOpen(cb,tr){tr=tr|0;if(WSK&&WSK.readyState===1){cb();return}ONL_CB=cb;if(WSK&&WSK.readyState===0)return;
 rcSay(tr?'Sunucu uyanıyor, bekle... ('+tr+'/10)':'Sunucuya bağlanılıyor...');try{WSK=new WebSocket(ONL_URL)}catch(e){rcSay('Bağlanılamadı');return}
 const w=WSK;let opened=0;w.onopen=()=>{if(WSK!==w)return;opened=1;rcSay('Bağlandı');const f=ONL_CB;ONL_CB=null;f&&f()};
 w.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}onlMsg(m)};
 w.onerror=()=>{};
 w.onclose=()=>{if(WSK!==w)return;WSK=null;if(!opened){if(tr<10){const f=ONL_CB;setTimeout(()=>{if(f&&!WSK)onlOpen(f,tr+1)},5000);rcSay('Sunucu uyanıyor, bekle... ('+(tr+1)+'/10)');return}ONL_CB=null;rcSay('Sunucuya ulaşılamadı. Biraz sonra tekrar dene.');return}ONL_CB=null;if(ONL){ONL=0;toast('Sunucu bağlantısı koptu')}for(const id in RMT)rmRemote(id)}}
function onlLeave(){if(WSK)onlSend({t:'leave'});ONL=0;ONL_CODE='';codeBadge.style.display='none';MYID=null;for(const id in RMT)rmRemote(id)}
let ONL_CODE='',LASTJOIN='';
const codeBadge=document.createElement('div');codeBadge.id='rcode';
codeBadge.style.cssText='position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 4px);display:none;z-index:30;pointer-events:auto;background:#000c;color:#ffd23c;border:2px solid #ffd23c;border-radius:6px;padding:2px 10px;font:700 15px Rajdhani,sans-serif;letter-spacing:1px;white-space:nowrap';
codeBadge.onclick=()=>{try{navigator.clipboard.writeText(ONL_CODE);toast('Kod kopyalandı')}catch(e){toast('Kod: '+ONL_CODE)}};
$('hud').appendChild(codeBadge);
function showCode(){codeBadge.textContent='MAP ID: '+ONL_CODE;codeBadge.style.display=ONL&&ONL_CODE?'block':'none'}
function onlStart(room,code){ONL_CODE=code||LASTJOIN;ONL=1;showCode();chm('Oda: '+room+' • Oda kodu: '+ONL_CODE);ROOM_OK=1;rcSay('');$('rmx').classList.add('hid');$('bPlay').click();toast('Oda: '+room+(code?' • kod '+code:''))}
const ERRT={none:'Bu Map ID ile oda bulunamadı',bad:'Şifre yanlış',full:'Oda dolu (4/4)'};
function onlMsg(m){switch(m.t){
 case'created':MYID=m.id;onlStart(m.room,m.code);break;
 case'joined':MYID=m.id;onlStart(m.room,'');break;
 case'err':rcSay(ERRT[m.m]||'Hata');break;
 case'rooms':{const L=$('rl');L.innerHTML='';if(!m.rooms.length){rcSay('Açık oda yok. Oda oluştur!');break}rcSay('Açık odalar:');
  for(const r of m.rooms){const b=document.createElement('button');b.className='mb';b.textContent=r.room+' • '+r.n+'/'+r.max+(r.pw?' 🔒':'')+' • '+r.code;b.onclick=()=>{$('rj').value=r.code;$('rJn').click()};L.appendChild(b)}break}
 case's':updateRemotes(m.p||[]);break;
 case'c':chm(m.n+': '+m.m);if(mode==='play')toast(m.n+': '+m.m);break;
 case'joinedRoom':toast(m.n+' katıldı');break;
 case'left':toast(m.n+' ayrıldı');for(const id in RMT)if(RMT[id].n===m.n)rmRemote(id);break}}
$('rMk').onclick=()=>onlOpen(()=>onlSend({t:'create',room:$('rn').value.trim()||(onlName()+' odası'),pw:$('rp').value,pub:$('rpub').checked,npc:+$('sRN').value,car:+$('sRC').value,name:onlName()}));
$('rJn').onclick=()=>{const c=$('rj').value.trim();if(!/^\d{7}$/.test(c))return rcSay('7 haneli Map ID yaz');LASTJOIN=c;onlOpen(()=>onlSend({t:'join',code:c,pw:$('rjp').value,name:onlName()}))};
$('rLs').onclick=()=>onlOpen(()=>onlSend({t:'list'}));
$('rOff').onclick=()=>{onlLeave();ROOM_OK=1;$('rmx').classList.add('hid');$('bPlay').click()};
const hex6=s=>typeof s==='string'&&/^#[0-9a-fA-F]{6}$/.test(s)?s:'#ffffff';
/* konum gonderimi: js/online2.js */
setInterval(()=>onlSend({t:'ping'}),20000);
addEventListener('pagehide',()=>{try{WSK&&WSK.close()}catch(e){}});
function nameTag(txt){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.font='700 34px Rajdhani,Arial,sans-serif';g.textAlign='center';g.lineWidth=6;g.strokeStyle='#000';g.strokeText(txt,128,44);g.fillStyle='#fff';g.fillText(txt,128,44);
 const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(2.4,.6,1);s.renderOrder=10;s.userData.ns=1;return s}
function rmPerson(id){let g=null;try{if(PRDY){const V=PM.variants,pool=V.boy.concat(V.girl).filter(v=>PG[v.m]);if(pool.length){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))|0;const v=pool[Math.abs(h)%pool.length];g=mkGPed(v.m,v,1)}}}catch(e){console.warn(e)}
 if(!g){g=mkPed('#1b1b1d','#59693f','#e0ac69','#2a1c10','#1c2a4a',1,1);g.traverse(o=>{o.userData.ns=0})}return g}
function mkRemote(q){const root=new T.Group(),m=rmPerson(q.i);scene.add(root);root.add(m);const tag=nameTag(q.n);tag.position.y=2.4;root.add(tag);
 return{id:q.i,n:q.n,c:q.col||'#fff',root,m,tag,car:null,ck:-1,fresh:1,ph:0,spd:0,x:q.x,z:q.z,a:q.a,tx:q.x,tz:q.z,ta:q.a,inCar:0,ci:0,t:performance.now(),bot:0}}
function rmRemote(id){const r=RMT[id];if(!r)return;scene.remove(r.root);delete RMT[id];const k=MATES.indexOf(r);if(k>=0)MATES.splice(k,1)}
function updateRemotes(list){const seen={},now=performance.now();
 for(const q of list){seen[q.i]=1;let r=RMT[q.i];if(!r){r=RMT[q.i]=mkRemote(q);MATES.push(r)}
  if(r.n!==q.n){r.n=q.n;r.root.remove(r.tag);r.tag=nameTag(q.n);r.tag.position.y=r.inCar?3.1:2.4;r.root.add(r.tag)}
  r.c=q.col||r.c;r.tx=q.x;r.tz=q.z;r.ta=q.a;r.inCar=q.c===1?1:0;r.t=now;if(Array.isArray(q.k)){r.ci=q.k[0]|0;r.kind=clamp(q.k[1]|0,0,3)}r.cc=q.cc;
  if(r.fresh){r.x=q.x;r.z=q.z;r.a=q.a;r.fresh=0}}
 for(const id in RMT)if(!seen[id]&&now-RMT[id].t>4000)rmRemote(id)}
function updRemotes(dt){if(!ONL)return;dt=Math.max(dt,.001);
 for(const id in RMT){const r=RMT[id],ox=r.x,oz=r.z,dx=r.tx-r.x,dz=r.tz-r.z;
  if(Math.hypot(dx,dz)>40){r.x=r.tx;r.z=r.tz}else{const k=Math.min(1,dt*10);r.x+=dx*k;r.z+=dz*k}
  r.a+=angD(r.ta,r.a)*Math.min(1,dt*12);r.spd+=(Math.hypot(r.x-ox,r.z-oz)/dt-r.spd)*Math.min(1,dt*8);
  if(!r.m.glb&&PRDY&&!r.up){r.up=1;const nm=rmPerson(r.id);if(nm.glb){r.root.remove(r.m);r.m=nm;r.root.add(nm)}}
  r.root.position.set(r.x,0,r.z);
  if(r.inCar){if(r.ck!==(r.kind|0)||!r.car){if(r.car)r.root.remove(r.car.m);const c=mkCar(r.kind|0,hex6(r.cc),0,0,0);cars.pop();c.m.position.set(0,0,0);r.root.add(c.m);r.car=c;r.ck=r.kind|0;if(c.glb)paint(c,r.ci)}
   r.car.m.rotation.set(0,r.a,0);r.car.m.visible=true;r.m.visible=false;r.tag.position.y=3.1}
  else{if(r.car)r.car.m.visible=false;r.m.visible=true;r.m.rotation.y=r.a;r.tag.position.y=2.4;
   if(r.spd>.4){r.ph+=r.spd*dt*2.2;swingPed(r.m,Math.sin(r.ph)*Math.min(.9,.35+r.spd*.07))}else swingPed(r.m,0)}
  r.tag.visible=Math.hypot(r.x-cam.position.x,r.z-cam.position.z)<90}}

$('chs').onclick=function(){const v=$('chi').value.trim();if(!ONL||!v)return;$('chi').value='';onlSend({t:'c',m:v});chm(onlName()+': '+v)};
$('chi').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('chs').onclick()}});
/* SOHBET dugmesi: sadece cevrimici modda gorunur */
{const b=document.createElement('button');b.id='hChat';b.textContent='SOHBET';b.style.display='none';$('hubp').appendChild(b);
 b.onclick=()=>{$('hubp').classList.add('hid');openChat()};
 setInterval(()=>{b.style.display=ONL?'':'none';showCode()},500)}
