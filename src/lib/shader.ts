// The one full-screen shader: the eyelid curtains, the moving hero gradient, the ray-marched pillow,
// the dotted matrix and the lit word, the portal crown that gathers into a doorway, and the light river.
export const VERTEX = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`

export const FRAGMENT = `precision highp float;
uniform vec2 res;uniform vec2 pointer;uniform float pointerActive;uniform float time;uniform float progress;uniform sampler2D blurredWordImage;uniform sampler2D wordImage;uniform float wordReady;uniform sampler2D portalImage;uniform float imageReady;
float ss(float a,float b,float v){return smoothstep(a,b,v);}
float word(vec2 uv){return texture2D(wordImage,clamp(uv,vec2(0.),vec2(1.))).a;}
mat2 turn(float angle){float c=cos(angle),s=sin(angle);return mat2(c,-s,s,c);}
vec3 pillowLocal(vec3 p){
  p.xy=turn(-.17)*p.xy;
  p.xz=turn((pointer.x-.5)*.9+.18)*p.xz;
  p.yz=turn((pointer.y-.5)*.65-.24)*p.yz;
  return p;
}
float pillowDistance(vec3 p){
  vec3 local=pillowLocal(p);
  vec2 q=abs(local.xy)/vec2(.87,.60);
  vec2 pinched=abs(local.xy)/vec2(
      1.-.14*(1.-min(q.y*q.y,1.)),
      1.-.14*(1.-min(q.x*q.x,1.)));
  vec2 edge=pinched-vec2(.835,.565);
  float outline=length(max(edge,0.))+min(max(edge.x,edge.y),0.)-.035;
  vec2 face=pinched/vec2(.87,.60);
  float fullness=max(0.,(1.-face.x*face.x)*(1.-face.y*face.y));
  float thickness=.012+.265*pow(fullness,.52);
  return max(outline,abs(local.z)-thickness)*.50;
}
void main(){
  vec2 uv=gl_FragCoord.xy/res;vec2 screenUV=uv;vec2 p=vec2((uv.x-.5)*res.x/res.y,uv.y);
  float t=time*.18;float s=progress;
  vec3 pink=vec3(1.,.18,.65),red=vec3(1.,.16,.17),gold=vec3(1.,.68,.20),violet=vec3(.65,.04,1.),cyan=vec3(.51,.88,1.);
  float flow=sin(uv.x*5.+uv.y*3.+t)+.45*sin(uv.x*8.-uv.y*4.-t*.8);
  vec3 field=mix(red,pink,ss(-1.,1.,flow));
  field=mix(field,gold,ss(.65,1.1,uv.y+.10*sin(uv.x*7.+t))*.9);
  field=mix(field,vec3(.96,.24,.78),ss(-.4,.9,sin(uv.x*6.-uv.y*4.+t*.7))*.48);
  float cover=ss(.19,.39,s);
  float bow=.13*pow(abs(uv.x-.5)*2.,1.6);
  float aperture=mix(.78,-.15,cover)-bow;
  float curtain=ss(aperture-.14,aperture+.14,abs(uv.y-.5));
  curtain*=ss(.18,.22,s);
  float opening=ss(.38,.43,s);
  float transition=ss(.59,.90,s);
  float aspect=res.x/res.y;
  float artworkAspect=2752./1536.;
  float artworkHeight=max(1.,1.12*aspect/artworkAspect);
  float artworkWidth=artworkHeight*artworkAspect/aspect;
  float artworkTop=.309-.222*artworkHeight;
  vec2 tex=vec2((screenUV.x-.497)/artworkWidth+.5,1.-((1.-screenUV.y)-artworkTop)/artworkHeight);
  float crownReveal=ss(.65,.76,s);
  float gather=ss(.72,.85,s);
  float radiusX=mix(1.30,.068,gather);
  float radiusY=mix(.34,.068,ss(.70,.85,s));
  float shoulder=mix(1.12,.710,crownReveal);
  vec2 archPoint=vec2((tex.x-.5)*artworkAspect,max(tex.y-shoulder,0.));
  float archDistance=(length(archPoint/vec2(radiusX,radiusY))-1.)*min(radiusX,radiusY);
  float portalBase=mix(-.35,.56,ss(.73,.84,s));
  float footSoftness=mix(.04,.0018,ss(.74,.81,s));
  float footFade=ss(portalBase-footSoftness,portalBase+footSoftness,tex.y);
  float contourFocus=ss(.74,.81,s);
  float softness=mix(.032,.0018,contourFocus);
  float archMask=1.-ss(-softness,softness,archDistance);
  float rim=exp(-pow(archDistance/(softness*1.7),2.));
  float outerGlow=exp(-max(archDistance,0.)/mix(.065,.009,contourFocus));
  float depth=max(shoulder+radiusY-tex.y,0.);
  float descending=ss(.65,.85,s)*1.15;
  float lightFront=exp(-pow((depth-descending*.50)/.15,2.));
  float innerBand=exp(-pow((archDistance+.025)/.035,2.));
  vec3 warm=mix(field,vec3(1.,.36,.10),ss(.65,.80,s)*.55);
  warm=mix(warm,vec3(1.,.83,.42),innerBand*.68+lightFront*.20);
  vec3 exterior=mix(vec3(.025,.12,.14),vec3(.003,.002,.008),ss(.69,.81,s));
  exterior*=outerGlow;
  vec3 sculpted=mix(exterior,warm,archMask);
  sculpted=mix(sculpted,vec3(1.,.10,.20),rim*.58);
  sculpted+=vec3(.09,.018,.04)*outerGlow*(1.-archMask);
  sculpted*=footFade;
  vec3 result=mix(field,sculpted,ss(.64,.69,s));
  float riverDepth=clamp((.48-tex.y)/.48,0.,1.);
  float riverWeight=ss(0.,.65,riverDepth);
  float travel=riverDepth*8.5-time*.48;
  float meander=.048*sin(travel)+.022*sin(riverDepth*15.-time*.31+1.4);
  float breathing=1.+riverWeight*.065*sin(riverDepth*10.-time*.38);
  tex.x=.5+(tex.x-.5)/breathing+meander*riverWeight;
  tex.y+=.012*sin(riverDepth*12.-time*.48)*riverWeight;
  tex.x+=.006*sin(riverDepth*24.-time*.85)*riverWeight;
  vec3 artwork=texture2D(portalImage,tex).rgb;
  artwork*=step(0.,tex.y)*step(tex.y,1.)*step(0.,tex.x)*step(tex.x,1.);
  float riverArrival=ss(.88,.96,s);
  float revealFront=mix(.48,-.20,riverArrival);
  float artworkReveal=ss(revealFront-.12,revealFront+.12,tex.y);
  result=mix(result,artwork*artworkReveal,ss(.855,.88,s)*imageReady);
  vec3 eyelidColor=mix(vec3(1.,.03,.18),vec3(1.,.18,.65),ss(.04,.5,abs(screenUV.y-.5)));
  result=mix(eyelidColor*curtain,result,opening);
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
  result+=grain*.012*max(curtain,opening)*mix(1.,.25,transition);
  float pillowVisibility=ss(.43,.49,s)*(1.-ss(.58,.65,s));
  if(pillowVisibility>.001){
    float cushionScale=min(.58,aspect*.43)*.60;
    vec2 cushionUV=(screenUV-vec2(.5,.5))*vec2(aspect,1.)/cushionScale;
    float aura=exp(-dot(cushionUV/vec2(1.1,.85),cushionUV/vec2(1.1,.85))*1.5);
    result=mix(result,vec3(.62,.04,.20),aura*.23*pillowVisibility);
    if(length(cushionUV)<1.25){
      vec3 origin=vec3(cushionUV,1.25);
      float ray=0.;float hit=0.;vec3 surface=origin;
      for(int i=0;i<48;i++){
        surface=origin-vec3(0.,0.,ray);
        float distance=pillowDistance(surface);
        if(distance<.0015){hit=1.;break;}
        ray+=max(distance,.002);
        if(ray>2.5)break;
      }
      if(hit>.5){
        vec2 e=vec2(.002,0.);
        vec3 normal=normalize(vec3(
          pillowDistance(surface+e.xyy)-pillowDistance(surface-e.xyy),
          pillowDistance(surface+e.yxy)-pillowDistance(surface-e.yxy),
          pillowDistance(surface+e.yyx)-pillowDistance(surface-e.yyx)));
        vec3 local=pillowLocal(surface);
        float light=clamp(dot(normal,normalize(vec3(-.4,.65,1.))),0.,1.);
        float heat=clamp(.20+.68*light+.10*sin(local.x*3.+local.y*2.),0.,1.);
        vec3 thermal=mix(vec3(.85,.035,.16),vec3(1.,.33,.08),ss(.08,.48,heat));
        thermal=mix(thermal,vec3(1.,.77,.40),ss(.40,.95,heat));
        float seam=exp(-pow(local.z/.018,2.));
        thermal=mix(thermal,vec3(1.,.20,.10),seam*.55);
        float speckle=fract(sin(dot(gl_FragCoord.xy,vec2(41.3,73.7)))*43758.5453)-.5;
        thermal+=speckle*.045;
        result=mix(result,thermal,pillowVisibility*.88);
      }
    }
  }
  vec2 grid=screenUV*vec2(res.x/res.y,1.)*180.;
  vec2 cell=floor(grid);
  vec2 block=floor(cell/vec2(7.,6.));
  float seed=fract(sin(dot(block,vec2(127.1,311.7)))*43758.5453);
  float route=mod(floor(seed*11.),6.);
  float horizontal=1.-step(.5,abs(mod(cell.y,6.)-route));
  float vertical=1.-step(.5,abs(mod(cell.x,7.)-floor(seed*7.)));
  float pulse=ss(-.5,.7,sin(time*.65+seed*6.283+block.y*.24));
  float twinkle=.25+.75*pow(.5+.5*sin(time*(1.4+seed*1.8)+dot(cell,vec2(2.17,3.31))),3.);
  float dots=1.-ss(.081,.216,length(fract(grid)-.5));
  float cursorDistance=length((screenUV-pointer)*vec2(res.x/res.y,1.));
  float cursorMask=(1.-ss(.06,.40,cursorDistance))*pointerActive;
  float edgeFade=ss(0.,.12,screenUV.y)*(1.-ss(.88,1.,screenUV.y));
  float heroDots=ss(.43,.49,s)*(1.-ss(.59,.65,s));
  float dotAlpha=dots*max(horizontal,vertical)*(.144+.576*pulse)*twinkle*cursorMask*edgeFade*heroDots;
  result=mix(result,vec3(1.,.94,.97),dotAlpha);
  float wordVisibility=ss(.42,.49,s)*(1.-ss(.59,.65,s))*wordReady;
  if(wordVisibility>.001){
    float spot=exp(-pow((screenUV.x-pointer.x)/.15,2.))*pointerActive;
    float glyph=word(screenUV);
    float blurred=texture2D(blurredWordImage,screenUV).a;
    float wordAlpha=mix(glyph,blurred,ss(0.,.18,spot))*(.30+.68*spot);
    vec2 lightOrigin=vec2(mix(.5,pointer.x,.65),.5-(pointer.y-.5)*.10);
    float beam=0.;
    for(int i=1;i<=64;i++){
      float travel=float(i)/64.;
      vec2 source=mix(screenUV,lightOrigin,travel*.92);
      float emission=texture2D(wordImage,source,2.8+travel*1.5).a;
      float sourceSpot=exp(-pow((source.x-pointer.x)/.18,2.));
      beam+=emission*sourceSpot*(1.-travel*.55)/64.;
    }
    float beamAlpha=(1.-exp(-beam*6.))*.52*pointerActive;
    float outsideWord=ss(.07,.22,abs(screenUV.y-.5));
    float projection=beamAlpha*mix(.22,1.,outsideWord);
    result=mix(result,vec3(.96,.97,1.),projection*wordVisibility);
    result=mix(result,vec3(1.),clamp(wordAlpha*wordVisibility,0.,.98));
  }
  gl_FragColor=vec4(max(result,0.),1.);
}`
