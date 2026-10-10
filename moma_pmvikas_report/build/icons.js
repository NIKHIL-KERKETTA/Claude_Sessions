const fa=require('@fortawesome/free-solid-svg-icons');const {Resvg}=require('@resvg/resvg-js');const fs=require('fs');
const want={pmvikas:'faPersonChalkboard',pmjvk:'faBuildingColumns',survey:'faClipboardList',challenge:'faTriangleExclamation',schemes:'faLayerGroup',gap:'faPuzzlePiece',demo:'faPeopleGroup',map:'faMapLocationDot',edu:'faGraduationCap',work:'faBriefcase',women:'faPersonDress',money:'faIndianRupeeSign',data:'faDatabase',link:'faLink',search:'faMagnifyingGlass',list:'faListCheck',info:'faCircleInfo',doc:'faFileLines',hand:'faHandshake',chart:'faChartColumn',route:'faRoute',flag:'faFlag',compass:'faCompass',eye:'faEye',users:'faUsers',school:'faSchool',hammer:'faHammer',bulb:'faLightbulb',clock:'faClock',calendar:'faCalendarCheck'};
const cols={dark:'#2E2E38',yellow:'#FFE600',blue:'#188CE5'};
for(const [k,n] of Object.entries(want)){const ic=fa[n];if(!ic){console.log('missing',n);continue;}
 const [w,h,, ,d]=ic.icon;
 for(const [cn,c] of Object.entries(cols)){
  // icon in a circle badge: dark circle w/ yellow glyph etc
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="${c}" d="${d}"/></svg>`;
  fs.writeFileSync(`icons/${k}_${cn}.png`,new Resvg(svg,{fitTo:{mode:'width',value:256}}).render().asPng());
 }
 // badge: dark circle, yellow glyph
 const S=Math.max(w,h)*1.7;const ox=(S-w)/2,oy=(S-h)/2;
 const b=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><circle cx="${S/2}" cy="${S/2}" r="${S/2}" fill="#2E2E38"/><g transform="translate(${ox},${oy})"><path fill="#FFE600" d="${d}"/></g></svg>`;
 fs.writeFileSync(`icons/${k}_badge.png`,new Resvg(b,{fitTo:{mode:'width',value:256}}).render().asPng());
 const b2=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><circle cx="${S/2}" cy="${S/2}" r="${S/2}" fill="#FFE600"/><g transform="translate(${ox},${oy})"><path fill="#2E2E38" d="${d}"/></g></svg>`;
 fs.writeFileSync(`icons/${k}_ybadge.png`,new Resvg(b2,{fitTo:{mode:'width',value:256}}).render().asPng());
}
console.log('done',fs.readdirSync('icons').length);
