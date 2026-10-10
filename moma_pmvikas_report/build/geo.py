import json, math
D=json.load(open('/tmp/claude-0/-home-user-Claude-Sessions/3d2614e1-abc1-5b27-a4fa-97f592767fe6/scratchpad/rep/atlas_data.json'))
def decode(topo, obj):
    sc=topo['transform']['scale']; tr=topo['transform']['translate']
    arcs=[]
    for a in topo['arcs']:
        x=y=0; pts=[]
        for dx,dy in a:
            x+=dx;y+=dy; pts.append((x*sc[0]+tr[0], y*sc[1]+tr[1]))
        arcs.append(pts)
    def arc(i):
        return arcs[i] if i>=0 else arcs[~i][::-1]
    def ring(idx):
        pts=[]
        for i in idx:
            a=arc(i); pts.extend(a if not pts else a[1:])
        return pts
    feats=[]
    for g in topo['objects'][obj]['geometries']:
        polys=[]
        if g['type']=='Polygon': polys=[[ring(r) for r in g['arcs']]]
        elif g['type']=='MultiPolygon': polys=[[ring(r) for r in p] for p in g['arcs']]
        feats.append({'props':g.get('properties',{}),'polys':polys})
    return feats
def proj(lon,lat):
    return lon*math.cos(math.radians(23)), lat
STATES=decode(D['GEO']['states'],'st')
DISTS=decode(D['GEO']['dist'],'districts')
OUTLINE=decode(D['GEO']['outline'],'outline')
MCD=D['MCD']
