import sys,json
sys.path.insert(0,'/tmp/claude-0/-home-user-Claude-Sessions/3d2614e1-abc1-5b27-a4fa-97f592767fe6/scratchpad/rep')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import FancyBboxPatch, Patch, Circle
import matplotlib.colors as mc
from geo import STATES,DISTS,OUTLINE,MCD,proj
INK='#2E2E38'; Y='#FFE600'; B='#188CE5'; BD='#0F5C99'; BL='#9DCBF2'; BLL='#D6EAFB'; G='#C4C4CD'; GL='#ECECF1'; MUT='#747480'; YL='#FFF39A'; YLL='#FFFBD6'
plt.rcParams.update({'font.family':'Liberation Sans','font.size':8.5,'text.color':INK,'axes.edgecolor':G,'xtick.color':INK,'ytick.color':INK,'axes.labelcolor':INK})
def save(f,n): f.savefig('fig2/'+n,dpi=240,bbox_inches='tight',facecolor='white',pad_inches=0.04); plt.close(f)
def sub(ax,t,u=None,x=0,y=1.02):
    ax.text(x,y,t,transform=ax.transAxes,fontsize=8.8,fontweight='bold',va='bottom',ha='left')
def grid(ax,axis='y'):
    for s in ['top','right','left','bottom']: ax.spines[s].set_visible(False)
    ax.grid(axis=axis,color=GL,lw=0.8,zorder=0); ax.tick_params(length=0); ax.set_axisbelow(True)
def note(ax,x,y,t,xy,rad=0.3,ha='left'):
    ax.annotate(t,xy=xy,xytext=(x,y),fontsize=7.6,style='italic',ha=ha,va='center',color=INK,
        arrowprops=dict(arrowstyle='-|>',color=INK,lw=0.7,connectionstyle=f'arc3,rad={rad}',shrinkA=2,shrinkB=2,mutation_scale=7))
def badge(ax,x,y,t,r=None,fc=INK,tc='white',fs=7.5,transform=None):
    ax.text(x,y,t,ha='center',va='center',fontsize=fs,fontweight='bold',color=tc,transform=transform or ax.transData,
        bbox=dict(boxstyle='circle,pad=0.35',fc=fc,ec='none'),zorder=6)
# ---- map helpers
def polys(F): return [[[proj(*pt) for pt in p[0]] for p in f['polys']] for f in F]
DP=polys(DISTS); SP=polys(STATES); OP=polys(OUTLINE); props=[f['props'] for f in DISTS]
def drawmap(ax,colors,lw=0.12,st=True):
    v=[];fc=[]
    for rings,c in zip(DP,colors):
        for r in rings: v.append(r); fc.append(c)
    ax.add_collection(PolyCollection(v,facecolors=fc,edgecolors='white',linewidths=lw))
    if st: ax.add_collection(PolyCollection([r for rs in SP for r in rs],facecolors='none',edgecolors='#9A9AA5',linewidths=0.3))
    ax.add_collection(PolyCollection([r for rs in OP for r in rs],facecolors='none',edgecolors=INK,linewidths=0.45))
    ax.set_xlim(proj(60.5,0)[0],proj(97.6,0)[0]); ax.set_ylim(6.5,37.3); ax.set_aspect('equal'); ax.axis('off')
def leg(ax,items,title,anchor=(0.0,0.0)):
    l=ax.legend(handles=[Patch(fc=c,ec='none',label=t) for c,t in items],loc='lower left',bbox_to_anchor=anchor,frameon=False,fontsize=6.8,title=title,title_fontsize=6.8,handlelength=1.0,handleheight=0.9,labelspacing=0.3)
    l._legend_box.align='left'; l.get_title().set_fontweight('bold')
SEQ=[BLL,BL,'#5AAEEE',B,BD]
# 1 targeting maps
f,(a1,a2)=plt.subplots(1,2,figsize=(7.2,3.5))
col={'A':B,'B1':INK,'B2':Y}
drawmap(a1,[col.get(MCD.get(str(p['censuscode'])),GL) for p in props])
leg(a1,[(B,'Category A (53)'),(INK,'Category B1 (20)'),(Y,'Category B2 (17)')],'Category')
sub(a1,'Minority Concentration Districts',y=0.97)
bf=json.load(open('blockfile_by_district.json'))
def bc(code):
    v=bf['rows'].get(str(code),0)
    if v==0: return GL
    for b,c in zip([10,50,150,400,10**9],SEQ):
        if v<=b: return c
drawmap(a2,[bc(p['censuscode']) for p in props])
leg(a2,[(SEQ[0],'1-10'),(SEQ[1],'11-50'),(SEQ[2],'51-150'),(SEQ[3],'151-400'),(SEQ[4],'Over 400')],'Entries per district')
sub(a2,'District and block list, by district',y=0.97)
note(a2,proj(79.5,0)[0],11.0,'West Bengal and Assam\nhold the most entries',(proj(88.3,0)[0],22.0),rad=0.25)
f.subplots_adjust(wspace=0.02); save(f,'t_maps_targeting.png')
# 2 timeline
TL=[('2006','Sachar Committee;\n15 Point\nProgramme'),('2007','Ranganath Misra\nCommission'),('2008-09','MsDP in 90\nMinority Concentration\nDistricts'),('2013-14','Planning moves to\nblocks and towns'),('2014','Kundu Committee\nreview'),('2018','PMJVK: 1,300\nareas'),('2025','PM VIKAS rolled\nout (January)')]
f,ax=plt.subplots(figsize=(7.2,1.35)); ax.set_xlim(-0.5,6.5); ax.set_ylim(-1.5,0.8); ax.axis('off')
ax.plot([-0.45,6.45],[0,0],color=INK,lw=1)
for i,(yy,t) in enumerate(TL):
    hi=i in (2,5,6)
    ax.scatter(i,0,s=95 if hi else 45,color=Y if hi else 'white',edgecolor=INK,lw=1,zorder=3)
    ax.text(i,0.3,yy,ha='center',fontsize=8.5,fontweight='bold'); ax.text(i,-0.3,t,ha='center',va='top',fontsize=6.3,color=INK,linespacing=1.15)
save(f,'t_timeline.png')
# 3 PM VIKAS structure
OLD=[('USTTAD','Traditional arts and crafts training',0),('Hamari Dharohar','Preserving traditional art forms',0),('Seekho aur Kamao','Skills for modern-sector jobs',0),('Nai Roshni','Leadership training for women',1),('Nai Manzil','Education bridge for dropouts',2)]
NEW=[('Skilling and training','Traditional and non-traditional (NSQF) skilling'),('Women leadership and entrepreneurship','Leadership, enterprise and Biz Sakhi mentors'),('Education','Open schooling (NIOS) for Class 8, 10 and 12'),('Infrastructure development','Dovetails with PMJVK')]
f,ax=plt.subplots(figsize=(7.2,2.7)); ax.set_xlim(0,10); ax.set_ylim(-0.1,5.0); ax.axis('off')
ax.text(0,4.85,'Five earlier schemes',fontsize=8,fontweight='bold',color=MUT); ax.text(5.9,4.85,'Four PM VIKAS components',fontsize=8,fontweight='bold',color=MUT)
oy=[3.9,3.0,2.1,1.2,0.3]
pos={0:(2.1,2.52),1:(1.2,0.72),2:(0.3,0.72),3:(-0.6,0.72)}
pos={0:(2.1,2.52),1:(1.2,0.72),2:(0.3,0.72)}
for (n,d,t),yy in zip(OLD,oy):
    ax.add_patch(FancyBboxPatch((0,yy),3.7,0.72,boxstyle='round,pad=0,rounding_size=0.05',fc=GL,ec='none'))
    ax.text(0.15,yy+0.47,n,fontsize=8.5,fontweight='bold'); ax.text(0.15,yy+0.18,d,fontsize=7.2)
    ty={3.9:4.2,3.0:3.35,2.1:2.5,1.2:1.56,0.3:0.66}[yy]
    ax.annotate('',xy=(5.85,ty),xytext=(3.72,yy+0.36),arrowprops=dict(arrowstyle='-|>',color=INK,lw=0.8,connectionstyle='arc3,rad=-0.1' if t==0 else 'arc3,rad=0',mutation_scale=8))
for i,(n,d) in enumerate(NEW[:3]):
    yy,h=pos[i]
    ax.add_patch(FancyBboxPatch((5.9,yy),4.1,h,boxstyle='round,pad=0,rounding_size=0.05',fc=YLL,ec='none')); ax.add_patch(plt.Rectangle((5.9,yy),0.07,h,color=Y))
    ty=yy+h/2+0.12 if i==0 else yy+0.47
    ax.text(6.1,ty,n,fontsize=8.5,fontweight='bold'); ax.text(6.1,ty-0.29,d,fontsize=7.2)
ax.add_patch(FancyBboxPatch((5.9,-0.1),4.1,0.3,boxstyle='round,pad=0,rounding_size=0.05',fc=GL,ec='none'))
ax.text(6.1,0.05,'Infrastructure development: dovetails with PMJVK',fontsize=7.4,va='center',fontweight='bold')
save(f,'t_pmvikas.png')
# 4 access barriers
it=[('Unaware of PMJVK facilities','DMEO 2021, 8 states',59,B),('Said no PMJVK meetings were held','DMEO 2021, 8 states',55,B),('NMDFC borrowers reporting difficulties','NMDFC 2019, 2016-17 cohort',56,B),('Aware of the 15 Point Programme','CMRSD 2016, beneficiaries',33.1,INK)]
f,ax=plt.subplots(figsize=(7.2,2.1)); yv=list(range(4))[::-1]
ax.barh(yv,[i[2] for i in it],color=[i[3] for i in it],height=0.52,zorder=2)
for yy,i in zip(yv,it):
    ax.text(i[2]+1.2,yy,f'{i[2]:g}%',va='center',fontsize=8.5,fontweight='bold')
ax.set_yticks(yv); ax.set_yticklabels([f'{i[0]}\n' for i in it],fontsize=7.8)
for yy,i in zip(yv,it): ax.text(-1.5,yy-0.2,i[1],ha='right',va='center',fontsize=6.6,color=MUT)
ax.set_xlim(0,100); ax.set_xticks([0,25,50,75,100]); ax.set_xticklabels(['0','25','50','75','100%'],fontsize=7); grid(ax,'x')
note(ax,72,1.1,'Awareness is the step\nwhere access most\noften breaks down',(60.5,2.8),rad=0.25)
save(f,'t_access.png')
# 5 training + convergence + youth UR map
f=plt.figure(figsize=(7.2,3.3))
a=f.add_axes([0.0,0.52,0.55,0.32]); b=f.add_axes([0.0,0.04,0.55,0.24]); m=f.add_axes([0.57,0.0,0.43,0.93])
cats=[('Trained men',[80.5,8.2,11.3]),('Trained women',[50.0,8.1,41.9])]
cc=[B,BL,G]; labs=['Employed','Unemployed','Outside the labour force']
for i,(n,v) in enumerate(cats):
    l=0
    for vv,c,lb in zip(v,cc,labs):
        a.barh(i,vv,left=l,color=c,height=0.6,edgecolor='white',lw=1.5,label=lb if i==0 else None)
        if vv>7: a.text(l+vv/2,i,f'{vv}%',ha='center',va='center',fontsize=7.6,fontweight='bold',color='white' if c==B else INK)
        l+=vv
a.set_yticks([0,1]); a.set_yticklabels([c[0] for c in cats],fontsize=7.8); a.invert_yaxis(); a.set_xticks([]); grid(a,'x')
a.legend(frameon=False,ncol=3,loc='lower left',bbox_to_anchor=(0,1.0),fontsize=6.8,handlelength=1)
f.text(0,0.985,'People with formal vocational training, by status, 2023-24, %',fontsize=8.6,fontweight='bold',va='top')
for i,(lb,v,c) in enumerate([('Planning',84,B),('Monitoring and evaluation',16,INK)]):
    b.barh(i,100,color=GL,height=0.55); b.barh(i,v,color=c,height=0.55); b.text(v+1.5,i,f'{v}%',va='center',fontsize=8,fontweight='bold')
b.set_yticks([0,1]); b.set_yticklabels(['Planning','Monitoring and\nevaluation'],fontsize=7.8); b.invert_yaxis(); b.set_xticks([]); b.set_xlim(0,100); grid(b,'x')
f.text(0,0.38,'Schemes showing convergence, by stage (92 schemes), %',fontsize=8.6,fontweight='bold',va='top')
sb=[10,15,20,25,100]; v=[];fc=[]
for ff,rs in zip(STATES,SP):
    x=ff['props'].get('yur')
    for r in rs:
        v.append(r)
        c=GL
        if x is not None:
            for bb,cl in zip(sb,SEQ):
                if x<=bb: c=cl; break
        fc.append(c)
m.add_collection(PolyCollection(v,facecolors=fc,edgecolors='white',linewidths=0.35)); m.set_xlim(proj(60.5,0)[0],proj(97.6,0)[0]); m.set_ylim(6.5,37.3); m.set_aspect('equal'); m.axis('off')
leg(m,[(SEQ[0],'10% or less'),(SEQ[1],'10-15%'),(SEQ[2],'15-20%'),(SEQ[3],'20-25%'),(SEQ[4],'Over 25%')],'Age 15-29')
f.text(0.58,0.985,'Youth unemployment rate, by state, 2023-24',fontsize=8.6,fontweight='bold',va='top')
note(m,proj(61,0)[0],19.5,'Kerala: 29.9%\n(India: 10.2%)',(proj(76.2,0)[0],10.2),rad=0.35)
save(f,'t_training.png')
# 6 demography: minority share map + half-community small multiples
f=plt.figure(figsize=(7.2,3.9))
m=f.add_axes([0,0,0.46,0.92])
bins=[10,25,50,75,101]
drawmap(m,[next(c for bb,c in zip(bins,SEQ) if (p.get('minp') or 0)<=bb) for p in props])
leg(m,[(SEQ[0],'Under 10%'),(SEQ[1],'10-25%'),(SEQ[2],'25-50%'),(SEQ[3],'50-75%'),(SEQ[4],'75% and over')],'Minority share')
f.text(0,0.99,'Minority share of district population, 2011',fontsize=8.6,fontweight='bold',va='top')
f.text(0.5,0.99,'Districts that together hold half of each community, 2011',fontsize=8.6,fontweight='bold',va='top')
COM=[('mus','Muslims'),('chr','Christians'),('sik','Sikhs'),('bud','Buddhists'),('jai','Jains')]
for k,(c,lab) in enumerate(COM):
    r,cn=divmod(k,3)
    ax=f.add_axes([0.5+cn*0.168,0.48-r*0.45,0.165,0.40])
    vals=[(p.get('n'+c) or 0) for p in props]; tot=sum(vals); o=sorted(range(len(vals)),key=lambda i:-vals[i]); acc=0; S=set()
    for i in o:
        if acc>=tot/2: break
        acc+=vals[i]; S.add(i)
    drawmap(ax,[B if i in S else GL for i in range(len(props))],lw=0.05,st=False)
    ax.set_title(lab,fontsize=7.8,fontweight='bold',pad=1)
    ax.text(0.86,0.86,str(len(S)),transform=ax.transAxes,ha='center',va='center',fontsize=7.5,fontweight='bold',color=INK,bbox=dict(boxstyle='circle,pad=0.3',fc=Y,ec='none'))
ax=f.add_axes([0.5+2*0.168,0.03,0.165,0.40]); ax.axis('off')
ax.text(0.02,0.62,'Number in the\nyellow circle = districts\nholding half of the\ncommunity',fontsize=7,style='italic',va='center')
save(f,'t_demography.png')
# 7 profile heat table (blue above, yellow below)
ROWS=[('Literacy, age 7+ (Census 2011)',73.0,[68.5,84.5,75.4,81.3,94.9]),('Literacy, age 7+ (PLFS 2023-24)',80.9,[79.5,88.9,83.4,None,None]),('Graduate level (Census 2011)',11.8,[6.7,16.2,12.8,10.7,43.4]),('Men in labour force, 15+ (2023-24)',78.8,[80.6,76.3,79.2,None,None]),('Women in labour force, 15+ (2023-24)',41.7,[30.2,50.4,33.0,None,None]),('Unemployment rate, 15+ (2023-24)',3.2,[3.2,4.7,5.8,None,None]),('Regular salaried, % of workers (2023-24)',21.7,[18.0,27.6,26.7,None,None])]
COLS=['All-India','Muslim','Christian','Sikh','Buddhist','Jain']
f,ax=plt.subplots(figsize=(7.2,2.75)); ax.set_xlim(0,10); ax.set_ylim(-0.6,len(ROWS)+0.9); ax.axis('off')
x0=3.7; cw=(10-x0)/6
for j,c in enumerate(COLS): ax.text(x0+cw*j+cw/2,len(ROWS)+0.35,c,ha='center',fontsize=7.8,fontweight='bold')
def tint(h,a):
    r,g,b=mc.to_rgb(h); return (1-(1-r)*a,1-(1-g)*a,1-(1-b)*a)
for i,(lab,nat,vals) in enumerate(ROWS):
    yy=len(ROWS)-1-i; ax.plot([0,10],[yy,yy],color=GL,lw=0.7)
    ax.text(0,yy+0.5,lab,va='center',fontsize=7.6)
    ax.text(x0+cw/2,yy+0.5,f'{nat:.1f}%',ha='center',va='center',fontsize=8,fontweight='bold',color=MUT)
    for j,v in enumerate(vals):
        cx=x0+cw*(j+1)
        if v is None: ax.text(cx+cw/2,yy+0.5,'not published',ha='center',va='center',fontsize=6.4,color=MUT); continue
        d=v-nat; a=min(1,0.3+abs(d)/12*0.7)
        col=B if d>0 else (Y if d<0 else G)
        ax.add_patch(FancyBboxPatch((cx+0.06,yy+0.1),cw-0.12,0.8,boxstyle='round,pad=0,rounding_size=0.05',fc=tint(col,a),ec='none'))
        ax.text(cx+cw/2,yy+0.5,f'{v:.1f}%',ha='center',va='center',fontsize=8,fontweight='bold',color='white' if (col==B and a>0.6) else INK)
ax.legend(handles=[Patch(color=B,label='Above all-India'),Patch(color=Y,label='Below all-India'),Patch(color=G,label='Equal to all-India'),Patch(color='white',label='Deeper shade = larger difference')],loc='upper left',bbox_to_anchor=(0,0.04),ncol=4,frameon=False,fontsize=7,handlelength=1)
save(f,'t_profile.png')
# 8 UDISE + LFPR
f,(a,b)=plt.subplots(1,2,figsize=(7.2,2.7),gridspec_kw={'width_ratios':[1.05,1],'wspace':0.62})
LEV=[('Primary',17.7),('Upper\nprimary',15.4),('Secondary',14.2),('Higher\nsecondary',12.0),('Higher\neducation',5.0)]
a.bar(range(5),[l[1] for l in LEV],width=0.6,color=[B,B,B,INK,INK],zorder=2)
a.axhline(14.2,color=INK,lw=0.9,ls=(0,(3,2)),zorder=3)
for i,l in enumerate(LEV): a.text(i,l[1]+0.5,f'{l[1]}',ha='center',fontsize=8,fontweight='bold')
a.set_xticks(range(5)); a.set_xticklabels([l[0] for l in LEV],fontsize=6.4); a.set_ylim(0,22); a.set_yticks([0,5,10,15,20]); a.tick_params(labelsize=7); grid(a,'y')
note(a,2.5,20.3,'Population share, 14.2%',(3.3,14.4),rad=-0.3)
a.text(0,1.08,'Muslim share of enrolment, by stage, %',transform=a.transAxes,fontsize=8.6,fontweight='bold')
groups=['All-India','Muslim','Christian','Sikh']; W=[41.7,30.2,50.4,33.0]; M=[78.8,80.6,76.3,79.2]
yv=list(range(4))[::-1]
for yy,w,m_ in zip(yv,W,M):
    b.plot([w,m_],[yy,yy],color=GL,lw=3,zorder=1)
    b.scatter(w,yy,s=55,color=Y,edgecolor=INK,lw=0.6,zorder=3); b.scatter(m_,yy,s=55,color=INK,zorder=3)
    b.text(w-3.5,yy,f'{w}',ha='right',va='center',fontsize=7.6); b.text(m_+3.5,yy,f'{m_}',ha='left',va='center',fontsize=7.6)
b.axvline(41.7,color=MUT,lw=0.7,ls=(0,(3,2)))
b.set_yticks(yv); b.set_yticklabels([g+(' households' if g!='All-India' else '') for g in groups],fontsize=7.4); b.set_xlim(15,95); b.set_xticks([20,40,60,80]); b.tick_params(labelsize=7); grid(b,'x')
b.scatter([],[],color=Y,edgecolor=INK,label='Women'); b.scatter([],[],color=INK,label='Men'); b.legend(frameon=False,fontsize=7,ncol=2,loc='upper left',bbox_to_anchor=(-0.02,-0.12),handletextpad=0.2)
b.text(-0.55,1.08,'Labour-force participation, age 15+, 2023-24, %',transform=b.transAxes,fontsize=8.6,fontweight='bold')
save(f,'t_edu_work.png')
print('ok')
