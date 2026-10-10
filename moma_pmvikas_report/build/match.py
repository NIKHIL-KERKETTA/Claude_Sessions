import sys,re,difflib,json,collections
sys.path.insert(0,'.')
import pandas as pd
from geo import DISTS
d=pd.read_excel(sys.argv[1]).apply(lambda s:s.astype(str).str.strip().str.upper())
def n(s): return re.sub(r'[^A-Z]','',str(s).upper().replace('&','AND').replace('24',''))
SFIX={'TAMILNADU':'TAMILNADU','ANDAMANANDNICOBAR':'ANDAMANANDNICOBARISLAND','TELANGANA':'ANDHRAPRADESH','LADAKH':'JAMMUANDKASHMIR','DELHI':'NCTOFDELHI'}
geo=collections.defaultdict(dict); allg={}
for f in DISTS:
    p=f['props']; geo[n(p['ST_NM'])][n(p['DISTRICT'])]=p['censuscode']; allg[n(p['DISTRICT'])]=p['censuscode']
print(sorted(geo.keys()))
SFIX.update({'ARUNACHALPRADESH':'ARUNANCHALPRADESH'})
# manual aliases for renamed/new districts -> 2011 parent
ALIAS={'PURBABARDHAMAN':'BARDDHAMAN','PASCHIMBARDHAMAN':'BARDDHAMAN','BARDHAMAN':'BARDDHAMAN','HOOGHLY':'HUGLI','HOWRAH':'HAORA',
'NORTHTWENTYFOURPARGANAS':'NORTHTWENTYFOURPARGANA','SOUTHTWENTYFOURPARGANAS':'SOUTHTWENTYFOURPARGANA','NORTH24PARGANAS':'NORTHTWENTYFOURPARGANA','SOUTH24PARGANAS':'SOUTHTWENTYFOURPARGANA',
'COOCHBEHAR':'KOCHBIHAR','COOCHBIHAR':'KOCHBIHAR','DARJEELING':'DARJILING','MALDA':'MALDAH','PURULIA':'PURULIYA','UTTARDINAJPUR':'UTTARDINAJPUR','DAKSHINDINAJPUR':'DAKSHINDINAJPUR','KALIMPONG':'DARJILING','ALIPURDUAR':'JALPAIGURI','JHARGRAM':'PASCHIMMEDINIPUR','BIRBHUM':'BIRBHUM','NADIA':'NADIA','MURSHIDABAD':'MURSHIDABAD','BANKURA':'BANKURA','PURBAMEDINIPUR':'PURBAMEDINIPUR','PASCHIMMEDINIPUR':'PASCHIMMEDINIPUR'}

ALIAS.update({'PARAGANASNORTH':'NORTHPARGANAS','PARAGANASSOUTH':'SOUTHPARGANAS','DINAJPURDAKSHIN':'DAKSHINDINAJPUR','MEDINIPUREAST':'PURBAMEDINIPUR','MEDINIPURWEST':'PASHCHIMMEDINIPUR',
'GANGTOK':'EAST','PAKYONG':'EAST','MANGAN':'NORTH','NAMCHI':'SOUTH','GYALSHING':'WEST','SORENG':'WEST','NUH':'MEWAT','BALLARI':'BELLARY','KALABURAGI':'GULBARGA','VIJAYAPURA':'BIJAPUR','BELAGAVI':'BELGAUM',
'AMETHI':'SULTANPUR','SHAMLI':'MUZAFFARNAGAR','SAMBHAL':'MORADABAD','AYODHYA':'FAIZABAD','KASGANJ':'KANSIRAMNAGAR','MALERKOTLA':'SANGRUR','SPSRNELLORE':'SRIPOTTISRIRAMULUNELLORE','BEED':'BID',
'TENKASI':'TIRUNELVELI','TUTICORIN':'THOOTHUKKUDI','KHARGONE':'WESTNIMAR','BISWANATH':'SONITPUR','ARVALLI':'SABARKANTHA','DAHOD':'DOHAD','NIRMAL':'ADILABAD','MEDCHALMALKAJGIRI':'RANGAREDDY',
'KANGPOKPI':'SENAPATI','TENGNOUPAL':'CHANDEL','KAMJONG':'UKHRUL','NONEY':'TAMENGLONG','PHERZAWL':'CHURACHANDPUR','JIRIBAM':'IMPHALEAST','GOMATI':'SOUTHTRIPURA','UNAKOTI':'NORTHTRIPURA','SEPAHIJALA':'WESTTRIPURA',
'NAMSAI':'LOHIT','KRADAADI':'KURUNGKUMEY','LOWERSIANG':'WESTSIANG','LONGDING':'TIRAP','SHIYOMI':'WESTSIANG','LEPARADA':'WESTSIANG','PAKKEKESSANG':'EASTKAMENG','SIANG':'EASTSIANG'})
rows=collections.Counter(); blocks=collections.defaultdict(set); unmatched=collections.Counter()
for _,r in d.iterrows():
    s=SFIX.get(n(r.state_name),n(r.state_name)); dn=n(r.disc_name); dn=ALIAS.get(dn,dn)
    cand=geo.get(s)
    code=None
    if cand is None:
        code=allg.get(dn)
        if code is None:
            m=difflib.get_close_matches(dn,allg.keys(),1,0.85); code=allg[m[0]] if m else None
    else:
        code=cand.get(dn)
        if code is None:
            m=difflib.get_close_matches(dn,cand.keys(),1,0.75); code=cand[m[0]] if m else None
    if code is None: unmatched[(r.state_name,r.disc_name)]+=1; continue
    rows[code]+=1; blocks[code].add(r.block_name)
print('matched rows',sum(rows.values()),'of',len(d),'districts',len(rows))
print('unmatched',sum(unmatched.values()),len(unmatched)); print(unmatched.most_common(60))
json.dump({'rows':{str(k):v for k,v in rows.items()},'blocks':{str(k):len(v) for k,v in blocks.items()}},open('blockfile_by_district.json','w'))
