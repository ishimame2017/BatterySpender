precision mediump float;

varying vec2 loc; // destination location
uniform sampler2D src; // previous attractor
uniform sampler2D funcs; // data of functions
uniform int num; // number of functions

/*---- convert plane-to-texture -------*/
float T(float x) { // plane to texture
  return x/sqrt(1.0+x*x)*0.5+0.5;
}
vec2 T(vec2 p) { return vec2(T(p.x),T(p.y)); }
float P(float s) { // texture to plane
  float u=2.0*s-1.0;
  return u/sqrt(1.0-u*u);
}
vec2 P(vec2 s) { return vec2(P(s.x),P(s.y)); }

/*---------------- w -----------------*/
// w’s parameters
vec4 color = vec4(0);
vec2 wx = vec2(0);
vec2 wy = vec2(0);
vec2 wo = vec2(0);
float jacobian(vec2 t) {
  return 1.0/(wx.x*wy.y - wx.y*wy.x);
}
vec4 f(vec2 inv) {
  float area=1e-2+abs(jacobian(inv));
  inv = inv - wo;
  vec2 t=T(wx*inv.x+wy*inv.y+wo);
  //return (exp2(texture2D(src,t)*20.0)-1.0)/area;
  return texture2D(src,t)/area;
}
vec4 inverse(vec2 p) {
  return f(p);
}

/* Combined inverse-sampling function */
vec4 sum_inverses(vec2 p) {
  int i;
  float ii,x,y;
  vec2 t;
  vec4 c;
  vec4 sum=vec4(0);
  for (int i=0;i<85;i++) {
    if (i>=num)
      break;

    ii = float(3*i+0);
    t.x = mod(ii, 16.0) / 16.0;
    t.y = floor(ii / 16.0) / 16.0;
    c = texture2D(funcs,t);
    wx.x = c.x;
    wx.y = c.y;
    wy.x = c.z;

    ii = float(3*i+1);
    t.x = mod(ii, 16.0) / 16.0;
    t.y = floor(ii / 16.0) / 16.0;
    c = texture2D(funcs,t);
    wy.y = c.x;
    wo.x = c.y;
    wo.y = c.z;

    ii = float(3*i+2);
    t.x = mod(ii, 16.0) / 16.0;
    t.y = floor(ii / 16.0) / 16.0;
    c = texture2D(funcs,t);
    color.x = c.x;
    color.y = c.y;
    color.z = c.z;
    color.w = 1.0;

    // color mixing... difficult.
    c = inverse(p);
    if ((c.x+c.y+c.z)>0.0) {
        c = 0.8*color + 0.2*c;
    } else {
        c = vec4(0);
    }
    sum = (float(i)*sum + c);
    //sum = (float(i)*sum + c) / float(i+1);
  }
  float max = 0.0;
  if (max<sum.x) max = sum.x;
  if (max<sum.y) max = sum.y;
  if (max<sum.z) max = sum.z;
  sum /= max;
  sum.w = 1.0;
  return sum;
}

void main(void) {
  gl_FragColor = sum_inverses(P(loc));
}
