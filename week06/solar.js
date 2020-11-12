const CirclePrecision = 180;
const SunRadius = 5;
const EarthRadius = 2;
const EarthRingRadius = 15;
const MoonRadius = 1;
const MoonRingRadius = 4;
const MoonRotationSpeed = 80;
const EarthRotationSpeed = 50;
const EarthSpinSpeed = 10;
const SunSpinSpeed = 1;

function drawSun(){
  let sun = drawSphere([0, 0, -50], {
    color: (lat, lng, precision)=>{
      let _fac  = Math.sin((lng+1)*Math.PI/precision) + Math.cos((lat+1)*Math.PI/precision);
      return [1.0, Math.sqrt(1.0 - _fac/2)/2, Math.sqrt(1 - _fac/2)/2];
    },
    precision: CirclePrecision,
  }, 5);
  
  window.objects.push(sun);

  // self-spin
  const _spinSpeed = 1.0;
  sun.registerTickHandler((dt)=>{
    sun.rotate([0, 0, 0], [1, 6, 0], dt * _spinSpeed / 1000.0);
  }, "spin");

  return sun;
}

function drawEarth(parent_sun){
  // Rotation track
  let earth_ring = drawRing2D([0, 0, 0], {
    color: (..._)=>{return [0.2,0.2,1];},
    precision: CirclePrecision,
    parent: parent_sun,
    static: true
  }, 15);

  let earth_star = drawSphere([12, 9, 0], {
      color: (lat, lng, precision) => {
          let _fac  = Math.sin(lng*Math.PI/precision) + Math.cos(lat*Math.PI/precision);
          return [0.2, 1.0 - (_fac/2), 1.0];
      },
      precision: CirclePrecision,
      parent: parent_sun,
  }, 2);


  // self-spin
  const _spinSpeed = 10.0;
  earth_star.registerTickHandler((dt)=>{
    earth_star.rotate([0, 0, 0], [1, 0, 4], dt * _spinSpeed / 1000.0);
  }, "spin");

  // rotate
  earth_star.registerTickHandler((dt)=>{
    const speed_scale = deg2rad(EarthRotationSpeed * dt / 1000);
    let rx = earth_star.posX;
    let ry = earth_star.posY;
    let rz = earth_star.posZ;
    let rr = Math.sqrt(rx*rx+ry*ry+rz*rz)
    let x2 = rr * Math.cos(speed_scale);
    let y2 = rr * Math.sin(speed_scale);
    // console.log(x2, y2);
    // console.log(x2-earth_star.posX, y2-earth_star.posY)
    // earth_star.move(x2-earth_star.posX, y2-earth_star.posY, 0);
  }, "rotate");
  earth_star.ring = earth_ring;
  return earth_star;
}

function drawMoon(parent_earth){
  // Rotation track
  let moon_ring = drawRing2D([0, 0, 0], {
    color: (..._)=>{return [1,1,1];},
    precision: CirclePrecision,
    parent: parent_earth,
    static: true
  }, 4);

  let moon_star = drawSphere([4, 0, 0], {
      color: (lat, lng, precision) => {
        let _fac  = Math.sin(lng*Math.PI/precision) + Math.cos(lat*Math.PI/precision);
        return [1.0 - (_fac/2), 1.0 - (_fac/2), 1.0 - (_fac/2)];
      },
      precision: CirclePrecision,
      parent: parent_earth,
  }, 1);
  moon_star.rotate([0,0,0], [0,-20, 70+180]); // making dark-side back to earth

  // Moon has same self-spin and rotation speed
  moon_star.registerTickHandler((dt)=>{
    if(!moon_star.realX){return;}
    const speed_scale = MoonRotationSpeed * dt / 1000;
    moon_star.move(-MoonRingRadius, 0, 0);
    mat4.rotate(moon_star.world_matrix, deg2rad(speed_scale), [0,0,1]);
    moon_star.move(MoonRingRadius, 0, 0);
  }, "rotate");
  moon_star.ring = moon_ring;
  return moon_star;
}