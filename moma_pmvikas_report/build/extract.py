import json,re,sys
h=open(sys.argv[1],encoding='utf8').read()
dec=json.JSONDecoder()
out={}
for name in ['GEO','MCD','FD']:
    i=h.index(name+'=')+len(name)+1
    out[name],_=dec.raw_decode(h[i:])
json.dump(out,open('atlas_data.json','w'))
g=out['GEO']
for k,v in g.items():
    for on,o in v['objects'].items():
        geoms=o.get('geometries',[])
        print(k,on,len(geoms), geoms[0].get('properties') if geoms else None, geoms[0].get('id') if geoms else None)
print(list(out['MCD'].items())[:3], len(out['MCD']))
